import { ERRORS } from './constants';

export function checkPermission(user, spec, action) {
  if (!user) throw new Error(ERRORS.UNAUTHORIZED);
  if (!spec.access?.[action]?.includes(user.role)) {
    throw new Error(ERRORS.PERMISSION_DENIED);
  }
}
