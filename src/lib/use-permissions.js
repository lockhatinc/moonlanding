import { useState, useEffect, useCallback, useMemo } from 'react';
import { defineAbilityFor, canPerformAction, hasRole, getRoleLabel } from '@/lib/casl';

export function usePermissions(user) {
  const ability = useMemo(() => {
    if (!user) return null;
    return defineAbilityFor(user);
  }, [user?.id, user?.role]);

  const can = useCallback((action, subject) => {
    if (!ability) return false;
    return canPerformAction(ability, action, subject);
  }, [ability]);

  const cannot = useCallback((action, subject) => {
    return !can(action, subject);
  }, [can]);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    const [action, subject] = permission.split(':');
    return can(action, subject);
  }, [can, user]);

  const checkRole = useCallback((requiredRole) => {
    if (!user) return false;
    return hasRole(user, requiredRole);
  }, [user]);

  return {
    ability,
    can,
    cannot,
    hasPermission,
    checkRole,
    userRole: user?.role,
    roleName: user?.role ? getRoleLabel(user.role) : null,
  };
}

export function useCanAction(action, subject, user) {
  const { can } = usePermissions(user);
  return can(action, subject);
}

export function useHasRole(requiredRole, user) {
  const { checkRole } = usePermissions(user);
  return checkRole(requiredRole);
}

export function useAuthorized(requiredAction, requiredSubject, user) {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAuthorized(false);
      return;
    }
    const ability = defineAbilityFor(user);
    setIsAuthorized(canPerformAction(ability, requiredAction, requiredSubject));
  }, [user?.id, user?.role, requiredAction, requiredSubject]);

  return isAuthorized;
}
