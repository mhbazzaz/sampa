# Action Log Buffer Flow

## Purpose

This document explains how the buffered audit logging feature works after the introduction of the `pending_changes` table.

The goal of this feature is to prevent business edits from being lost before a workflow transition is recorded, while still keeping `action_log` as the final and authoritative audit table.

In short:

- `PendingChange` stores edit events temporarily
- `ActionLog` stores the final audit record
- `ActionLogBufferService.addChange()` buffers changes
- `ActionLogBufferService.flushToActionLog()` finalizes them into one `ActionLog` row

## Main Idea

There are 2 different kinds of events in this system:

1. Data edits
2. Workflow state transitions

Examples of data edits:

- updating a testcase content
- creating or updating a spec content
- creating a remediation

Examples of workflow state transitions:

- moving an assessment request from one request state to another
- moving an assessment layer from one layer state to another

The system now separates these two concerns:

- data edits are buffered first in `pending_changes`
- state transitions flush the buffered edits into a final `action_log` row

This creates a clearer audit timeline:

- the user edits content multiple times
- those edits accumulate in `pending_changes`
- when the business action is finalized by a workflow action, all pending changes are written into `action_log`

## Entities

### `PendingChange`

File: [pending-change.entity.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/action-log/entities/pending-change.entity.ts)

This table is a temporary storage layer.

It stores:

- `assessmentRequestId`
- `assessmentLayerId`
- `entityType`
- `beforeEntity`
- `updateDto`
- `userId`
- `ipAddress`
- `assessmentRequestCurrentStateId`
- `assessmentRequestNextStateId`
- `assessmentLayerCurrentStateId`
- `assessmentLayerNextStateId`
- `isFlushed`

Important note:

- `isFlushed = false` means this buffered change has not yet been finalized into `action_log`
- `isFlushed = true` means it has already been transferred into `action_log`

### `ActionLog`

File: [action-log.entity.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/action-log/entities/action-log.entity.ts)

This is the final audit table.

It stores:

- actor information
- request and layer identifiers
- workflow action
- request current and next state
- layer current and next state
- enriched list of field changes in `changes`
- execution status

This table is the final source of truth for audit history.

## Why `PendingChange` Exists

Before buffering, the system could create audit rows too early or in the wrong place in the business flow.

That caused a mismatch between:

- content changes
- request/layer state transitions
- final audit meaning

The new flow solves that by letting edits happen first, while waiting for the next meaningful workflow action to finalize the audit row.

## Service Responsibilities

### `ActionLogBufferService.addChange()`

File: [action-log-buffer.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/action-log/services/action-log-buffer.service.ts)

This method is called when the system changes business data but does not want to create the final audit row yet.

It writes one row into `pending_changes`.

Inputs:

- key
  - `assessmentRequestId`
  - optional `assessmentLayerId`
- details
  - `entityType`
  - `beforeEntity`
  - `updateDto`
  - `userId`
  - optional `ipAddress`
  - request/layer state snapshot fields

What it saves:

- the edit payload
- the actor
- the request/layer scope
- the workflow state snapshot at the moment of buffering

### `ActionLogBufferService.flushToActionLog()`

File: [action-log-buffer.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/action-log/services/action-log-buffer.service.ts)

This method is called when the system performs a workflow action and wants to finalize audit history.

Its job:

1. Load all not-yet-flushed `PendingChange` rows for the given request/layer key
2. Resolve the state IDs that must be written to `ActionLog`
3. Build enriched field-level changes
4. Create one `ActionLog` row
5. Mark buffered rows as flushed

If there are no pending changes:

- it still creates an `ActionLog`
- that row represents a pure workflow transition with no buffered content edits

## How State IDs Are Preserved

This is the most important part of the feature.

The important workflow fields are:

- `assessmentRequestCurrentStateId`
- `assessmentRequestNextStateId`
- `assessmentLayerCurrentStateId`
- `assessmentLayerNextStateId`

These fields now exist in both:

- `PendingChange`
- `ActionLog`

### Why This Matters

If a user edits content before the final state transition happens, the audit system still needs to remember the workflow state context in which that edit happened.

