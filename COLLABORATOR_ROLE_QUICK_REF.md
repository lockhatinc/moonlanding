# Collaborator Role System - Quick Reference

## Role Permissions Matrix

| Action | Viewer | Commenter | Reviewer | Manager |
|--------|--------|-----------|----------|---------|
| View PDFs/Highlights | ✓ | ✓ | ✓ | ✓ |
| Add Notes/Comments | ✗ | ✓ | ✓ | ✓ |
| Create Highlights | ✗ | ✗ | ✓ | ✓ |
| Edit Highlights | ✗ | ✗ | ✓ | ✓ |
| Resolve Highlights | ✗ | ✗ | ✓ | ✓ |
| Delete Own Highlights | ✗ | ✗ | ✓ | ✓ |
| Delete Any Highlights | ✗ | ✗ | ✗ | ✓ |
| Manage Collaborators | ✗ | ✗ | ✗ | ✓ |
| Assign Roles | ✗ | ✗ | ✗ | ✓ |
| Approve Changes | ✗ | ✗ | ✗ | ✓ |

## API Quick Reference

```bash
# Assign role
POST /api/mwr/collaborator-role
{
  "collaborator_id": 123,
  "role_type": "reviewer",
  "role_description": "Lead reviewer"
}

# Get role history
GET /api/mwr/collaborator-role?collaborator_id=123

# Change role
PATCH /api/mwr/collaborator-role
{
  "role_id": 456,
  "role_type": "manager"
}

# Revoke role
DELETE /api/mwr/collaborator-role?role_id=456

# Get role details
GET /api/mwr/collaborator/123/roles
```

## Code Examples

### Check Permission
```javascript
import { hasCollaboratorPermission } from '@/services/collaborator-role.service';

if (hasCollaboratorPermission(collaboratorId, 'edit_highlights')) {
  // Allow edit
}
```

### Assign Role
```javascript
import { assignCollaboratorRole } from '@/services/collaborator-role.service';

const role = await assignCollaboratorRole(
  collaboratorId,
  'reviewer',
  currentUser.id,
  'Lead technical reviewer'
);
```

### Get Current Role
```javascript
import { getCollaboratorRole } from '@/services/collaborator-role.service';

const role = getCollaboratorRole(collaboratorId);
console.log(role?.role_type); // 'viewer', 'commenter', 'reviewer', or 'manager'
```

### Check MWR Access (User OR Collaborator)
```javascript
import { permissionService } from '@/services/permission.service';

const hasAccess = permissionService.checkMwrAccess(
  user,
  spec,
  'edit',
  record,
  collaboratorId
);
```

## Database Fields

### collaborator_role
- `id` - Primary key
- `collaborator_id` - Parent collaborator
- `role_type` - viewer|commenter|reviewer|manager
- `assigned_by` - User who assigned
- `assigned_at` - Timestamp
- `role_description` - Optional notes
- `is_active` - Boolean (false if superseded)
- `superseded_by` - ID of replacement role
- `superseded_at` - Timestamp

### collaborator (updated)
- `primary_role_id` - Reference to active role
- `is_manager` - Computed boolean
- `role_level` - DEPRECATED (legacy)

## Authorization Rules

| Action | Required User Role |
|--------|-------------------|
| Assign viewer/commenter/reviewer | Partner or Manager |
| Assign manager | Partner or Manager |
| Change role | Partner or Manager |
| Revoke role | Partner or Manager |
| View role history | Any user |

## Validation

- Role type must be: viewer, commenter, reviewer, or manager
- Only partners/managers can assign manager role
- Superseded roles must have is_active=false
- Inactive roles must reference superseding role

## Config Locations

```yaml
# master-config.yml

entities:
  collaborator_role:  # Lines 633-697
  collaborator:       # Lines 596-632 (updated)

status_enums:
  collaborator_role_type:  # Lines 2154-2203

validation:
  collaborator_role_assignment:   # Lines 1973-1982
  collaborator_role_supersession: # Lines 1983-1995

notifications:
  collaborator_role_assigned:  # Lines 1562-1580
  collaborator_role_revoked:   # Lines 1581-1595

domains:
  mwr:
    entities:
      - collaborator_role  # Line 1680
```

## Common Patterns

