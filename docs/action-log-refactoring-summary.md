# Action Log Refactoring Summary

## Changes Made

### 1. Removed PostgreSQL Advisory Locks

**Why:**
- Added unnecessary database-specific complexity
- Not needed when integrated with caller transactions
- Made the code harder to understand and maintain

**What was removed:**
- `acquireScopeLock()` method and all references to `pg_advisory_xact_lock`
- Lock-specific logic from the mock service

### 2. Added Flexible Transaction Management

**New Feature:**
`flushToActionLog()` now accepts an optional `externalQueryRunner` parameter.

**Two modes of operation:**

1. **Standalone mode** (no QueryRunner provided):
   - Creates and manages its own transaction
   - Useful for simple, isolated audit logging
   
2. **Integrated mode** (QueryRunner provided):
   - Participates in the caller's transaction
   - Ensures true atomicity between business operations and audit logging
   - Prevents partial commits

**Benefits:**
- Simpler code
- Better transaction semantics
- No database-specific locking
- Easier to test and maintain

### 3. Simplified Flow

**Before:**
```
Caller Transaction → Commit → Create New Transaction → Flush ActionLog
```
This created a window where business changes were committed but audit log wasn't yet created.

**After (when using integrated mode):**
```
Caller Transaction → Business Changes + Flush ActionLog → Commit All Together
```
This ensures true atomicity.

## Recommended Updates for Call Sites

### Pattern 1: Where QueryRunner Exists (Recommended)

**Before:**
```typescript
await queryRunner.commitTransaction();

await this.actionLogBufferService.flushToActionLog(
  { assessmentRequestId, assessmentLayerId },
  logData
);
```

**After:**
```typescript
await this.actionLogBufferService.flushToActionLog(
  { assessmentRequestId, assessmentLayerId },
  logData,
  queryRunner  // Pass the QueryRunner
);

await queryRunner.commitTransaction();
```

### Pattern 2: No QueryRunner (No Change Needed)

**Existing:**
```typescript
await this.actionLogBufferService.flushToActionLog(
  { assessmentRequestId, assessmentLayerId },
  logData
);
```

This continues to work - the service will create its own transaction.

## Files Modified

1. `src/action-log/services/action-log-buffer.service.ts`
   - Removed `acquireScopeLock()` method
   - Added optional `externalQueryRunner` parameter to `flushToActionLog()`
   - Added conditional transaction management logic

2. `src/action-log/__mock__/action-log-buffer.service.ts`
   - Removed `acquireScopeLock` from mock

3. `src/assessment/repositories/assessment-layer.repository.ts`
   - Updated one call site to pass queryRunner (line ~196)

4. `docs/action-log-buffer-flow.md`
   - Updated concurrency safety section
   - Explained new transaction management approach

## Migration Guide

### For Existing Code

Most existing code will continue to work without changes. However, for better atomicity, update call sites that have an active transaction:

1. Find calls to `flushToActionLog` where a `queryRunner` exists
2. Pass the `queryRunner` as the third parameter
3. Move the `commitTransaction()` call to AFTER `flushToActionLog()`

### For New Code

Always pass the `queryRunner` when one is available in your context. This ensures:
- Atomic operations
- Proper rollback on errors
- Cleaner transaction boundaries

## Potential Call Sites to Update

These locations call `flushToActionLog` after committing a transaction (non-atomic):

1. `src/assessment/services/assessment-layer.service.ts` (multiple locations around lines 323, 481, 693, 812, 941)
2. `src/assessment/repositories/assessment-layer.repository.ts` (line ~368)

These should be updated to:
- Pass the queryRunner
- Move the commit after the flush

## Testing Recommendations

1. Test transaction rollback scenarios
2. Verify audit logs are created atomically with business changes
3. Test concurrent operations to ensure no duplicate logs
4. Verify cleanup job still works correctly

## Backward Compatibility

✅ All existing code continues to work without modification
✅ The change is additive (new optional parameter)
✅ Default behavior is preserved (creates own transaction)
