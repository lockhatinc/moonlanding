# Permission Audit Trail Integration Guide

This guide shows how to integrate permission audit logging into your application code.

## Overview

The permission audit system tracks all permission-related changes with:
- Who made the change
- What entity was affected
- Before/after permission state
- Reason and categorization
- Timestamp and context (IP, session)

## Import the Hooks

```javascript
import {
  auditRoleChange,
  auditCollaboratorAdded,
  auditCollaboratorRemoved,
  auditTeamAssignment,
  auditPermissionTemplateApplied,
  auditPermissionGrant,
  auditPermissionRevoke,
  auditPermissionModify,
  auditLifecycleTransition,
  auditUserRequest,
} from '@/lib/permission-audit-hooks';
```

## Integration Examples

### 1. User Role Changes

When updating a user's role:

```javascript
// In your user update route or service
const oldUser = get('user', userId);
const oldRole = oldUser.role;

// Perform the update
update('user', userId, { role: newRole }, currentUser);

// Log the audit trail
await auditRoleChange({
  user: currentUser,
  targetUserId: userId,
  oldRole,
  newRole,
  reason: `Role upgraded for promotion`,
  metadata: {
    approved_by: currentUser.id,
    effective_date: now(),
  },
});
```

### 2. Adding Collaborators to Reviews

When granting collaborator access:

```javascript
// Create the collaborator
const collaborator = create('collaborator', {
  review_id: reviewId,
  user_id: userId,
  access_level: 'editor',
  ...data
}, currentUser);

// Log the audit trail
await auditCollaboratorAdded({
  user: currentUser,
  reviewId,
  collaboratorId: collaborator.id,
  collaboratorUserId: userId,
  permissions: { access_level: 'editor' },
  reason: `Collaborator added for quarterly review`,
  metadata: {
    review_name: review.name,
    access_expires: collaborator.expires_at,
  },
});
```

### 3. Removing Collaborators

When revoking collaborator access:

```javascript
const collaborator = get('collaborator', collaboratorId);

// Remove the collaborator
update('collaborator', collaboratorId, {
  status: 'removed',
  removed_at: now(),
  removed_by: currentUser.id,
}, currentUser);

// Log the audit trail
await auditCollaboratorRemoved({
  user: currentUser,
  reviewId: collaborator.review_id,
  collaboratorId,
  collaboratorUserId: collaborator.user_id,
  permissions: { access_level: collaborator.access_level },
  reason: `Access revoked - review completed`,
  metadata: {
    original_grant_date: collaborator.created_at,
    reason_code: 'review_complete',
  },
});
```

### 4. Team Assignments

When changing entity team assignments:

```javascript
const engagement = get('engagement', engagementId);
const oldTeamId = engagement.team_id;

// Update team assignment
update('engagement', engagementId, {
  team_id: newTeamId,
}, currentUser);

// Log the audit trail
await auditTeamAssignment({
  user: currentUser,
  entityType: 'engagement',
  entityId: engagementId,
  oldTeamId,
  newTeamId,
  affectedUserId: engagement.assigned_to,
  reason: `Team reassignment for load balancing`,
  metadata: {
    engagement_year: engagement.year,
    engagement_period: engagement.period,
  },
});
```

### 5. Lifecycle Stage Transitions

When entities transition through workflow stages:

```javascript
const engagement = get('engagement', engagementId);
const fromStage = engagement.stage;
const toStage = 'team_execution';

// Perform the stage transition
update('engagement', engagementId, {
  stage: toStage,
  transitioned_at: now(),
}, currentUser);

// Log the audit trail
await auditLifecycleTransition({
  user: currentUser,
  entityType: 'engagement',
  entityId: engagementId,
  fromStage,
  toStage,
  oldPermissions: {
    stage: fromStage,
    editable_by: ['partner', 'manager'],
  },
  newPermissions: {
    stage: toStage,
    editable_by: ['partner', 'manager', 'clerk'],
  },
  metadata: {
    auto_transition: false,
    triggered_by_milestone: 'all_rfis_completed',
  },
});
```

### 6. Applying Permission Templates

When applying a permission template to an entity:

