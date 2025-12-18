import { ERRORS } from './constants';

// All permissions are now defined per-spec in entity spec definitions under spec.access
// This ensures single source of truth for permissions across the application

export function checkPermission(user, spec, action) {
  if (!user) throw new Error(ERRORS.UNAUTHORIZED);
  if (!spec.access?.[action]?.includes(user.role)) {
    throw new Error(ERRORS.PERMISSION_DENIED);
  }
}
