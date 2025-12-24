# Collaborator Role Assignment System - Implementation Guide

## Overview

The per-collaborator role assignment system provides granular access control for the MWR domain. Each collaborator can now be assigned one of four specific roles with defined permissions, replacing the previous flat collaborator access model.

## Architecture

### Entities

**collaborator_role** (New Entity)
- **Purpose**: Tracks role assignments for collaborators with full audit history
- **Parent**: collaborator
- **Domain**: MWR
- **Order**: 11 (alongside collaborator)
- **Permission Template**: partner_only

**collaborator** (Updated Entity)
- **New Fields**:
  - `role_level` (deprecated) - Legacy field maintained for backward compatibility
  - `primary_role_id` - Reference to active collaborator_role record
  - `is_manager` - Computed boolean field (true if role_type is 'manager')

### Role Types

#### 1. Viewer (Gray)
**Description**: Can view highlights and PDFs only

**Permissions**:
- view
- view_highlights
- view_pdfs

**Use Case**: External reviewers who need read-only access

#### 2. Commenter (Blue)
**Description**: Can view and add notes/comments

**Permissions**:
- view
- view_highlights
- view_pdfs
- add_notes
- add_comments

**Use Case**: Junior team members providing feedback without editing rights

#### 3. Reviewer (Green)
**Description**: Can resolve/edit highlights, full PDF access

**Permissions**:
- view
- view_highlights
- view_pdfs
- add_notes
- add_comments
- edit_highlights
- resolve_highlights
- create_highlights
- delete_own_highlights

**Use Case**: Senior team members performing active review work

#### 4. Manager (Purple)
**Description**: Can manage collaborators and approve changes

**Permissions**:
- All Reviewer permissions plus:
- delete_highlights (any highlight, not just own)
- manage_collaborators
- assign_roles
- approve_changes

**Use Case**: Review leads who manage the collaboration team

## API Endpoints

### POST /api/mwr/collaborator-role
Assign a new role to a collaborator

**Request Body**:
```json
{
  "collaborator_id": 123,
  "role_type": "reviewer",
  "role_description": "Lead technical reviewer for finance section"
}
```

**Response** (201 Created):
```json
{
  "id": 456,
  "collaborator_id": 123,
  "role_type": "reviewer",
  "assigned_by": 1,
  "assigned_at": 1703001234,
  "role_description": "Lead technical reviewer for finance section",
  "is_active": true,
  "created_at": 1703001234,
  "updated_at": 1703001234
}
```

**Authorization**: Only partners and managers can assign roles

### GET /api/mwr/collaborator-role?collaborator_id=123
Get role history for a collaborator

**Response** (200 OK):
```json
{
  "collaborator_id": 123,
  "current_role": {
    "id": 456,
    "role_type": "reviewer",
    "assigned_at": 1703001234,
    "is_active": true
  },
  "roles": [
    {
      "id": 456,
      "role_type": "reviewer",
      "assigned_at": 1703001234,
      "is_active": true
    },
    {
      "id": 455,
      "role_type": "commenter",
      "assigned_at": 1702995000,
      "is_active": false,
      "superseded_by": 456,
      "superseded_at": 1703001234
    }
  ]
}
```

### PATCH /api/mwr/collaborator-role
Update an existing role

**Request Body**:
```json
{
  "role_id": 456,
  "role_type": "manager",
  "role_description": "Promoted to review lead"
}
```

**Response** (200 OK):
```json
{
  "id": 457,
  "collaborator_id": 123,
  "role_type": "manager",
  "assigned_by": 1,
  "assigned_at": 1703005000,
  "role_description": "Promoted to review lead",
  "is_active": true
}
```

**Note**: Changing role_type creates a new role and supersedes the old one

### DELETE /api/mwr/collaborator-role?role_id=456
Revoke a role assignment

**Response** (200 OK):
```json
{
  "success": true,
  "role": {
    "id": 456,
    "is_active": false,
    "superseded_at": 1703008000
  }
}
```

**Authorization**: Only partners and managers can revoke roles

### GET /api/mwr/collaborator/123/roles
Get detailed role information for a specific collaborator

