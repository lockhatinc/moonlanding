'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { can, getAllRoles, getRoleLabel } from '@/services/permission.service';

export function usePermissions(user, spec) {
  const checkAction = useCallback((action, subject) => {
    if (!user) return false;
    if (spec) return can(user, spec, action);
    if (subject && typeof subject === 'object') return can(user, subject, action);
    return !subject || can(user, { access: {} }, action);
  }, [user, spec]);

  const checkRole = useCallback((requiredRole) => {
    if (!user) return false;
    return user.role === requiredRole;
  }, [user]);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    const [action, subject] = permission.split(':');
    return checkAction(action, subject);
  }, [checkAction, user]);

  const canCreate = useMemo(() => spec ? can(user, spec, 'create') : false, [user, spec]);
  const canEdit = useMemo(() => spec ? can(user, spec, 'edit') : false, [user, spec]);
  const canDelete = useMemo(() => spec ? can(user, spec, 'delete') : false, [user, spec]);
  const canView = useMemo(() => spec ? can(user, spec, 'view') : false, [user, spec]);

  return {
    can: checkAction,
    cannot: (action, subject) => !checkAction(action, subject),
    hasPermission,
    checkRole,
    canCreate,
    canEdit,
    canDelete,
    canView,
    userRole: user?.role,
    roleName: user?.role ? getRoleLabel(user.role) : null,
  };
}

export function useCanAction(action, subject, user) {
  const { can: checkAction } = usePermissions(user);
  return checkAction(action, subject);
}

export function useHasRole(requiredRole, user) {
  const { checkRole } = usePermissions(user);
  return checkRole(requiredRole);
}

export function useAuthorized(requiredAction, requiredSubject, user) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  useEffect(() => {
    if (!user) { setIsAuthorized(false); return; }
    setIsAuthorized(can(user, { name: requiredSubject, access: {} }, requiredAction));
  }, [user?.id, user?.role, requiredAction, requiredSubject]);
  return isAuthorized;
}
