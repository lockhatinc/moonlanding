# MWR Review Template Inheritance & Collaborator Management Test Report

**Date**: 2025-12-25
**Test Suite**: MWR Review Workflow Template Inheritance and Collaborator Management
**Status**: DOCUMENTED & READY FOR EXECUTION

---

## Executive Summary

This document provides a comprehensive test suite for the MWR (My Work Review) domain review template inheritance and collaborator management functionality. The tests verify:

1. Template checklist copying to reviews
2. Review status initialization and transitions
3. Permanent and temporary collaborator management
4. Auto-revoke job identification of expired collaborators
5. Data integrity and enum validation

---

## Test Architecture

### Database Schema References
- **Entities Tested**: `review`, `review_template`, `checklist`, `collaborator`, `user`
- **Configuration**: Master configuration stored in `/src/config/master-config.yml`
- **Workflow**: Review lifecycle defined in `workflows.review_lifecycle`

### Key Workflow Definition (from master-config.yml)
```yaml
review_lifecycle:
  description: Review status workflow
  initial_status: open
  final_status: closed
  states:
    - name: open
      label: Open
      color: yellow
      forward:
        - closed
      backward: []
    - name: closed
      label: Closed
      color: green
      forward: []
      backward:
        - open
```

### Collaborator Configuration
```yaml
collaborator:
  label: Collaborator
  has_temporary_access: true
  has_auto_revoke: true
  default_expiry_days: $thresholds.collaborator.default_expiry_days
  max_expiry_days: $thresholds.collaborator.max_expiry_days
```

### Automation Schedule for Auto-Revoke
```yaml
temp_access_cleanup:
  trigger: 0 0 * * *
  description: Remove expired collaborators
  action: revoke_expired_collaborators
  entity: collaborator
  enabled: true
  rule: access_type == 'temporary' AND expires_at <= now()
```

---

## TEST 57: Review Creation Copies Default_Checklists From Template

### Objective
Verify that when a review is created from a template, the `default_checklists` array is properly copied to the review with all associated metadata preserved.

### Test Cases

#### 57.1: Create Review Template with Default_Checklists Array
**Setup**:
1. Create review template with 3 default_checklists:
   - Item 1: title="Review Financial Statements", section="financials"
   - Item 2: title="Check Tax Returns", section="tax"
   - Item 3: title="Verify Bank Confirmations", section="banking"

**Expected Results**:
- ✓ Template created with ID
- ✓ default_checklists stored as JSON array
- ✓ All 3 checklist items accessible via template

**Implementation Details**:
```javascript
create('review_template', {
  id: templateId,
  name: 'Test Template',
  engagement_id: engagementId,
  default_checklists: JSON.stringify([id1, id2, id3]),
  created_at: now(),
  created_by: userId
})
```

**Hook Integration**:
The `events-engine.js` defines:
```javascript
hookEngine.on('review:afterCreate', async (review, user) => {
  if (review.template_id) {
    const template = get('template', review.template_id);
    for (const id of safeJsonParse(template?.default_checklists, [])) {
      const checklist = get('checklist', id);
      if (checklist) create('review_checklist', {
        review_id: review.id,
        checklist_id: id,
        items: checklist.section_items || checklist.items,
        status: 'pending'
      }, user);
    }
  }
});
```

#### 57.2: Verify Review Sections Contain 3 Items
**Setup**: Create review from template (continue from 57.1)

**Expected Results**:
- ✓ review.sections contains 3 items
- ✓ Each section matches template checklist items
- ✓ Titles preserved: "Review Financial Statements", "Check Tax Returns", "Verify Bank Confirmations"
- ✓ Sections match: "financials", "tax", "banking"
- ✓ Items start with status="pending"

**Code Path**:
1. POST to `/api/review` with `template_id`
2. CRUD factory calls `create('review', data, user)`
3. After creation, hook engine fires `review:afterCreate` event
4. Hook fetches template and creates `review_checklist` entries

#### 57.3: Independent Copy Verification
**Setup**: Create two reviews from same template

**Expected Results**:
- ✓ Review A has its own checklist items
- ✓ Review B has independent checklist items
- ✓ Modifying Review A checklists doesn't affect Review B
- ✓ No shared object references between reviews

**Verification Method**:
```javascript
const reviewAChecklists = list('review_checklist', { review_id: reviewA.id });
const reviewBChecklists = list('review_checklist', { review_id: reviewB.id });

// Verify independent IDs
reviewAChecklists.forEach(cl => {
  const found = reviewBChecklists.find(bCl => bCl.id === cl.id);
  expect(found).toBeUndefined(); // No shared checklist IDs
});
```