**Response** (200 OK):
```json
{
  "collaborator_id": 123,
  "collaborator_name": "John Smith",
  "current_role": {
    "id": 456,
    "role_type": "reviewer",
    "assigned_at": 1703001234
  },
  "permissions": [
    "view",
    "view_highlights",
    "view_pdfs",
    "add_notes",
    "add_comments",
    "edit_highlights",
    "resolve_highlights",
    "create_highlights",
    "delete_own_highlights"
  ],
  "is_manager": false,
  "role_history": [...],
  "total_role_changes": 2
}
```

## Permission Helper Functions

### Service: collaborator-role.service.js

**getCollaboratorRole(collaboratorId)**
- Returns active role for collaborator
- Auto-syncs primary_role_id if needed
- Returns null if no active role

**getCollaboratorRoleHistory(collaboratorId)**
- Returns all roles for collaborator, sorted by assigned_at (newest first)
- Includes both active and superseded roles

**hasCollaboratorPermission(collaboratorId, permission)**
- Boolean check for specific permission
- Example: `hasCollaboratorPermission(123, 'edit_highlights')`

**checkCollaboratorAccess(collaboratorId, action, record)**
- Comprehensive access check with context
- Handles ownership checks for 'delete_own_highlights'
- Example: `checkCollaboratorAccess(123, 'delete_highlights', highlight)`

**assignCollaboratorRole(collaboratorId, roleType, assignedBy, roleDescription)**
- Assigns new role and supersedes current role
- Creates audit log entry
- Updates collaborator.primary_role_id and is_manager
- Returns new role object

**getCollaboratorRolePermissions(roleType)**
- Returns array of permissions for role type
- Example: `getCollaboratorRolePermissions('reviewer')` → ['view', 'view_highlights', ...]

**canAssignRole(userRole, targetRoleType)**
- Checks if user role can assign target role
- Manager role requires partner or manager
- All other roles require partner or manager

### Permission Service Extensions

**checkCollaboratorPermission(collaboratorId, action, record)**
- Delegates to collaborator-role service
- Integrated into main permission flow

**getCollaboratorRole(collaboratorId)**
- Convenience wrapper for role lookup

**checkMwrAccess(user, spec, action, record, collaboratorId)**
- Combined check: regular user access OR collaborator role access
- Use for MWR domain entities

**checkHighlightAccessForCollaborator(collaboratorId, action, highlight)**
- Specialized highlight permission check
- Maps actions: view → view_highlights, create → create_highlights, etc.

**canCollaboratorManageRoles(collaboratorId)**
- Quick check if collaborator can assign roles
- Returns true only for manager role

## Validation Rules

### collaborator_role_assignment
- Validates role_type is one of: viewer, commenter, reviewer, manager
- Enforces that only partners/managers can assign manager role
- Applied on CREATE

### collaborator_role_supersession
- Ensures superseded roles have is_active=false
- Requires superseded_at when superseded_by is set
- Prevents orphaned inactive roles
- Applied on UPDATE

## Notifications

### collaborator_role_assigned
**Trigger**: collaborator_role.onCreate OR role_type changes

**Recipients**:
- Collaborator user (email + in-app)
- User who assigned role (in-app only)

**Template Variables**:
- collaborator_name
- role_type
- role_description
- assigned_by_name
- review_name

### collaborator_role_revoked
**Trigger**: collaborator_role.is_active changes to false

**Recipients**:
- Collaborator user (email + in-app)

**Template Variables**:
- collaborator_name
- old_role_type
- new_role_type (if reassigned)
- review_name

## Audit Trail

All role changes are logged to `activity_log` table:

**role_assigned**:
```json
{
  "entity_type": "collaborator_role",
  "entity_id": 456,
  "action": "role_assigned",
  "message": "Role assigned: reviewer",
  "details": {
    "collaborator_id": 123,
    "old_role": null,
    "new_role": "reviewer",
    "assigned_by": 1,
    "role_description": "Lead technical reviewer"
  }
}
```

**role_changed**:
```json
{
  "entity_type": "collaborator_role",
  "entity_id": 457,
  "action": "role_assigned",
  "message": "Role changed from reviewer to manager",
  "details": {
    "collaborator_id": 123,
    "old_role": "reviewer",
    "new_role": "manager",
    "assigned_by": 1,
    "role_description": "Promoted to review lead"
  }
}
```

**role_revoked**:
```json
{
  "entity_type": "collaborator_role",
  "entity_id": 456,
  "action": "role_revoked",
  "message": "Role reviewer revoked by partner",
  "details": {
    "collaborator_id": 123,
    "role_type": "reviewer",
    "revoked_by": 1,
    "revoked_at": 1703008000
  }
}
```

