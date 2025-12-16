import { ROLES, ERRORS } from './constants';

export const PERMISSIONS = {
  engagement: {
    list: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.CLIENT],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.CLIENT],
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
  },
  review: {
    list: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
  },
  rfi: {
    list: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.CLIENT],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.CLIENT],
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
  },
};

export function canUserAction(user, entity, action) {
  if (!user) return false;
  const perms = PERMISSIONS[entity]?.[action];
  if (!perms) return true;
  return perms.includes(user.role);
}

export function canUserPerformAction(user, spec, action) {
  return !user ? false : (spec.access?.[action]?.includes(user.role) ?? true);
}

export function checkPermission(user, entity, action) {
  if (!user) throw new Error(ERRORS.UNAUTHORIZED);
  const perms = PERMISSIONS[entity]?.[action];
  if (perms && !perms.includes(user.role)) {
    throw new Error(ERRORS.PERMISSION_DENIED);
  }
}
