// UNIFIED APPLICATION CONFIGURATION
// Single source of truth for all app behavior and runtime settings
// Imports & re-exports from modular constant files, plus runtime config

// Re-export all constants from unified source
export {
  ROLES,
  USER_TYPES,
  RFI_STATUS,
  RFI_CLIENT_STATUS,
  RFI_AUDITOR_STATUS,
  ENGAGEMENT_STATUS,
  ENGAGEMENT_STAGE,
  REVIEW_STATUS,
  HIGHLIGHT_STATUS,
  REPEAT_INTERVALS,
  HTTP,
  ERRORS,
  COLORS,
  BADGE_COLORS_MANTINE,
  DISPLAY,
  FIELD_TYPES,
  SQL_TYPES,
  STAGE_TRANSITIONS,
  PAGINATION,
  VALIDATION,
} from './constants';

// Re-export field iteration functions (avoid duplication)
export { getFormFields, getListFields, getDisplayFields, getEditableFields, getRequiredFields, getSearchFields, getFilterableFields, getRefFields, getField, getFieldType } from '@/lib/field-iterator';

// Import what we need for local functions
import { ROLES, ERRORS, STAGE_TRANSITIONS, PAGINATION, VALIDATION } from './constants';
import { getFormFields } from '@/lib/field-iterator';

// ============ API ENDPOINTS ============
export const API_ENDPOINTS = {
  entity: (name) => `/api/${name}`,
  entityId: (name, id) => `/api/${name}/${id}`,
  entityChild: (name, id, child) => `/api/${name}/${id}/${child}`,
};

// ============ PERMISSION MATRIX ============
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

// ============ UTILITY FUNCTIONS ============
export function canUserAction(user, entity, action) {
  if (!user) return false;
  const perms = PERMISSIONS[entity]?.[action];
  if (!perms) return true;
  return perms.includes(user.role);
}

export function getNextEngagementStage(currentStage) {
  return STAGE_TRANSITIONS[currentStage] || null;
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

// ============ ENTITY SPEC MANAGEMENT ============
export const specs = {};

export function getSpec(name) {
  const spec = specs[name];
  if (!spec) throw new Error(`Unknown entity: ${name}`);
  return spec;
}

export function getNavItems() {
  return Object.values(specs)
    .filter(s => !s.embedded && !s.parent)
    .map(s => ({
      name: s.name,
      label: s.labelPlural || s.label,
      icon: s.icon,
      href: `/${s.name}`,
    }));
}

// ============ SPEC HELPERS ============
export function buildNavigation() {
  return Object.values(specs)
    .filter(s => !s.embedded && !s.parent)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
    .map(s => ({
      name: s.name,
      label: s.labelPlural || s.label,
      icon: s.icon,
      href: `/${s.name}`,
      badge: s.badge,
    }));
}

export function getChildEntities(spec) {
  if (!spec.children) return [];
  return Object.entries(spec.children).map(([key, child]) => ({
    key,
    entity: child.entity,
    label: child.label,
    fk: child.fk,
    filter: child.filter,
    component: child.component,
  }));
}

export function getParentEntity(spec) {
  return spec.parent || null;
}

export function getDefaultSort(spec) {
  return spec.list?.defaultSort || { field: 'created_at', dir: 'desc' };
}

export function getAvailableFilters(spec) {
  return spec.list?.filters || [];
}

export function getPageSize(spec) {
  return spec.list?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE;
}

export function getEntityLabel(spec, plural = false) {
  return plural ? (spec.labelPlural || spec.label) : spec.label;
}

export function getInitialState(spec) {
  const state = {};
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'id') continue;
    if (field.default !== undefined) {
      state[key] = field.default;
    } else if (field.type === 'bool') {
      state[key] = false;
    } else if (field.type === 'int' || field.type === 'decimal') {
      state[key] = 0;
    } else if (field.type === 'json') {
      state[key] = [];
    } else {
      state[key] = '';
    }
  }
  return state;
}

// ============ TYPE PREDICATES ============
export function isEmbeddedEntity(spec) {
  return spec.embedded === true;
}

export function isParentEntity(spec) {
  return !spec.embedded && !spec.parent;
}

export function hasChildRelationships(spec) {
  return !!spec.children && Object.keys(spec.children).length > 0;
}

export function isSoftDeleted(spec) {
  return spec.fields.status && spec.softDelete?.archive;
}

// ============ OPTION HELPERS ============
export function getOptions(spec, optionKey) {
  return spec.options?.[optionKey] || [];
}

export function getOptionLabel(spec, optionKey, value) {
  const option = getOptions(spec, optionKey).find(o => o.value === value);
  return option?.label || String(value);
}

export function getOptionColor(spec, optionKey, value) {
  const option = getOptions(spec, optionKey).find(o => o.value === value);
  return option?.color || 'gray';
}

// ============ RESPONSE BUILDERS ============
export const HTTP_RESPONSES = {
  ok: (data) => ({ status: 200, data }),
  created: (data) => ({ status: 201, data }),
  badRequest: (error) => ({ status: 400, error }),
  unauthorized: (error = 'Unauthorized') => ({ status: 401, error }),
  forbidden: (error = 'Permission denied') => ({ status: 403, error }),
  notFound: (error = 'Not found') => ({ status: 404, error }),
  conflict: (error) => ({ status: 409, error }),
  serverError: (error) => ({ status: 500, error }),
};

export const RESPONSE_MAPPERS = {
  GET: (data) => ({ status: 200, data }),
  POST: (data) => ({ status: 201, data }),
  PUT: (data) => ({ status: 200, data }),
  DELETE: () => ({ status: 200, data: { success: true } }),
  LIST: (data) => ({ status: 200, data }),
};

// ============ RUNTIME CONFIGURATION ============
export const config = {
  db: {
    path: process.env.DATABASE_PATH || './data/app.db',
  },

  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
    },
    session: {
      secure: process.env.NODE_ENV === 'production',
      expires: false,
    },
  },

  drive: {
    credentialsPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './serviceAccountCloud.json',
    rootFolderId: process.env.DRIVE_ROOT_FOLDER_ID,
    cache: {
      enabled: true,
      ttl: 24 * 60 * 60,
      bucket: process.env.CACHE_BUCKET || 'cached_reviews',
    },
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || 'nodemailer',
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    smtp: {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
    },
    limits: {
      daily: 500,
      ratePerMinute: 10,
    },
  },

  jobs: {
    userSync: {
      scriptUrl: process.env.USER_SYNC_SCRIPT_URL,
      key: process.env.USER_SYNC_KEY,
      defaultRole: 'clerk',
    },
  },

  validators: {
    engagement: {
      fields: {
        stage: { validator: 'validateStageTransition' },
      },
    },
    rfi: {
      fields: {
        status: { validator: 'validateRfiStatusChange' },
      },
    },
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
  },
};

export const VALIDATORS = config.validators;
export const hasGoogleAuth = () => !!(config.auth.google.clientId && config.auth.google.clientSecret);
export const hasDriveConfig = () => !!config.drive.rootFolderId;
export const hasEmailConfig = () => !!(config.email.smtp.user && config.email.smtp.password);

// ============ EMAIL CONFIGURATION ============
export const EMAIL_RESOLVERS = {
  team: { type: 'team', role: 'all' },
  team_partners: { type: 'team', role: 'partners' },
  client_admin: { type: 'client', role: 'admin' },
  client_all: { type: 'client' },
};

export default config;