## Database Schema Changes

### collaborator_role table (NEW)
```sql
CREATE TABLE collaborator_role (
  id INTEGER PRIMARY KEY,
  collaborator_id INTEGER NOT NULL REFERENCES collaborator(id),
  role_type TEXT NOT NULL CHECK (role_type IN ('viewer', 'commenter', 'reviewer', 'manager')),
  assigned_by INTEGER NOT NULL REFERENCES user(id),
  assigned_at INTEGER NOT NULL,
  role_description TEXT,
  is_active INTEGER DEFAULT 1,
  superseded_by INTEGER REFERENCES collaborator_role(id),
  superseded_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by INTEGER REFERENCES user(id),
  updated_by INTEGER REFERENCES user(id)
);

CREATE INDEX idx_collaborator_role_collaborator ON collaborator_role(collaborator_id);
CREATE INDEX idx_collaborator_role_active ON collaborator_role(is_active);
CREATE INDEX idx_collaborator_role_type ON collaborator_role(role_type);
```

### collaborator table (UPDATED)
```sql
ALTER TABLE collaborator ADD COLUMN role_level TEXT; -- deprecated
ALTER TABLE collaborator ADD COLUMN primary_role_id INTEGER REFERENCES collaborator_role(id);
ALTER TABLE collaborator ADD COLUMN is_manager INTEGER DEFAULT 0;

CREATE INDEX idx_collaborator_primary_role ON collaborator(primary_role_id);
```

## Migration Strategy

### Backward Compatibility

1. **Existing collaborators without roles**: Continue to function with default permissions
2. **Legacy role_level field**: Kept for backward compatibility, marked deprecated
3. **Permission checks**: Fall back to regular user permissions if no collaborator role exists

### Migration Steps

