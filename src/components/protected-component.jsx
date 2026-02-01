import { usePermissions } from '@/lib/use-permissions';

export function ProtectedComponent({
  action,
  subject,
  user,
  children,
  fallback = null,
  requireAll = false,
  permissions = [],
}) {
  const { can, checkRole } = usePermissions(user);

  if (permissions.length > 0) {
    const hasAllPermissions = requireAll
      ? permissions.every(([act, subj]) => can(act, subj))
      : permissions.some(([act, subj]) => can(act, subj));

    if (!hasAllPermissions) return fallback;
    return children;
  }

  if (action && subject) {
    if (!can(action, subject)) return fallback;
    return children;
  }

  return children;
}

export function RoleBasedComponent({
  roles,
  user,
  children,
  fallback = null,
  requireAll = false,
}) {
  const { checkRole } = usePermissions(user);

  if (!user) return fallback;

  const rolesArray = Array.isArray(roles) ? roles : [roles];
  const hasRequiredRole = requireAll
    ? rolesArray.every(role => checkRole(role))
    : rolesArray.some(role => checkRole(role));

  if (!hasRequiredRole) return fallback;
  return children;
}

export function ConditionalRender({
  condition,
  children,
  fallback = null,
}) {
  return condition ? children : fallback;
}

export function MultiplePermissionCheck({
  permissions = [],
  requireAll = false,
  user,
  children,
  fallback = null,
}) {
  const { can } = usePermissions(user);

  const hasPermission = requireAll
    ? permissions.every(([action, subject]) => can(action, subject))
    : permissions.some(([action, subject]) => can(action, subject));

  if (!hasPermission) return fallback;
  return children;
}

export function VisibilityGate({
  permission,
  user,
  children,
  fallback = null,
}) {
  const { hasPermission } = usePermissions(user);

  if (!hasPermission(permission)) return fallback;
  return children;
}

export function FeatureGate({
  feature,
  user,
  children,
  fallback = null,
}) {
  const allowedForRole = {
    'advanced-pdf': ['partner', 'manager'],
    'team-management': ['partner', 'manager'],
    'analytics': ['partner'],
    'user-management': ['partner'],
    'audit-logs': ['partner', 'manager'],
    'integrations': ['partner'],
  };

  const { checkRole } = usePermissions(user);
  const allowedRoles = allowedForRole[feature] || [];

  const hasAccess = user && allowedRoles.some(role => checkRole(role));

  if (!hasAccess) return fallback;
  return children;
}

export function HiddenIfUnauthorized({
  action,
  subject,
  user,
  children,
}) {
  const { can } = usePermissions(user);

  if (!can(action, subject)) return null;
  return children;
}
