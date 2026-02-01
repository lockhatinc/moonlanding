# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the complete Role-Based Access Control (RBAC) system implemented using the CASL library for the Moonlanding platform. RBAC enables fine-grained permission management across 5 user roles with a hierarchical inheritance system.

## Architecture

### Core Components

1. **CASL Integration** (`src/lib/casl.js`)
   - Role definitions and hierarchy
   - Ability definitions for each role
   - Permission matrix for quick reference
   - Helper functions for permission checking

2. **React Hooks** (`src/lib/use-permissions.js`)
   - `usePermissions()` - Main hook for permission checking
   - `useCanAction()` - Check if user can perform an action
   - `useHasRole()` - Check if user has a specific role
   - `useAuthorized()` - Effect-based authorization check

3. **Protected Components** (`src/components/protected-component.jsx`)
   - `ProtectedComponent` - Wrap components with permission checks
   - `RoleBasedComponent` - Render based on role
   - `VisibilityGate` - Simple permission gate
   - `FeatureGate` - Feature-level access control
   - `HiddenIfUnauthorized` - Conditionally hidden content

4. **Role Management UI** (`src/components/role-management.jsx`)
   - `RoleManagementDashboard` - Admin interface for role management
   - `RoleSelect` - Dropdown for role selection
   - `RoleBadge` - Visual role indicator
   - `RoleInfoCard` - Role information card
   - `PermissionsList` - Display permissions for a role

5. **User Settings Page** (`src/app/user-settings/page.jsx`)
   - User profile display
   - Role and permission information
   - Account management

## Role Hierarchy

The system implements a hierarchical role structure with role inheritance:

```
Partner (top)
├── Manager
│   ├── Clerk
│   └── Client User
├── Client Admin
│   └── Client User
└── ...

Partner     → Can do everything
Manager     → Can manage engagements and team
Clerk       → Can view and comment
Client Admin → Can manage client users
Client User → Can view and create comments
```

### Role Descriptions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Partner** | Full system access | Manage all entities, all actions |
| **Manager** | Engagement and team management | Manage engagements, reviews, create items |
| **Clerk** | View and comment only | Read entities, create comments |
| **Client Admin** | Client user management | Manage client users, view client data |
| **Client User** | View and comment | Read engagements, create comments |

## Permission Matrix

```javascript
{
  partner: {
    user: ['list', 'read', 'create', 'update', 'delete'],
    engagement: ['list', 'read', 'create', 'update', 'delete'],
    review: ['list', 'read', 'create', 'update', 'delete'],
    comment: ['list', 'read', 'create', 'update', 'delete'],
    checklist: ['list', 'read', 'create', 'update', 'delete'],
    highlight: ['list', 'read', 'create', 'update', 'delete'],
    client: ['list', 'read', 'create', 'update', 'delete'],
    team: ['list', 'read', 'create', 'update', 'delete'],
  },
  
  manager: {
    user: ['list', 'read'],
    engagement: ['list', 'read', 'create', 'update'],
    review: ['list', 'read', 'create', 'update'],
    comment: ['list', 'read', 'create', 'update'],
    checklist: ['list', 'read', 'create', 'update'],
    highlight: ['list', 'read'],
    client: ['list', 'read'],
    team: ['list', 'read'],
  },
  
  clerk: {
    engagement: ['list', 'read'],
    review: ['list', 'read'],
    comment: ['list', 'read', 'create', 'update'],
    checklist: ['list', 'read', 'create', 'update'],
    highlight: ['list', 'read'],
  },
  
  client_admin: {
    engagement: ['list', 'read'],
    review: ['list', 'read'],
    comment: ['list', 'read', 'create', 'update'],
    checklist: ['list', 'read'],
    highlight: ['list', 'read'],
    client: ['read'],
  },
  
  client_user: {
    engagement: ['list', 'read'],
    review: ['list', 'read'],
    comment: ['list', 'read', 'create'],
    checklist: ['list', 'read'],
    highlight: ['list', 'read'],
  }
}
```

## Usage Examples

### 1. Checking Permissions in React Components

```jsx
import { usePermissions } from '@/lib/use-permissions';

function MyComponent({ user }) {
  const { can, cannot } = usePermissions(user);

  if (cannot('create', 'engagement')) {
    return <p>You don't have permission to create engagements</p>;
  }

  return <CreateEngagementForm />;
}
```

### 2. Using Protected Components

```jsx
import { ProtectedComponent, RoleBasedComponent } from '@/components/protected-component';

// Method 1: Permission-based
<ProtectedComponent
  action="create"
  subject="engagement"
  user={user}
  fallback={<p>Access denied</p>}
>
  <CreateEngagementForm />
</ProtectedComponent>

// Method 2: Role-based
<RoleBasedComponent
  roles={['partner', 'manager']}
  user={user}
  fallback={<p>Access denied</p>}
>
  <AdminPanel />
</RoleBasedComponent>

// Method 3: Feature-based
<FeatureGate
  feature="advanced-pdf"
  user={user}
  fallback={<p>Feature not available</p>}
>
  <AdvancedPDFViewer />
</FeatureGate>
```

### 3. API-level Permission Checks

The system integrates with existing API middleware:

```javascript
// In API handlers
const user = await requireAuth();
await requirePermission(user, spec, 'create');

// CASL-based checking
const ability = defineAbilityFor(user);
if (!ability.can('create', 'engagement')) {
  throw new Error('Permission denied');
}
```

### 4. Getting Role Information