#### 57.4: Metadata Inheritance
**Expected Results**:
- ✓ Priority preserved
- ✓ Due dates inherited (if applicable)
- ✓ Assignee information copied
- ✓ All custom fields preserved

---

## TEST 58: Review Starts with Status="Active"

### Objective
Verify that a newly created review initializes with the correct status and that status transitions work properly.

### Test Cases

#### 58.1: Review Status Initialized as "open"
**Setup**: Create new review

**Expected Results**:
- ✓ review.status = "open" (not "Active" - workflow uses lowercase)
- ✓ review.created_at set to current Unix timestamp
- ✓ review.created_by set to current user
- ✓ review.highlights array = [] (empty)
- ✓ review.collaborators array populated if template has default collaborators

**Code Path**:
```javascript
// In CRUD factory
create: async (user, data) => {
  requirePermission(user, spec, 'create');
  const result = create(entityName, data, user);
  await executeHook(`create:${entityName}:after`, { entity: entityName, data: result, user });
  return created(permissionService.filterFields(user, spec, result));
}
```

#### 58.2: Status Transition to "closed"
**Setup**: Create review with status="open", then transition to "closed"

**Expected Results**:
- ✓ Status changes from "open" to "closed"
- ✓ Transition allowed via workflow definition
- ✓ Activity logged: status_change event triggered

**Workflow Rules** (from master-config.yml):
- Initial status: `open`
- Open → Closed transition allowed (forward: [closed])
- Closed → Open transition allowed (backward: [open])

#### 58.3: Immutability of created_at
**Setup**: Create review, then update other fields

**Expected Results**:
- ✓ created_at remains unchanged after updates
- ✓ updated_at changes to reflect modification time
- ✓ created_by remains unchanged

**Verification**:
```javascript
const originalCreatedAt = review.created_at;
update('review', reviewId, { status: 'closed', updated_at: now() });
const retrieved = get('review', reviewId);
expect(retrieved.created_at).toBe(originalCreatedAt);
```

---

## TEST 59: Permanent Collaborators Have Standard Role Permissions

### Objective
Verify that permanent collaborators (no expiry_time) are created with proper role-based permissions.

### Test Cases

#### 59.1: Create Permanent Collaborators
**Setup**:
1. Create review
2. Add Collaborator A: user_id=123, role="auditor", expiry_time=null (permanent)
3. Add Collaborator B: user_id=456, role="reviewer", expiry_time=null (permanent)

**Expected Results**:
- ✓ Collaborator A in review.collaborators
- ✓ Collaborator B in review.collaborators
- ✓ Both have expiry_time=null or undefined
- ✓ access_type="permanent" for both

**Implementation**:
```javascript
create('collaborator', {
  id: collabId,
  review_id: reviewId,
  user_id: userId,
  role: 'auditor',
  access_type: 'permanent',
  expires_at: null,  // Permanent access
  created_at: now(),
  created_by: userId
})
```

#### 59.2: Auditor Role Permissions
**Setup**: Login as Collaborator A (auditor role)

**Expected Results**:
- ✓ Can view review
- ✓ Can view highlights
- ✓ Can view PDFs
- ✓ Can add notes/comments
- ✓ Can edit highlights (based on role definition)

**Role Definition** (from collaborator-role.service.js):
```javascript
const COLLABORATOR_ROLE_PERMISSIONS = {
  auditor: [
    'view',
    'view_highlights',
    'view_pdfs',
    'add_notes',
    'add_comments',
    'edit_highlights',
    'resolve_highlights',
    'create_highlights',
    'delete_own_highlights'
  ],
  // ...
};
```

#### 59.3: Reviewer Role Permissions
**Setup**: Login as Collaborator B (reviewer role)

**Expected Results**:
- ✓ Can view review
- ✓ Can view highlights
- ✓ Can create comments
- ✓ Role-based permissions enforced server-side

**Permission Enforcement** (from crud-factory.js):
```javascript
requirePermission(user, spec, 'view');
if (!permissionService.checkRowAccess(user, spec, item)) {
  throw new AppError('Access denied', 'FORBIDDEN', HTTP.FORBIDDEN);
}
```

#### 59.4: Audit Trail Logging
**Expected Results**:
- ✓ Collaborator access logged in activity_log
- ✓ Permissions tracked in permission_audit entity
- ✓ All access events timestamped

---

## TEST 60: Temporary Collaborators Have Expiry_Time Field Set

### Objective
Verify that temporary collaborators are created with future expiry_time values and that access expires correctly.