Without storing these fields in `PendingChange`, the system could lose that context during buffering.

### Current Rule

When `addChange()` is called:

- the caller should pass the request/layer state snapshot that is valid at that moment
- this state snapshot is saved directly in `pending_changes`

When `flushToActionLog()` is called:

- if explicit state IDs are passed in `logData`, those values win
- otherwise the service falls back to the latest non-null state values from buffered `PendingChange` rows

This fallback logic is implemented inside `resolveStateIds()`.

That means:

- pure state-transition flows still write exact transition states directly
- buffered data-edit flows still preserve their state context even before final flush

## Request Scope vs Layer Scope

The buffer key always contains:

- `assessmentRequestId`

It may also contain:

- `assessmentLayerId`

This creates two kinds of buffered audit scopes:

### Request-scoped buffer

Used when the edit belongs to the whole request.

Examples:

- request-level spec content edits
- testcase content linked only at request level
- remediation changes tied to a request-level testcase content

For request-scoped rows:

- `assessmentLayerId = null`

### Layer-scoped buffer

Used when the edit belongs to a specific layer.

Examples:

- layer-specific spec content edits
- layer-specific workflow transitions

For layer-scoped rows:

- `assessmentLayerId` is set

## Change Enrichment

Buffered rows do not directly store the final human-readable audit changes.

Instead, each `PendingChange` stores:

- `beforeEntity`
- `updateDto`
- `entityType`

During flush, the service chooses the correct changelog config using `getConfigForEntity()`.

Examples:

- `request` uses assessment request config
- `layer` uses assessment layer config
- `spec` uses request spec content config
- `testcase` uses testcase content config
- `remediate` uses testcase remediate config

Then `GenericChangelogService.buildAndEnrichChangeLog()` converts the raw diff into enriched audit entries.

The final enriched list is written into `ActionLog.changes`.

### Correct Content Mapping

The content entities now use their own dedicated changelog configs.

That means:

- buffered `testcase` history is generated from testcase content fields such as `observations`, `proves`, `references`, `suggestions`, `criticality`, `status`, and `testcaseItemId`
- buffered `spec` history is generated from request spec content fields such as `value`, `assessmentRequestId`, and `requestSpecItemId`

This is important because these content entities are different from their master-data definition entities:

- `TestcaseContent` is different from `TestcaseItem`
- `RequestSpecContent` is different from `RequestSpecItem`

Without this separation, the final `ActionLog.changes` list could be incomplete or misleading.

The dedicated config methods are implemented in:

- [change-log-configs.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/action-log/services/change-log-configs.ts)

## Concurrency Safety

File: [action-log-buffer.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/action-log/services/action-log-buffer.service.ts)

`flushToActionLog()` now supports flexible transaction management.

### Current Strategy

The method can work in two modes:

1. **Standalone mode** (no external QueryRunner): Creates and manages its own transaction
2. **Integrated mode** (external QueryRunner provided): Uses the caller's transaction context

The sequence in standalone mode:

1. Create a query runner
2. Start a transaction
3. Read pending changes for that scope
4. Resolve state ids
5. Build enriched changes
6. Save the final `ActionLog`
7. Mark the matching `PendingChange` rows as flushed
8. Commit the transaction

If an error happens:

- the transaction is rolled back (only if managed internally)
- no partial flush is kept

### Why This Works

By allowing callers to pass their own QueryRunner, the flush operation can participate in larger business transactions. This:

- Ensures atomicity between business state changes and audit logging
- Eliminates the need for advisory locks since the operation is atomic within the caller's transaction
- Simplifies the code by removing PostgreSQL-specific locking

When called without a QueryRunner, the method manages its own transaction, ensuring the flush operation is still atomic.

### Migration from Previous Version

The previous version used PostgreSQL advisory transaction locks (`pg_advisory_xact_lock`) to prevent concurrent flushes. This has been removed because:

1. The lock added database-specific complexity
2. When integrated with caller transactions, atomicity is guaranteed by the transaction itself
3. In standalone mode, the likelihood of concurrent flushes is minimal, and even if they occur, the worst case is duplicate ActionLog entries (not data corruption)
4. Simpler code is easier to maintain and understand

