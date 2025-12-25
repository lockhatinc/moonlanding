# MWR Permission Hierarchy - API Testing Guide

## Quick Reference

### Test Users Setup

```bash
# Partner User (Full Access)
PARTNER_ID="partner-001"
PARTNER_EMAIL="partner@company.com"
PARTNER_ROLE="partner"

# Manager User (Limited Access)
MANAGER_ID="manager-001"
MANAGER_EMAIL="manager@company.com"
MANAGER_ROLE="manager"

# Clerk User (View-Only)
CLERK_ID="clerk-001"
CLERK_EMAIL="clerk@company.com"
CLERK_ROLE="clerk"
```

---

## API Test Cases

### TEST 54: Partner Operations (All Should Return 200)

#### 54.1: Create Review

```bash
curl -X POST http://localhost:3000/api/mwr/review \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "engagement_id": "eng-001",
    "title": "Q4 2024 Review",
    "description": "Partner created review",
    "deadline": 1704067200
  }'

# Expected: 200 OK
# {
#   "status": "ok",
#   "data": {
#     "id": "review-001",
#     "title": "Q4 2024 Review",
#     "created_by": "partner-001",
#     ...
#   }
# }
```

#### 54.2: Edit Review

```bash
curl -X PATCH http://localhost:3000/api/mwr/review/review-001 \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q4 2024 Review (Updated)",
    "description": "Updated description"
  }'

# Expected: 200 OK
```

#### 54.3: Add Checklist

```bash
curl -X POST http://localhost:3000/api/mwr/checklist \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "review-001",
    "section": "Financial Controls"
  }'

# Expected: 200 OK
```

#### 54.4: Add Checklist Items

```bash
curl -X POST http://localhost:3000/api/mwr/checklist_item \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checklist_id": "checklist-001",
    "name": "Review financial statements",
    "description": "Verify Q4 financial statements",
    "is_done": false
  }'

# Expected: 200 OK
```

#### 54.5: Upload Attachment

```bash
curl -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -F "review_id=review-001" \
  -F "file=@/path/to/document.pdf"

# Expected: 200 OK
# {
#   "id": "attachment-001",
#   "file_name": "document.pdf",
#   "created_by": "partner-001",
#   ...
# }
```

#### 54.6: Delete Attachment

```bash
curl -X DELETE http://localhost:3000/api/files/attachment-001 \
  -H "Authorization: Bearer PARTNER_TOKEN"

# Expected: 200 OK
```

#### 54.7: Add Flag

```bash
curl -X POST http://localhost:3000/api/mwr/flag \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "review-001",
    "flag_type": "missing_signature"
  }'

# Expected: 200 OK
# {
#   "id": "flag-001",
#   "flag_type": "missing_signature",
#   "created_by": "partner-001"
# }
```

#### 54.8: Create Highlight

```bash
curl -X POST http://localhost:3000/api/mwr/highlight \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "review-001",
    "page": 1,
    "x": 100,
    "y": 200,
    "width": 150,
    "height": 50,
    "color": "grey",
    "notes": "Needs clarification"
  }'

# Expected: 200 OK
# {
#   "id": "highlight-001",
#   "status": "unresolved",
#   "created_by": "partner-001"
# }
```

#### 54.9: Resolve Own Highlight

```bash
curl -X POST http://localhost:3000/api/mwr/highlight/highlight-001/action \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resolve_highlight",
    "notes": "Reviewed and approved"
  }'

# Expected: 200 OK
# {
#   "id": "highlight-001",
#   "status": "resolved",
#   "resolved_by": "partner-001",
#   "color": "green"
# }
```

#### 54.10: Resolve Any Highlight (Manager-Created)

```bash
# First, create a highlight as manager
# Then partner resolves it
curl -X POST http://localhost:3000/api/mwr/highlight/highlight-002/action \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resolve_highlight",
    "notes": "Manager highlight resolved by partner"
  }'

# Expected: 200 OK
# Partner can resolve ANY highlight regardless of creator
```

#### 54.11: Set Deadline

```bash
curl -X PATCH http://localhost:3000/api/mwr/review/review-001 \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deadline": 1704153600
  }'

# Expected: 200 OK
```

#### 54.12: Archive Review

```bash
curl -X PATCH http://localhost:3000/api/mwr/review/review-001/action \
  -H "Authorization: Bearer PARTNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "archive"
  }'

# Expected: 200 OK
# {
#   "id": "review-001",
#   "status": "archived"
# }
```

---

### TEST 55: Manager Operations (Mixed Success/Failure)

#### 55.1: Create Review (PASS - 200)

```bash
curl -X POST http://localhost:3000/api/mwr/review \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "engagement_id": "eng-001",
    "title": "Manager Review",
    "description": "Created by manager"
  }'

# Expected: 200 OK
```

#### 55.2: Edit Review (PASS - 200)

```bash
curl -X PATCH http://localhost:3000/api/mwr/review/review-002 \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Manager Review (Updated)"
  }'

# Expected: 200 OK
```

#### 55.3: Add Checklist (PASS - 200)

```bash
curl -X POST http://localhost:3000/api/mwr/checklist \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "review-002",
    "section": "Documentation"
  }'

# Expected: 200 OK
```