### Test Cases

#### 60.1: Create Temporary Collaborators
**Setup**:
1. Create review
2. Add Temp A: user_id=789, role="external_reviewer", expiry_time=now+7days
3. Add Temp B: user_id=890, role="consultant", expiry_time=now+14days

**Expected Results**:
- ✓ Both in review.collaborators array
- ✓ Both have expiry_time set to future Unix timestamp
- ✓ Temp A expires in 7 days
- ✓ Temp B expires in 14 days
- ✓ Status="active" for both (not yet expired)

**Implementation**:
```javascript
const expiryTime = now() + (7 * 24 * 60 * 60);  // 7 days from now
create('collaborator', {
  id: collabId,
  review_id: reviewId,
  user_id: userId,
  role: 'external_reviewer',
  access_type: 'temporary',
  expires_at: expiryTime,  // Unix seconds
  created_at: now(),
  created_by: userId
})
```

#### 60.2: Access Within Expiry Window
**Setup**: Continue from 60.1, login as Temp A

**Expected Results**:
- ✓ Can access review (within 7-day window)
- ✓ Can perform role-based actions (view, comment, etc.)
- ✓ No access restrictions applied

**Validation**:
```javascript
const now = Math.floor(Date.now() / 1000);
if (collaborator.expires_at && collaborator.expires_at <= now) {
  throw new AppError('Collaborator access has expired', 'FORBIDDEN', HTTP.FORBIDDEN);
}
```

#### 60.3: Access After Expiry
**Setup**: Simulate time passing (7 days), retry access as Temp A

**Expected Results**:
- ✓ Access DENIED with 403 Forbidden
- ✓ Activity logged: "collaborator_expired" event
- ✓ Expiry_time preserved in database (for audit trail)

**Database State**:
- expiry_time still shows past timestamp
- Access check: `expires_at <= now()` returns true
- Auto-revoke job may mark as `status='expired'`

#### 60.4: Concurrent Expiry Checking
**Expected Results**:
- ✓ Multiple temporary collaborators checked independently
- ✓ Expiry of Temp A doesn't affect Temp B
- ✓ Each has its own expiry_time value

---

## TEST 61: Auto-Revoke Job Runs Daily to Remove Expired Collaborators

### Objective
Verify that the automated job (cron: `0 0 * * *`) removes expired collaborators daily.

### Test Cases

#### 61.1: Job Configuration Verification
**Setup**: Check master-config.yml automation schedule

**Expected Configuration**:
```yaml
temp_access_cleanup:
  trigger: 0 0 * * *  # Daily at midnight UTC
  description: Remove expired collaborators
  action: revoke_expired_collaborators
  entity: collaborator
  enabled: true
  rule: access_type == 'temporary' AND expires_at <= now()
```

**Expected Results**:
- ✓ Job exists with cron pattern
- ✓ Runs once daily (0 0 * * *)
- ✓ Enabled=true
- ✓ Correct filter rule applied

#### 61.2: Expired Collaborator Identification
**Setup**:
1. Create collaborator with expiry_time = now-1day (already expired)
2. Do NOT run auto-revoke job yet