```jsx
import { 
  getRoleLabel, 
  getRoleDescription, 
  getPermissionMatrix 
} from '@/lib/casl';

// Get label
const label = getRoleLabel('partner'); // "Partner"

// Get description
const desc = getRoleDescription('partner'); 
// "Full system access, manage all users and configurations"

// Get permissions for role
const matrix = getPermissionMatrix();
const partnerPerms = matrix['partner'];
```

## Integration Points

### 1. User Entity

The user entity includes a `role` field:

```yaml
user:
  fields:
    role:
      type: text
      required: true
      default: clerk
      label: Role
```

### 2. Authentication

Users are authenticated via Lucia, and the role is retrieved with user attributes:

```javascript
// In engine.server.js
getUserAttributes: (row) => ({ 
  id: row.id, 
  email: row.email, 
  name: row.name, 
  avatar: row.avatar, 
  type: row.type, 
  role: row.role  // Role included in user object
})
```

### 3. API Middleware

All API handlers use `requireAuth()` and `requirePermission()`:

```javascript
// In CRUD factory
const user = await requireAuth();
await requirePermission(user, spec, 'create');
```

### 4. Pages and Routes

Server-side pages use `withPageAuth()`:

```javascript
const { user, spec } = await withPageAuth('user', 'view');
```

## Permission Checking Functions

### Core Functions

```javascript
// Define ability for a user
const ability = defineAbilityFor(user);

// Check if action is allowed
ability.can('create', 'engagement');  // boolean

// Check role inheritance
isInheritedRole('manager', 'clerk');  // true

// Check if user has role
hasRole(user, 'manager');  // boolean

// Check if user can perform action
canPerformAction(ability, 'create', 'engagement');

// Get all available roles
getAllRoles();  // ['partner', 'manager', 'clerk', 'client_admin', 'client_user']

// Get role label for display
getRoleLabel('partner');  // 'Partner'

// Get role description
getRoleDescription('partner');  // '...'

// Get full permission matrix
getPermissionMatrix();  // { partner: {...}, manager: {...}, ... }

// Get permissions for specific role
getPermissionsForRole('manager');  // { user: ['list', 'read'], ... }
```

## Security Considerations

### 1. Authentication Required

All protected resources require authentication via `requireAuth()`:
- Invalid or missing sessions return 401 Unauthorized
- Session validation happens before permission checks

### 2. Permission Validation

Permissions are validated at multiple layers:
- **API Layer**: `requirePermission()` middleware
- **Component Layer**: Protected components check before rendering
- **Hook Layer**: `usePermissions()` validates permissions

### 3. Default Deny

The system follows a default-deny policy:
- No action is allowed unless explicitly granted
- Null/undefined users have no permissions
- Missing permissions result in access denied

### 4. No Client-Side Bypass

- Permission checks are enforced on server (API)
- Client-side checks are for UX only
- Never trust client-side permission decisions

## Testing

All RBAC functionality has been tested:

✓ Role hierarchy verification
✓ User role checking
✓ CASL ability definitions
✓ Permission matrix completeness
✓ Null/undefined user handling
✓ API endpoint authentication
✓ Permission enforcement
✓ Role inheritance

## Common Patterns

### 1. Conditional Rendering Based on Permissions

```jsx
function UserList({ user }) {
  const { can } = usePermissions(user);

  return (
    <div>
      <h1>Users</h1>
      {can('create', 'user') && <CreateUserButton />}
      {can('view', 'user') && <UserTable />}
    </div>
  );
}
```

### 2. Role-Based Feature Flags

```jsx
function Dashboard({ user }) {
  return (
    <>
      <FeatureGate feature="analytics" user={user}>
        <AnalyticsPanel />
      </FeatureGate>
      
      <FeatureGate feature="user-management" user={user}>
        <UserManagementPanel />
      </FeatureGate>
    </>
  );
}
```

### 3. Permission-Based Button Visibility

```jsx
<ProtectedComponent
  action="delete"
  subject="engagement"
  user={user}
  fallback={<span className="text-gray-400">Delete</span>}
>
  <button onClick={handleDelete}>Delete</button>
</ProtectedComponent>
```

### 4. Multiple Permission Checks

```jsx
const { can } = usePermissions(user);

if (!can('create', 'engagement') || !can('read', 'client')) {
  return <div>Insufficient permissions</div>;
}
```

## Future Enhancements

1. **Row-Level Security**: Filter records based on ownership/team
2. **Field-Level Permissions**: Control which fields users can see/edit
3. **Custom Permissions**: Allow organizations to define custom roles
4. **Permission Groups**: Bundle permissions into groups
5. **Audit Logging**: Log permission-based actions
6. **Dynamic Permissions**: Load permissions from database
7. **API Token Scopes**: Limit API token permissions

## Files Changed/Created

### Created Files:
- `src/lib/casl.js` (200 lines) - CASL configuration and role definitions
- `src/lib/use-permissions.js` (45 lines) - React hooks for permissions
- `src/components/protected-component.jsx` (120 lines) - Permission wrapper components
- `src/components/role-management.jsx` (150 lines) - Role management UI
- `src/app/user-settings/page.jsx` (60 lines) - User settings page

### Modified Files:
- `src/lib/permissions.js` - Enhanced with CASL integration
- `package.json` - Added @casl/ability dependency

## Summary

The RBAC implementation provides:

✅ **5 well-defined roles** with clear responsibilities
✅ **Role hierarchy** with inheritance
✅ **CASL integration** for robust permission checking
✅ **React hooks** for component-level checks
✅ **Protected components** for UI-level access control
✅ **API middleware** for endpoint-level checks
✅ **User settings** page showing roles and permissions
✅ **Role management** UI for administrators
✅ **Comprehensive testing** of all features
✅ **Production-ready** security model

The system is fully integrated with the existing authentication system and API middleware, requiring no additional configuration.