```javascript
const template = getPermissionTemplate('review_collaboration');

// Apply the template permissions
applyPermissionTemplate(entityId, template);

// Log the audit trail
await auditPermissionTemplateApplied({
  user: currentUser,
  entityType: 'review',
  entityId,
  templateName: 'review_collaboration',
  permissions: template,
  reason: `Standard review collaboration template applied`,
  metadata: {
    template_version: '1.0',
    applied_at: now(),
  },
});
```

### 7. Custom Permission Grants

For custom permission grants:

```javascript
await auditPermissionGrant({
  user: currentUser,
  entityType: 'engagement',
  entityId,
  oldPermissions: { access: 'read' },
  newPermissions: { access: 'write', approval: true },
  affectedUserId: targetUserId,
  reason: `Granted approval permission for closeout`,
  reasonCode: 'admin_action',
  metadata: {
    approval_level: 'partner',
  },
});
```

### 8. User-Requested Changes

When users request permission changes:

```javascript
await auditUserRequest({
  user: requestingUser,
  entityType: 'review',
  entityId,
  action: 'grant',
  newPermissions: { access: 'collaborator' },
  affectedUserId: requestingUser.id,
  reason: `User requested collaborator access to review`,
  metadata: {
    request_date: now(),
    approved_by: currentUser.id,
  },
});
```

## When to Log Audit Trails

Always log when:
1. User roles change (partner → manager, etc.)
2. Collaborators are added or removed
3. Team assignments change
4. Entity ownership transfers
5. Permission templates are applied
6. Lifecycle stages transition (if permissions change)
7. Field-level access changes
8. Custom permissions are granted/revoked

Optional to log when:
1. Read-only operations (for compliance scenarios)
2. Status changes that don't affect permissions
3. Metadata updates without permission impact

## Querying Audit Trails

### Get all changes for an entity

```javascript
GET /api/audit/permissions?entity_type=engagement&entity_id=123
```

### Get all changes by a user

```javascript
GET /api/audit/permissions?user_id=456
```

### Get changes affecting a specific user

```javascript
GET /api/audit/permissions?affected_user_id=789
```

### Search audit trail

```javascript
GET /api/audit/permissions?search=collaborator
```

### Filter by action type

```javascript
GET /api/audit/permissions?action=role_change
```

### Filter by reason code

```javascript
GET /api/audit/permissions?reason_code=lifecycle_transition
```

### Export to CSV

```javascript
GET /api/audit/permissions?format=csv&entity_type=review
```

### Get statistics

```javascript
GET /api/audit/permissions/stats
```

### Get specific audit record

```javascript
GET /api/audit/permissions/:auditId
```

## Permission Matrix

| Role | Can View Audits | Scope |
|------|----------------|-------|
| Partner | Yes | All audit trails |
| Manager | Yes | All audit trails |
| Clerk | Yes | Own changes only |
| Client Admin | No | N/A |
| Client User | No | N/A |

## Best Practices

1. **Always include reason**: Provide a human-readable reason for the change
2. **Use appropriate reason codes**: Choose the correct category (user_request, lifecycle_transition, etc.)
3. **Add metadata**: Include context that helps understand the change later
4. **Don't log redundantly**: If the same information is in activity_log, reference it
5. **Handle errors gracefully**: Audit logging should not fail the main operation
6. **Capture IP addresses**: Use request context when available
7. **Log before-after state**: Always include old and new permissions when possible

## Integration with activity_log

The audit trail integrates with activity_log:

```javascript
// After logging permission audit
const auditId = await auditPermissionChange({...});

// Create corresponding activity log entry
create('activity_log', {
  entity_type: 'permission_audit',
  entity_id: auditId,
  action: 'permission_changed',
  message: `Permission changed for ${entityType} ${entityId}`,
  details: JSON.stringify({
    audit_id: auditId,
    action: 'role_change',
    reason_code: 'admin_action',
  }),
});
```

## Troubleshooting

### Audit not appearing
- Check user has permission to view audits (partner/manager/own)
- Verify entity_type and entity_id match exactly
- Check timestamp range if filtering by date

### CSV export empty
- Ensure filters don't exclude all results
- Check limit parameter (default 10,000)
- Verify format=csv parameter is included

### Permission diff not showing
- Requires both old_permissions and new_permissions
- Must be in same format (array or object)
- Check JSON parsing errors in metadata
