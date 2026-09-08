# Public/Private Request Specs

## Overview
Request Spec system now supports two visibility modes:

- **Public (عمومی)** - Visible to all users (Applicants/ApplicantManagers). These are general requirement fields that can be filled in the initial request page before submitting to CISO.
- **Private (محرمانه)** - Visible only to Security Department users (INTERNAL category roles). These are Auditor/Security-only specifications that are completed after initial submission.

## Fields Added to RequestSpecItem

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isPublic` | boolean | `true` | If `true`, spec is visible to Applicants. If `false`, only Security Dept can view it. |
| `isBaseSpec` | boolean | `false` | If `true`, spec must be completed in the initial request page (before CISO submission). |

## How It Works

### For Applicants (EXTERNAL Category)
1. When accessing `GET /spec-item` - only specs with `isPublic=true` are returned
2. When calling `provide-spec` in assessment-request service - only public specs are validated

### For Security Dept (INTERNAL Category)
1. When accessing `GET /spec-item` - ALL specs are returned (public + private)
2. When calling `provide-spec` - all specs are validated regardless of visibility

## Admin Panel Configuration

Admins can set visibility when creating/updating Request Specs:

**Create Endpoint:** `POST /admin/spec-item`
```json
{
  "isPublic": true,
  "isBaseSpec": false,
  ...
}
```

**Update Endpoint:** `PATCH /admin/spec-item/:id`
```json
{
  "isPublic": false,
  "isBaseSpec": true
}
```

## Flow Diagram

```
Applicant creates Request
         ↓
Fills Base/Public Specs (isPublic=true OR isBaseSpec=true)
         ↓
Submits to CISO
         ↓
Security Dept reviews and fills Private Specs (isPublic=false)
         ↓
Auditor completes full assessment
```

## Database Migration

Migration adds columns to `request_spec_item` table:
```sql
ALTER TABLE "request_spec_item"
ADD COLUMN "isPublic" boolean NOT NULL DEFAULT true,
ADD COLUMN "isBaseSpec" boolean NOT NULL DEFAULT false
```