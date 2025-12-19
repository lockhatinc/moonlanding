import { ROLES } from './constants.js';

export const PERMISSION_DEFAULTS = {
  list: Object.values(ROLES),
  view: Object.values(ROLES),
  create: [ROLES.PARTNER, ROLES.MANAGER],
  edit: [ROLES.PARTNER, ROLES.MANAGER],
  delete: [ROLES.PARTNER],
};

export const getDefaultAccess = (overrides = {}) => ({
  ...PERMISSION_DEFAULTS,
  ...overrides,
});