1. **Phase 1**: Deploy schema changes (add collaborator_role table, update collaborator table)
2. **Phase 2**: Assign default "viewer" role to all existing collaborators
3. **Phase 3**: Update UI to show role assignment controls for managers/partners
4. **Phase 4**: Deprecate role_level field (keep in schema but don't use)

### Migration Script Example

```javascript
import { list, create } from '@/engine';

async function migrateExistingCollaborators() {
  const collaborators = list('collaborator');
  const nowSeconds = Math.floor(Date.now() / 1000);

  for (const collaborator of collaborators) {
    // Skip if already has a role
    if (collaborator.primary_role_id) {
      continue;
    }

    // Determine role from legacy role_level or default to viewer
    let roleType = 'viewer';
    if (collaborator.role_level === 'manager') {
      roleType = 'manager';
    } else if (collaborator.role_level === 'reviewer') {
      roleType = 'reviewer';
    }

    // Create role assignment
    const role = create('collaborator_role', {
      collaborator_id: collaborator.id,
      role_type: roleType,
      assigned_by: 1, // System migration
      assigned_at: nowSeconds,
      role_description: 'Migrated from legacy role_level',
      is_active: true,
      created_at: nowSeconds,
      updated_at: nowSeconds,
      created_by: 1
    });

    // Update collaborator reference
    update('collaborator', collaborator.id, {
      primary_role_id: role.id,
      is_manager: roleType === 'manager'
    });

    console.log(`Migrated collaborator ${collaborator.id} to role ${roleType}`);
  }
}
```

## Usage Examples

### Example 1: Assign reviewer role when adding collaborator

```javascript
import { create } from '@/engine';
import { assignCollaboratorRole } from '@/services/collaborator-role.service';

// Create collaborator
const collaborator = create('collaborator', {
  review_id: 123,
  user_id: 456,
  email: 'reviewer@example.com',
  access_type: 'temporary',
  expires_at: Math.floor(Date.now() / 1000) + (7 * 86400), // 7 days
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000)
});

// Assign reviewer role
await assignCollaboratorRole(
  collaborator.id,
  'reviewer',
  currentUser.id,
  'Senior reviewer for financial statements section'
);
```

### Example 2: Check if collaborator can edit highlight

```javascript
import { checkCollaboratorAccess } from '@/services/collaborator-role.service';

const canEdit = checkCollaboratorAccess(
  collaboratorId,
  'edit_highlights',
  highlight
);

if (!canEdit) {
  throw new Error('Insufficient permissions to edit highlights');
}
```

### Example 3: Promote collaborator to manager

```javascript
// Via API
const response = await fetch('/api/mwr/collaborator-role', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    collaborator_id: 123,
    role_type: 'manager',
    role_description: 'Promoted to review lead - manages team of 5 reviewers'
  })
});

const newRole = await response.json();
```

### Example 4: Get collaborator role in UI component

```javascript
import { permissionService } from '@/services/permission.service';

function CollaboratorCard({ collaborator }) {
  const role = permissionService.getCollaboratorRole(collaborator.id);

  return (
    <div>
      <h3>{collaborator.name}</h3>
      {role && (
        <Badge color={getRoleColor(role.role_type)}>
          {role.role_type}
        </Badge>
      )}
      {collaborator.is_manager && <ManagerIcon />}
    </div>
  );
}
```

## Testing Checklist

- [ ] Create collaborator with viewer role
- [ ] Create collaborator with commenter role
- [ ] Create collaborator with reviewer role
- [ ] Create collaborator with manager role
- [ ] Verify viewer cannot edit highlights
- [ ] Verify commenter can add notes but not resolve highlights
- [ ] Verify reviewer can resolve highlights
- [ ] Verify reviewer can only delete own highlights
- [ ] Verify manager can delete any highlight
- [ ] Verify manager can assign roles
- [ ] Change role from viewer to reviewer
- [ ] Verify old role is superseded
- [ ] Verify is_manager flag updates when role changes
- [ ] Revoke role and verify collaborator loses access
- [ ] Check role history shows all assignments
- [ ] Verify non-manager user cannot assign manager role
- [ ] Verify audit log entries are created
- [ ] Verify notifications are sent on role change

## Performance Considerations

1. **Role Lookups**: `getCollaboratorRole()` performs 1-2 DB queries (collaborator + collaborator_role)
2. **Caching**: Consider caching active roles per collaborator for high-traffic reviews
3. **Bulk Operations**: Use `list('collaborator_role')` for batch permission checks
4. **Index Usage**: Ensure indexes on collaborator_id and is_active for fast lookups

## Future Enhancements

1. **Time-bound roles**: Add expires_at to collaborator_role for temporary elevated permissions
2. **Role templates**: Pre-configured role packages for common review scenarios
3. **Conditional permissions**: Role permissions that vary based on review status or stage
4. **Delegation**: Allow managers to delegate role assignment to reviewers
5. **Role inheritance**: Hierarchical roles where manager inherits all reviewer permissions

## Troubleshooting

### Issue: Collaborator has no role but should have access

**Solution**: Check if collaborator.primary_role_id is set and points to an active role. Run:
```javascript
const role = getCollaboratorRole(collaboratorId);
console.log('Role:', role);
```

### Issue: Permission denied even with correct role

**Solution**: Verify role permissions include the action. Check:
```javascript
const permissions = getCollaboratorRolePermissions('reviewer');
console.log('Permissions:', permissions);
```

### Issue: Multiple active roles for same collaborator

**Solution**: This shouldn't happen. Fix with:
```javascript
const roles = getCollaboratorRoleHistory(collaboratorId);
const activeRoles = roles.filter(r => r.is_active);
if (activeRoles.length > 1) {
  // Keep most recent, deactivate others
  activeRoles.slice(1).forEach(r => {
    update('collaborator_role', r.id, { is_active: false });
  });
}
```

## Configuration Reference

All configuration is defined in `/src/config/master-config.yml`:

- **Entity definition**: Lines 633-697 (collaborator_role)
- **Role enum**: Lines 2154-2203 (collaborator_role_type)
- **Validation rules**: Lines 1973-1995
- **Notifications**: Lines 1562-1595
- **Domain mapping**: Line 1680 (MWR entities)

## API Reference Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| /api/mwr/collaborator-role | GET | Get role history | Any user |
| /api/mwr/collaborator-role | POST | Assign new role | Partner/Manager |
| /api/mwr/collaborator-role | PATCH | Update role | Partner/Manager |
| /api/mwr/collaborator-role | DELETE | Revoke role | Partner/Manager |
| /api/mwr/collaborator/[id]/roles | GET | Get detailed role info | Any user |

---

**Implementation Status**: Complete
**Config-Driven**: 100% (all definitions in master-config.yml)
**Test Coverage**: Manual testing required
**Documentation**: This file + inline code comments
