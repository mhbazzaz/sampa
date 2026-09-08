# Technical Changes - Public/Private Request Specs

## Files Modified

### Entities
- **[request-spec-item.entity.ts](file:///Users/mohammadbazzaz/Desktop/projects/sampa/sampa/src/spec/entities/request-spec-item.entity.ts)**
  - Added `isPublic` column (boolean, default: true)
  - Added `isBaseSpec` column (boolean, default: false)

### DTOs
- **[create-spec-item.dto.ts](file:///Users/mohammadbazzaz/Desktop/projects/sampa/sampa/src/spec/dto/input/create-spec-item.dto.ts)**
  - Added `isPublic` optional boolean field (admin input)
  - Added `isBaseSpec` optional boolean field (admin input)
  
- **[update-spec-item.dto.ts](file:///Users/mohammadbazzaz/Desktop/projects/sampa/sampa/src/spec/dto/input/update-spec-item.dto.ts)**
  - Added `isPublic` optional boolean field with ValidateIf
  - Added `isBaseSpec` optional boolean field with ValidateIf

### Services
- **[request-spec-item.service.ts](file:///Users/mohammadbazzaz/Desktop/projects/sampa/sampa/src/spec/services/request-spec-item.service.ts)**
  - Added `CategoryEnum` import
  - Added `Role` import
  - `update()` method: added handling for `isPublic` and `isBaseSpec` fields
  - `findAllPaginationUserScope()` method: added `memberRoles` parameter and visibility filtering logic

- **[assessment-request.service.ts](file:///Users/mohammadbazzaz/Desktop/projects/sampa/sampa/src/assessment/services/assessment-request.service.ts)**
  - Added `CategoryEnum` import
  - `provideSpecs()` method: added visibility filtering based on user category

### Controllers
- **[request-spec-item.controller.ts](file:///Users/mohammadbazzaz/Desktop/projects/sampa/sampa/src/spec/controllers/request-spec-item.controller.ts)**
  - Added imports for `AuthorizationGuard`, `SetMetadata`, `CurrentMemberRoles`, `Role`, `ActionEnum`, `AuthorizationMetaDataEnum`, `ProcessEnum`
  - Modified `GET /spec-item` endpoint:
    - Added `AuthorizationGuard` guard
    - Added `@SetMetadata` decorators for action/process
    - Added `@CurrentMemberRoles() memberRoles` parameter
    - Passes `memberRoles` to `findAllPaginationUserScope()` service method

### Migrations
- **[1785000000000-add-request-spec-visibility-fields.ts](file:///Users/mohammadbazzaz/Desktop/projects/sampa/sampa/src/database/migrations/1785000000000-add-request-spec-visibility-fields.ts)** (NEW FILE)
  - Adds `isPublic` and `isBaseSpec` columns to `request_spec_item` table

## Behavior Changes

### Before
- All RequestSpecItems were visible to all users
- No distinction between Applicant and Security Dept spec visibility

### After
- **External users (Applicant/ApplicantManager)**: Only see specs where `isPublic=true`
- **Internal users (Security Dept)**: See all specs regardless of `isPublic` value
- Spec completion validation in `provideSpecs` respects the same visibility rules

## API Usage

### Admin - Create Request Spec (with visibility)
```http
POST /admin/spec-item
Content-Type: application/json

{
  "name": "Security Checklist",
  "description": "Internal security verification items",
  "isPublic": false,
  "isBaseSpec": false,
  ...
}
```

### User - Get Visible Specs
```http
GET /spec-item?assetTypeId=...&environmentId=...
Authorization: Bearer <user_token>
Response: Returns only specs user is allowed to see based on their role category
```