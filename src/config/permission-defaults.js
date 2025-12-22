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

export const PARTNER_ONLY_ACCESS = {
  list: [ROLES.PARTNER],
  view: [ROLES.PARTNER],
  create: [ROLES.PARTNER],
  edit: [ROLES.PARTNER],
  delete: [ROLES.PARTNER],
};

export const PARTNER_MANAGER_ACCESS = {
  list: [ROLES.PARTNER, ROLES.MANAGER],
  view: [ROLES.PARTNER, ROLES.MANAGER],
  create: [ROLES.PARTNER, ROLES.MANAGER],
  edit: [ROLES.PARTNER, ROLES.MANAGER],
  delete: [ROLES.PARTNER],
};

export const ALL_STAFF_ACCESS = {
  list: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
  view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
  create: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
  edit: [ROLES.PARTNER],
  delete: [ROLES.PARTNER],
};

export const READ_ONLY_ACCESS = {
  list: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
  view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
  create: [],
  edit: [],
  delete: [],
};