### Pattern 1: Add Collaborator with Role
```javascript
// Create collaborator
const collaborator = create('collaborator', {
  review_id: reviewId,
  user_id: userId,
  expires_at: Date.now() / 1000 + 7 * 86400
});

// Assign role
await assignCollaboratorRole(
  collaborator.id,
  'reviewer',
  currentUser.id
);
```

### Pattern 2: Promote Collaborator
```javascript
// Changes role and supersedes old one
await assignCollaboratorRole(
  collaboratorId,
  'manager',
  currentUser.id,
  'Promoted to team lead'
);
```

### Pattern 3: Check Highlight Edit Access
```javascript
import { permissionService } from '@/services/permission.service';

const canEdit = permissionService.checkHighlightAccessForCollaborator(
  collaboratorId,
  'edit',
  highlight
);
```

### Pattern 4: Display Role in UI
```javascript
const role = getCollaboratorRole(collaborator.id);
const roleLabel = role?.role_type || 'No role';
const roleColor = {
  viewer: 'gray',
  commenter: 'blue',
  reviewer: 'green',
  manager: 'purple'
}[role?.role_type] || 'gray';
```

## Migration

```javascript
// Assign default roles to existing collaborators
import { list, update } from '@/engine';
import { assignCollaboratorRole } from '@/services/collaborator-role.service';

const collaborators = list('collaborator');
for (const c of collaborators) {
  if (!c.primary_role_id) {
    await assignCollaboratorRole(c.id, 'viewer', 1, 'Migration');
  }
}
```

## Testing Checklist

```bash
# Create with each role
curl -X POST /api/mwr/collaborator-role \
  -d '{"collaborator_id":1,"role_type":"viewer"}'

# Test permissions
# - Viewer: Can only view (403 on edit)
# - Commenter: Can add notes (200), cannot resolve (403)
# - Reviewer: Can resolve (200), can delete own (200), cannot delete others (403)
# - Manager: Can delete any (200), can assign roles (200)

# Test role changes
curl -X PATCH /api/mwr/collaborator-role \
  -d '{"role_id":1,"role_type":"manager"}'

# Verify supersession
curl /api/mwr/collaborator-role?collaborator_id=1
# Should show 2+ roles, newest is active

# Test revocation
curl -X DELETE /api/mwr/collaborator-role?role_id=1
# Verify primary_role_id cleared on collaborator
```

## Troubleshooting

**No role found**
```javascript
const role = getCollaboratorRole(collaboratorId);
if (!role) {
  // Assign default role
  await assignCollaboratorRole(collaboratorId, 'viewer', systemUserId);
}
```

**Permission denied**
```javascript
const permissions = getCollaboratorRolePermissions(role.role_type);
console.log('Available:', permissions);
console.log('Requested:', action);
```

**Multiple active roles**
```javascript
const history = getCollaboratorRoleHistory(collaboratorId);
const active = history.filter(r => r.is_active);
if (active.length > 1) {
  // Keep newest, deactivate rest
  active.slice(1).forEach(r => {
    update('collaborator_role', r.id, { is_active: false });
  });
}
```

## File Locations

| File | Purpose |
|------|---------|
| `/src/config/master-config.yml` | Entity, enum, validation, notification config |
| `/src/services/collaborator-role.service.js` | Core role logic (259 lines) |
| `/src/services/permission.service.js` | Permission checks (updated) |
| `/src/app/api/mwr/collaborator-role/route.js` | Role management API |
| `/src/app/api/mwr/collaborator/[id]/roles/route.js` | Role details API |

## Key Functions

| Function | Module | Purpose |
|----------|--------|---------|
| `getCollaboratorRole(id)` | collaborator-role.service | Get active role |
| `hasCollaboratorPermission(id, perm)` | collaborator-role.service | Boolean check |
| `assignCollaboratorRole(id, type, by, desc)` | collaborator-role.service | Assign/change role |
| `checkMwrAccess(user, spec, action, rec, collabId)` | permission.service | Combined check |
| `checkHighlightAccessForCollaborator(id, action, hl)` | permission.service | Highlight check |

---

**Full Documentation**: See `COLLABORATOR_ROLE_IMPLEMENTATION.md` (521 lines)