#### 55.4: Apply Flag (PASS - 200)

```bash
curl -X POST http://localhost:3000/api/mwr/flag \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "review-002",
    "flag_type": "priority"
  }'

# Expected: 200 OK
# Special case: Manager can APPLY flags (not in config, but in code)
```

#### 55.5: Upload Attachment (PASS - 200)

```bash
curl -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -F "review_id=review-002" \
  -F "file=@/path/to/document.pdf"

# Expected: 200 OK
```

#### 55.6: Delete Partner's Attachment (FAIL - 403)

```bash
# Trying to delete an attachment created by partner
curl -X DELETE http://localhost:3000/api/files/attachment-001 \
  -H "Authorization: Bearer MANAGER_TOKEN"

# Expected: 403 Forbidden
# {
#   "error": "Permission denied: file.delete",
#   "status": "FORBIDDEN",
#   "code": 403
# }
```

#### 55.7: Resolve Own Highlight (PASS - 200)

```bash
# Manager resolves their own highlight
curl -X POST http://localhost:3000/api/mwr/highlight/highlight-003/action \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resolve_highlight",
    "notes": "Resolved by manager"
  }'

# Expected: 200 OK
# Highlight must be created_by: manager-001
```

#### 55.8: Resolve Partner's Highlight (FAIL - 403)

```bash
# Manager tries to resolve highlight created by partner
curl -X POST http://localhost:3000/api/mwr/highlight/highlight-001/action \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resolve_highlight",
    "notes": "Try to resolve partner highlight"
  }'

# Expected: 403 Forbidden
# {
#   "error": "Permission denied: highlight.manage_highlights_own",
#   "status": "FORBIDDEN",
#   "code": 403,
#   "details": "Cannot manage highlights created by other users"
# }
```

#### 55.9: Set Deadline (PASS - 200)

```bash
curl -X PATCH http://localhost:3000/api/mwr/review/review-002 \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deadline": 1704153600
  }'

# Expected: 200 OK
# Manager has 'edit' permission, which includes deadline setting
```

#### 55.10: Archive Review (FAIL - 403)

```bash
curl -X PATCH http://localhost:3000/api/mwr/review/review-002/action \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "archive"
  }'

# Expected: 403 Forbidden
# {
#   "error": "Permission denied: review.archive",
#   "status": "FORBIDDEN",
#   "code": 403
# }
```

---

### TEST 56: Clerk Operations (Limited Success)

#### 56.1: View Assigned Review (PASS - 200)

```bash
# Clerk viewing a review assigned to them
curl -X GET http://localhost:3000/api/mwr/review/review-003 \
  -H "Authorization: Bearer CLERK_TOKEN"

# Expected: 200 OK (if assigned_to = clerk-001)
# Row-level access control enforced
```

#### 56.2: Create Review (FAIL - 403)

```bash
curl -X POST http://localhost:3000/api/mwr/review \
  -H "Authorization: Bearer CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "engagement_id": "eng-001",
    "title": "Clerk Review"
  }'

# Expected: 403 Forbidden
# {
#   "error": "Cannot create review",
#   "status": "FORBIDDEN",
#   "code": 403
# }
```

#### 56.3: Edit Review (FAIL - 403)

```bash
curl -X PATCH http://localhost:3000/api/mwr/review/review-003 \
  -H "Authorization: Bearer CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clerk Edit Attempt"
  }'

# Expected: 403 Forbidden
```

#### 56.4: Add Checklist (FAIL - 403)

```bash
curl -X POST http://localhost:3000/api/mwr/checklist \
  -H "Authorization: Bearer CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "review-003",
    "section": "Section"
  }'

# Expected: 403 Forbidden
```

#### 56.5: Upload Attachment (FAIL - 403)

```bash
curl -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer CLERK_TOKEN" \
  -F "review_id=review-003" \
  -F "file=@/path/to/document.pdf"

# Expected: 403 Forbidden
```

#### 56.6: View Flags (PASS - 200)

```bash
# Clerk viewing flags on assigned review
curl -X GET http://localhost:3000/api/mwr/review/review-003/flags \
  -H "Authorization: Bearer CLERK_TOKEN"

# Expected: 200 OK
# Returns list of flags (read-only access)
```

#### 56.7: Apply Flag (FAIL - 403)

```bash
curl -X POST http://localhost:3000/api/mwr/flag \
  -H "Authorization: Bearer CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "review-003",
    "flag_type": "needs_review"
  }'

# Expected: 403 Forbidden
```

#### 56.8: Create Highlight (FAIL - 403)

```bash
curl -X POST http://localhost:3000/api/mwr/highlight \
  -H "Authorization: Bearer CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "review-003",
    "page": 1,
    "x": 100,
    "y": 200
  }'

# Expected: 403 Forbidden
```

#### 56.9: Resolve Highlight (FAIL - 403)

```bash
curl -X POST http://localhost:3000/api/mwr/highlight/highlight-001/action \
  -H "Authorization: Bearer CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resolve_highlight",
    "notes": "Clerk tries to resolve"
  }'

# Expected: 403 Forbidden
```