## Implemented Call Sites

### Buffering data edits

These flows use `addChange()`:

- [request-spec-content.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/spec/services/request-spec-content.service.ts)
- [test-case-content.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/test-case/services/test-case-content.service.ts)
- [test-case-remediate.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/test-case-remediate/services/test-case-remediate.service.ts)

These services now pass state snapshot values into the buffer.

For non-transition edits, current and next state are usually stored as the same value because the workflow state itself did not change during the content edit.

### Flushing workflow transitions

These flows use `flushToActionLog()`:

- [assessment-request.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/assessment/services/assessment-request.service.ts)
- [assessment-layer.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/assessment/services/assessment-layer.service.ts)
- [assessment-layer.repository.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/assessment/repositories/assessment-layer.repository.ts)

These services pass explicit transition state values into `flushToActionLog()`.

That guarantees the final `ActionLog` row contains the exact state transition that occurred.

## End-to-End Example

### Example 1: Request-level spec content update

1. User updates a spec content
2. `RequestSpecContentService` saves the content
3. `addChange()` stores one row in `pending_changes`
4. That row includes:
   - request id
   - no layer id
   - `entityType = spec`
   - state snapshot at edit time
5. Later, a workflow action transitions the request or related layer
6. `flushToActionLog()` loads all pending rows for that scope
7. It builds enriched field diffs
8. It writes one final `ActionLog`
9. It marks those buffered rows as flushed

### Example 2: Pure state transition without data edits

1. User performs a workflow action
2. There are no pending rows for that scope
3. `flushToActionLog()` detects that no buffered edits exist
4. It still creates an `ActionLog`
5. The row contains the state transition fields and metadata, but no `changes` list

### Example 3: Layer-scoped buffered edit

1. User edits data linked to a specific layer
2. `addChange()` stores:
   - `assessmentRequestId`
   - `assessmentLayerId`
   - layer state snapshot
3. Later, the layer transitions
4. `flushToActionLog()` writes one final `ActionLog`
5. The row contains both:
   - the layer state transition
   - the enriched data changes that happened before the transition

## Cleanup

File: [action-log-buffer.service.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/action-log/services/action-log-buffer.service.ts)

Old flushed rows are deleted by:

- `cleanupFlushedChanges()`

The scheduled cleanup job calls this method and removes old `PendingChange` rows where:

- `isFlushed = true`
- `createdAt` is older than the configured retention period

This keeps `pending_changes` small while preserving the long-term audit history in `action_log`.

## Database Migrations

Initial table creation:

- [1715200000000-create-pending-changes-table.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/migrations/1715200000000-create-pending-changes-table.ts)

Added state snapshot columns:

- [1715200001000-add-state-columns-to-pending-changes.ts](file:///Users/mohammadbazzaz/Desktop/sampa/sampa/src/migrations/1715200001000-add-state-columns-to-pending-changes.ts)

## Important Guarantees

After these changes, the system guarantees:

- buffered edits are durable before final flush
- `ActionLog` remains the final audit table
- request/layer state context is preserved in `PendingChange`
- transition state values are preserved in `ActionLog`
- explicit transition values override buffered fallback values
- buffered `testcase` and `spec` histories are built from the correct content-level fields
- flush is serialized per request/layer scope to prevent duplicate concurrent history creation
- buffered rows are not deleted immediately after flush, only marked as flushed
- cleanup only removes already-flushed rows

## Current Limitation

The buffer is designed around:

- `assessmentRequestId`
- optional `assessmentLayerId`

So it is naturally suited for request/layer-scoped business events.

It is not yet a general-purpose audit buffer for completely global admin master data that has no request or layer scope.

Examples of such global data:

- testcase item definitions
- testcase group definitions
- spec item definitions
- spec group definitions

If those entities also need the same buffering strategy, the design should be extended explicitly instead of forcing them into request/layer scope.

## Recommended Mental Model

Use this model when thinking about the feature:

- `PendingChange` is the inbox
- `ActionLog` is the official ledger
- `addChange()` puts raw business edits into the inbox
- `flushToActionLog()` publishes the official audit event

That is the core design of this feature.