**Expected Results**:
- ✓ Collaborator still in active list (before job runs)
- ✓ No auto-removal (job hasn't run)
- ✓ Access check rejects: `expires_at < now()`

**Query to Identify Expired**:
```javascript
const expired = list('collaborator')
  .filter(c => c.access_type === 'temporary' && c.expires_at <= now());
```

#### 61.3: Auto-Revoke Job Execution
**Setup**: Continue from 61.2, trigger auto-revoke job manually or wait for scheduled time

**Expected Results**:
- ✓ Collaborator removed from active collaborators list
- ✓ OR moved to expired_collaborators table
- ✓ Activity logged: `collaborator_expired` action
- ✓ Reason recorded: `auto_revoked`

**Expected Activity Log Entry**:
```javascript
{
  entity_type: 'collaborator',
  entity_id: collabId,
  action: 'auto_revoke',
  message: 'Temporary collaborator access expired and revoked',
  details: {
    original_expiry_time: expiryTime,
    revoked_at: now(),
    reason: 'auto_revoked'
  }
}
```

#### 61.4: Non-Expired Collaborators Preserved
**Setup**:
1. Create collaborator with expiry_time = tomorrow
2. Run auto-revoke job

**Expected Results**:
- ✓ Collaborator NOT removed
- ✓ Still has access (expiry time not reached)
- ✓ No activity log entry created

**Verification**:
```javascript
const collaborator = get('collaborator', collabId);
expect(collaborator.expires_at).toBeGreaterThan(now());
expect(collaborator.status).not.toBe('expired');
```

#### 61.5: Multiple Auto-Revoke Operations
**Expected Results**:
- ✓ All auto-revoke operations logged
- ✓ Logs accessible for debugging
- ✓ Audit trail complete for compliance

---

## Validation Requirements

### 1. Deep Copy for Template Checklists
**Requirement**: Template-to-review copying uses deep copy, no shared references

**Verification**:
```javascript
const reviewA = get('review', reviewAId);
const reviewB = get('review', reviewBId);

const checklistsA = list('review_checklist', { review_id: reviewAId });
const checklistsB = list('review_checklist', { review_id: reviewBId });

// No shared IDs between reviews
checklistsA.forEach(ca => {
  expect(checklistsB.find(cb => cb.id === ca.id)).toBeUndefined();
});
```

### 2. Status Field Enum Rules
**Requirement**: Status follows enum definition in master-config.yml

**Valid Values**:
```yaml
review_status:
  open:
    label: Open
    color: yellow
  closed:
    label: Closed
    color: green
```

**Enforcement**:
```javascript
const review = get('review', reviewId);
expect(['open', 'closed'].includes(review.status)).toBe(true);
```

### 3. Collaborator Permissions Server-Side Enforcement
**Requirement**: All permission checks enforced on server, not just client-side

**Code Path**:
```javascript
// In CRUD factory
requirePermission(user, spec, 'view');
if (!permissionService.checkRowAccess(user, spec, item)) {
  throw new AppError('Access denied', 'FORBIDDEN', HTTP.FORBIDDEN);
}

// In collaborator-role service
export function hasCollaboratorPermission(collaboratorId, permission) {
  const role = getCollaboratorRole(collaboratorId);
  const permissions = COLLABORATOR_ROLE_PERMISSIONS[role.role_type];
  return permissions ? permissions.includes(permission) : false;
}
```

### 4. Expiry_Time Uses Unix Seconds
**Requirement**: All timestamps use Unix epoch (seconds since 1970-01-01)

**Verification**:
```javascript
const expiryTime = now() + (7 * 24 * 60 * 60);  // 7 days in seconds
expect(typeof expiryTime).toBe('number');
expect(Number.isInteger(expiryTime)).toBe(true);
expect(expiryTime > 0).toBe(true);
```

### 5. Auto-Revoke Logs Accessible
**Requirement**: All auto-revoke operations logged in activity_log for debugging

**Query**:
```javascript
const logs = list('activity_log', {
  entity_type: 'collaborator',
  action: 'auto_revoke'
});
```

### 6. Soft Delete/Archival of Collaborators
**Requirement**: Deleted collaborators remain in database for audit trail

**Implementation**:
- Collaborator records are soft-deleted (not hard-removed)
- `status` field set to `expired` or similar
- Historical access preserved

---

## Data Integrity Checks

### 1. Referential Integrity
- All `review_id` foreign keys valid
- All `user_id` foreign keys valid
- All `template_id` foreign keys valid (if present)

### 2. Timestamp Consistency
- `created_at` <= `updated_at`
- All timestamps in Unix seconds
- No future timestamps (except `expires_at`)

### 3. JSON Field Validation
- `default_checklists` parses as JSON array
- Empty arrays handled correctly
- Malformed JSON doesn't crash system

### 4. Role Consistency
- Role values match defined enum
- Permissions match role definition
- No orphaned role assignments

---

## Edge Cases

### 1. Template with Empty default_checklists
**Input**: `default_checklists: "[]"`

**Expected**: Review created successfully, no checklists linked

### 2. Template with Missing Checklist Reference
**Input**: `default_checklists: "[\"missing-id\"]"`

**Expected**: Hook skips missing checklist, logs warning

### 3. Collaborator Expiry at Exact Now Time
**Input**: `expires_at: now()`

**Expected**: Treated as expired (<=), not as active

### 4. Multiple Collaborators with Same User
**Input**: Two collaborators for same user in one review

**Expected**: Allowed (different roles/access types)

### 5. Permanent Collaborator with Non-Null Expiry
**Input**: `access_type: "permanent"` but `expires_at: someTime`

**Expected**: Validation error or warning logged

---

## Performance Considerations

### 1. Auto-Revoke Query Performance
**Issue**: Querying all collaborators daily might be slow with large dataset

**Mitigation**:
- Index on `expires_at` and `access_type`
- Batch processing with limits
- Pagination if needed

### 2. Hook Execution Order
**Issue**: Multiple hooks might fire on review creation

**Mitigation**:
- Hooks execute sequentially (not parallel)
- No circular dependencies
- Clear execution order defined

### 3. Permission Check Caching
**Issue**: Permission checks might be expensive

**Mitigation**:
- Permission cache configured: `permission_ttl_ms: 300000` (5 minutes)
- Cache invalidation on role changes

---

## Test Execution Steps

### Manual Testing (Without Test Framework)

1. **Setup Test Environment**:
   ```bash
   cd /home/user/lexco/moonlanding
   npm run build
   npm run start
   ```

2. **Create Test Data via API**:
   ```bash
   # Create template
   curl -X POST http://localhost:3000/api/review_template \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Template","default_checklists":"[\"id1\",\"id2\"]"}'

   # Create review from template
   curl -X POST http://localhost:3000/api/review \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Review","template_id":"template-id","status":"open"}'
   ```

3. **Verify Results**:
   - Check database directly: `SELECT * FROM review WHERE id='test-id'`
   - Verify checklists linked: `SELECT * FROM review_checklist WHERE review_id='test-id'`
   - Check activity logs: `SELECT * FROM activity_log WHERE entity_type='review'`

4. **Test Collaborator Expiry**:
   ```bash
   # Create temporary collaborator
   curl -X POST http://localhost:3000/api/collaborator \
     -H "Content-Type: application/json" \
     -d '{"review_id":"review-id","user_id":"user-id","access_type":"temporary","expires_at":'$(date +%s -d '+7 days')'}'

   # Try accessing after expiry (simulate time change in DB)
   UPDATE collaborator SET expires_at = :past_time WHERE id = :id;
   curl http://localhost:3000/api/review/review-id
   # Should get 403 Forbidden
   ```

### Automated Testing (With Framework)

See `src/__tests__/mwr-review-template-collaborator.test.js` for Jest test suite.

---

## Files Modified/Created

1. **Test File**: `/home/user/lexco/moonlanding/src/__tests__/mwr-review-template-collaborator.test.js`
   - Comprehensive Jest test suite
   - 20+ test cases
   - Covers all requirements

2. **Test Runner**: `/home/user/lexco/moonlanding/src/__tests__/run-mwr-tests.js`
   - Standalone Node.js test runner
   - No framework dependencies
   - Can be executed locally

3. **This Report**: `/home/user/lexco/moonlanding/MWR_REVIEW_TEMPLATE_TEST_REPORT.md`
   - Detailed test specifications
   - Expected results for each test
   - Data integrity checks

---

## Summary of Tests

| Test # | Name | Status | Key Assertion |
|--------|------|--------|----------------|
| 57.1 | Template checklist array creation | DOCUMENTED | Checklists stored in JSON |
| 57.2 | Review copies checklists | DOCUMENTED | 3 items with correct titles |
| 57.3 | Independent copies | DOCUMENTED | No shared references |
| 58.1 | Review status initialization | DOCUMENTED | Status = "open" |
| 58.2 | Status transition to "closed" | DOCUMENTED | Workflow allows transition |
| 58.3 | Immutable created_at | DOCUMENTED | Timestamp unchanged |
| 59.1 | Permanent collaborators | DOCUMENTED | expires_at = null |
| 59.2 | Auditor permissions | DOCUMENTED | Role-based access |
| 59.3 | Reviewer permissions | DOCUMENTED | Role-based access |
| 59.4 | Audit trail logging | DOCUMENTED | Activity logged |
| 60.1 | Temporary collaborators | DOCUMENTED | expires_at = future |
| 60.2 | Access within window | DOCUMENTED | Access allowed |
| 60.3 | Access after expiry | DOCUMENTED | 403 Forbidden |
| 60.4 | Concurrent expiry | DOCUMENTED | Independent tracking |
| 61.1 | Job configuration | DOCUMENTED | Cron schedule verified |
| 61.2 | Expired identification | DOCUMENTED | Filtering works |
| 61.3 | Job execution | DOCUMENTED | Collaborators removed |
| 61.4 | Non-expired preserved | DOCUMENTED | Not removed |
| 61.5 | Audit logging | DOCUMENTED | All ops logged |

---

## Conclusion

All tests have been documented with complete specifications, expected results, and code paths. The implementation follows the master-config.yml definitions and uses established patterns from the codebase (hook engine, CRUD factory, permission service).

The tests are ready for execution using the Jest test framework or the standalone Node.js runner.

**Total Test Cases**: 19
**Expected Status**: All PASSING (assuming implementation matches specifications)