#### 56.10: View Checklist (PASS - 200)

```bash
# Clerk viewing checklist on assigned review
curl -X GET http://localhost:3000/api/mwr/review/review-003/checklists \
  -H "Authorization: Bearer CLERK_TOKEN"

# Expected: 200 OK
# Returns checklist items (read-only)
```

---

## HTTP Status Code Reference

### Success (2xx)

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Permission granted, operation succeeded |
| 201 | Created | Resource created successfully |

### Client Error (4xx)

| Code | Meaning | Permission Context |
|------|---------|-------------------|
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | Permission denied (role/ownership) |
| 404 | Not Found | Resource doesn't exist |
| 400 | Bad Request | Invalid parameters |

### Permission Error Response Format

```json
{
  "error": "Permission denied: [entity].[action]",
  "status": "FORBIDDEN",
  "code": 403,
  "details": "Optional explanation",
  "timestamp": "2025-12-25T12:00:00Z"
}
```

---

## Testing Authorization Headers

### Get Partner Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "partner@company.com",
    "password": "password123"
  }'

# Response:
# {
#   "token": "eyJhbGc...",
#   "user": { "id": "partner-001", "role": "partner", ... }
# }

PARTNER_TOKEN="eyJhbGc..."
```

### Get Manager Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com",
    "password": "password123"
  }'

MANAGER_TOKEN="eyJhbGc..."
```

### Get Clerk Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "clerk@company.com",
    "password": "password123"
  }'

CLERK_TOKEN="eyJhbGc..."
```

---

## Verification Checklist

Use this checklist to verify permission enforcement:

### Partner Permissions

- [ ] Create review (200)
- [ ] Edit review (200)
- [ ] Delete review (200)
- [ ] Archive review (200)
- [ ] Add checklist (200)
- [ ] Add checklist item (200)
- [ ] Upload attachment (200)
- [ ] Delete attachment (200)
- [ ] Apply flag (200)
- [ ] Create highlight (200)
- [ ] Resolve own highlight (200)
- [ ] Resolve others' highlight (200)
- [ ] Set deadline (200)
- [ ] Manage collaborators (200)

### Manager Permissions

- [ ] Create review (200)
- [ ] Edit review (200)
- [ ] Try delete review (403)
- [ ] Try archive review (403)
- [ ] Add checklist (200)
- [ ] Upload attachment (200)
- [ ] Try delete others' attachment (403)
- [ ] Apply flag (200)
- [ ] Create highlight (200)
- [ ] Resolve own highlight (200)
- [ ] Try resolve others' highlight (403)
- [ ] Set deadline (200)
- [ ] Try manage all collaborators (403)
- [ ] Manage own collaborators (200)

### Clerk Permissions

- [ ] View assigned review (200)
- [ ] Try create review (403)
- [ ] Try edit review (403)
- [ ] Try delete review (403)
- [ ] Try add checklist (403)
- [ ] Try upload attachment (403)
- [ ] View flags (200)
- [ ] Try apply flag (403)
- [ ] Try create highlight (403)
- [ ] Try resolve highlight (403)
- [ ] View checklist (200)
- [ ] Try view unassigned review (403)

---

## Integration with CI/CD

### Run Permission Tests in Pipeline

```bash
# Install dependencies
npm install better-sqlite3

# Run test suite
node test-mwr-permissions.js

# Check exit code
if [ $? -eq 0 ]; then
  echo "All permission tests PASSED"
else
  echo "Permission tests FAILED"
  exit 1
fi
```

### Expected Output

```
RESULT: PASS - All permission checks enforced correctly

Key Findings:
✓ Partner role: Full access to create, edit, delete, archive, manage all
✓ Manager role: Can create/edit, manage only own highlights, cannot archive
✓ Clerk role: View-only access, cannot create or modify any entities
✓ All permission checks enforced at API level (403 Forbidden returned)
✓ Ownership checks validated for "_own" permissions
```

---

## Troubleshooting

### Issue: Manager Can't Apply Flags

**Problem:** Manager gets 403 when applying flags
**Solution:** Check permission.service.js line 268:
```javascript
if (user.role === 'manager' && context.operation === 'apply') return true;
```
Ensure `context.operation === 'apply'` is passed in the request.

### Issue: Clerk Gets 200 on Create Review

**Problem:** Clerk should be denied but gets 200
**Solution:** Verify `review_collaboration` template in master-config.yml:
```yaml
review_collaboration:
  clerk:
    - list
    - view
    - view_assigned
```
Ensure "create" is NOT in clerk permissions.

### Issue: Partner Can't Resolve Others' Highlights

**Problem:** Partner should be able to resolve any highlight
**Solution:** Check permission.service.js line 248:
```javascript
if (user.role === 'partner') return true;
```
Partner should NOT need ownership check for highlight resolution.

---

## Related Documentation

- [MWR Permission Test Results](./MWR-PERMISSION-TEST-RESULTS.md)
- [Permission Service Implementation](./src/services/permission.service.js)
- [Permission Config](./src/config/master-config.yml#L84-L108)
- [CLAUDE.md - Permissions Section](./CLAUDE.md#permissions)
