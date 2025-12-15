// UNIFIED APPLICATION CONFIGURATION
// Single source of truth for all app behavior and runtime settings

// ============ ROLES & PERMISSIONS ============
export const ROLES = {
  PARTNER: 'partner',
  MANAGER: 'manager',
  CLERK: 'clerk',
  AUDITOR: 'auditor',
  CLIENT: 'client',
};

export const USER_TYPES = {
  AUDITOR: 'auditor',
  CLIENT: 'client',
};

// ============ STATUS CONSTANTS ============
export const RFI_STATUS = {
  PENDING: 0,
  COMPLETED: 1,
};

export const RFI_CLIENT_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  RESPONDED: 'responded',
  COMPLETED: 'completed',
};

export const RFI_AUDITOR_STATUS = {
  REQUESTED: 'requested',
  REVIEWING: 'reviewing',
  QUERIES: 'queries',
  RECEIVED: 'received',
};

export const ENGAGEMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const ENGAGEMENT_STAGE = {
  INFO_GATHERING: 'info_gathering',
  COMMENCEMENT: 'commencement',
  TEAM_EXECUTION: 'team_execution',
  PARTNER_REVIEW: 'partner_review',
  FINALIZATION: 'finalization',
  CLOSE_OUT: 'close_out',
};

export const REVIEW_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
};

export const HIGHLIGHT_STATUS = {
  UNRESOLVED: 'unresolved',
  PARTIALLY_RESOLVED: 'partially_resolved',
  RESOLVED: 'resolved',
};

// ============ HTTP & ERRORS ============
export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  PERMISSION_DENIED: 'Permission denied',
  NOT_FOUND: 'Not found',
  INVALID_INPUT: 'Invalid input',
  INVALID_STATUS: 'Invalid status transition',
  DUPLICATE_ENTRY: 'Entry already exists',
  CANNOT_DELETE: 'Cannot delete this item',
  INVALID_DATE: 'Invalid date format',
  FILE_TOO_LARGE: 'File is too large',
  INVALID_EMAIL: 'Invalid email address',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_API_ERROR: 'External API request failed',
};

// ============ UI CONSTANTS ============
export const DISPLAY = {
  JSON_PREVIEW: 50,
  TEXTAREA_PREVIEW: 100,
  TEXT_PREVIEW: 200,
  EMAIL_PREVIEW: 150,
  URL_PREVIEW: 100,
  MAX_API_CALLS_HISTORY: 100,
  API_TIMEOUT_MS: 30000,
  POLLING_INTERVAL_MS: 2000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_INLINE_ITEMS: 5,
  MAX_UPLOAD_SIZE_MB: 100,
  MAX_FILE_NAME_LENGTH: 255,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FIELD_NAME_LENGTH: 100,
  TOAST_DURATION_MS: 3000,
  MAX_NOTIFICATIONS: 50,
  DEBOUNCE_SEARCH_MS: 300,
  DEBOUNCE_FORM_CHANGE_MS: 500,
};

export const COLORS = {
  DEFAULT: '#B0B0B0',
  SCROLLED_TO: '#7F7EFF',
  PARTNER: '#ff4141',
  RESOLVED: '#44BBA4',
  BADGE: {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
  },
};

// ============ WORKFLOW RULES ============
export const STAGE_TRANSITIONS = {
  'info_gathering': 'commencement',
  'commencement': 'team_execution',
  'team_execution': 'partner_review',
  'partner_review': 'finalization',
  'finalization': 'close_out',
};

// ============ FIELD TYPE DEFINITIONS ============
export const FIELD_TYPES = {
  text: { sqlType: 'TEXT' },
  email: { sqlType: 'TEXT' },
  textarea: { sqlType: 'TEXT' },
  int: { sqlType: 'INTEGER' },
  decimal: { sqlType: 'REAL' },
  bool: { sqlType: 'INTEGER' },
  date: { sqlType: 'INTEGER' },
  timestamp: { sqlType: 'INTEGER' },
  enum: { sqlType: 'TEXT' },
  ref: { sqlType: 'TEXT' },
  json: { sqlType: 'TEXT' },
  image: { sqlType: 'TEXT' },
  id: { sqlType: 'TEXT PRIMARY KEY' },
};

export const SQL_TYPES = {
  id: 'TEXT PRIMARY KEY',
  text: 'TEXT',
  textarea: 'TEXT',
  email: 'TEXT',
  int: 'INTEGER',
  decimal: 'REAL',
  bool: 'INTEGER',
  date: 'INTEGER',
  timestamp: 'INTEGER',
  json: 'TEXT',
  image: 'TEXT',
  ref: 'TEXT',
  enum: 'TEXT',
};

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

// ============ VALIDATION RULES ============
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
};

// ============ PAGINATION ============
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// ============ REPEAT INTERVALS ============
export const REPEAT_INTERVALS = {
  ONCE: 'once',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
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

export function formatValue(value, fieldType) {
  if (value === null || value === undefined) return null;
  if (fieldType === 'bool') return value ? 'Yes' : 'No';
  if (fieldType === 'date' || fieldType === 'timestamp') {
    const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
    return date ? date.toLocaleString() : '';
  }
  return String(value);
}

export function truncate(text, limit = DISPLAY.TEXT_PREVIEW) {
  if (!text) return '';
  const str = String(text);
  return str.length > limit ? str.substring(0, limit) + '...' : str;
}

export function isRfiCompleted(rfi) {
  return rfi.status === RFI_STATUS.COMPLETED || rfi.client_status === RFI_CLIENT_STATUS.COMPLETED;
}

export function isEngagementActive(engagement) {
  return engagement.status === ENGAGEMENT_STATUS.ACTIVE || engagement.stage === ENGAGEMENT_STAGE.TEAM_EXECUTION;
}

export function isReviewOpen(review) {
  return review.status === REVIEW_STATUS.OPEN;
}

// ============ RUNTIME ENVIRONMENT CONFIG ============
export const config = {
  // Database
  db: {
    path: process.env.DATABASE_PATH || './data/app.db',
  },

  // Authentication
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

  // Google Drive
  drive: {
    credentialsPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './serviceAccountCloud.json',
    rootFolderId: process.env.DRIVE_ROOT_FOLDER_ID,
    cache: {
      enabled: true,
      ttl: 24 * 60 * 60, // 24 hours
      bucket: process.env.CACHE_BUCKET || 'cached_reviews',
    },
  },

  // Email
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

  // Jobs/Sync
  jobs: {
    userSync: {
      scriptUrl: process.env.USER_SYNC_SCRIPT_URL,
      key: process.env.USER_SYNC_KEY,
      defaultRole: 'clerk',
    },
  },

  // API Validators (entity-specific field validation on update)
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

  // App
  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
  },
};

// Helper to check if Google auth is configured
export const hasGoogleAuth = () => !!(config.auth.google.clientId && config.auth.google.clientSecret);

// Helper to check if Drive is configured
export const hasDriveConfig = () => !!config.drive.rootFolderId;

// Helper to check if email is configured
export const hasEmailConfig = () => !!(config.email.smtp.user && config.email.smtp.password);

// ============ EMAIL RECIPIENTS RESOLVER ============
export const EMAIL_RESOLVERS = {
  team: { type: 'team', role: 'all' },
  team_partners: { type: 'team', role: 'partners' },
  client_admin: { type: 'client', role: 'admin' },
  client_all: { type: 'client' },
};

// ============ ENTITY SPECS & VALIDATORS ============
// specs will be populated by the engine at runtime
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

export const VALIDATORS = config.validators;

// ============ GENERIC RESPONSE BUILDERS ============
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

// ============ PERMISSION CHECKER ============
// Generic permission check based on config
export function checkPermission(user, entity, action) {
  if (!user) throw new Error(ERRORS.UNAUTHORIZED);
  const perms = PERMISSIONS[entity]?.[action];
  if (perms && !perms.includes(user.role)) {
    throw new Error(ERRORS.PERMISSION_DENIED);
  }
}

// ============ FORM FIELD BUILDERS ============
// Generate form field config from spec fields
export function buildFormFields(spec) {
  const formFields = [];
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.hidden || field.readOnly || field.type === 'id') continue;
    formFields.push({
      key,
      ...field,
      required: field.required || false,
      validate: field.isValid ? field.isValid : () => true,
    });
  }
  return formFields;
}

// ============ LIST VIEW BUILDERS ============
// Generate list view config from spec fields
export function buildListColumns(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.list)
    .map(([key, f]) => ({
      key,
      label: f.label,
      sortable: f.sortable,
      width: f.width,
      type: f.type,
    }));
}

// ============ RESPONSE MAPPERS ============
// Map CRUD operations to HTTP responses
export const RESPONSE_MAPPERS = {
  GET: (data) => ({ status: 200, data }),
  POST: (data) => ({ status: 201, data }),
  PUT: (data) => ({ status: 200, data }),
  DELETE: () => ({ status: 200, data: { success: true } }),
  LIST: (data) => ({ status: 200, data }),
};

// ============ ACTION BUILDERS ============
// Generate entity actions from config
export function buildActions(spec) {
  if (!spec.actions) return [];
  return spec.actions.map(action => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    permission: action.permission,
    handler: action.handler,
    dialog: action.dialog,
  }));
}

// ============ COMPUTED GETTERS ============
// Functions to compute common values from config
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

// ============ TYPE PREDICATES ============
// Check entity properties
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

// ============ FIELD UTILITIES ============
// Work with field definitions
export function getRequiredFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.required)
    .map(([key]) => key);
}

export function getEditableFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && !f.readOnly && f.type !== 'id')
    .map(([key]) => key);
}

export function getField(spec, fieldKey) {
  return spec.fields[fieldKey];
}

export function getFieldType(spec, fieldKey) {
  return spec.fields[fieldKey]?.type;
}

// ============ OPTION HELPERS ============
// Work with enum options
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

// ============ SEARCH & FILTER HELPERS ============
// Generic search and filtering
export function getSearchableFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.search)
    .map(([key]) => key);
}

export function getFilterableFields(spec) {
  return (spec.list?.filters || [])
    .map(filterKey => spec.fields[filterKey])
    .filter(Boolean);
}

// ============ NAVIGATION & ROUTING ============
// Generate navigation based on config
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

// ============ RELATIONSHIP HELPERS ============
// Handle entity relationships
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

// ============ STATE INITIALIZERS ============
// Generate initial state from spec
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

// ============ DISPLAY HELPERS ============
// Format values for display
export function formatDisplayText(value, field) {
  if (value === null || value === undefined) return '—';
  if (field.type === 'bool') return value ? 'Yes' : 'No';
  if (field.type === 'date' || field.type === 'timestamp') {
    const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
    return date.toLocaleDateString();
  }
  if (field.type === 'decimal') return parseFloat(value).toFixed(2);
  return String(value);
}

// ============ QUERY BUILDERS ============
// Build queries from config
export function buildListQuery(spec, page = 1, sort = null, filter = null) {
  const pageSize = getPageSize(spec);
  const offset = (page - 1) * pageSize;
  const sortConfig = sort || getDefaultSort(spec);
  return {
    offset,
    limit: pageSize,
    sort: sortConfig,
    filter: filter || {},
  };
}

// ============ BATCH OPERATIONS ============
// Support for batch operations on entities
export function canBatchDelete(spec) {
  return !spec.embedded && spec.access?.delete;
}

export function canBatchUpdate(spec) {
  return !spec.embedded && spec.access?.edit;
}

// ============ EXPORT HELPERS ============
// Generate export configs from spec
export function getExportableFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && f.type !== 'id')
    .map(([key, f]) => ({
      key,
      label: f.label,
      type: f.type,
    }));
}

// ============ AUDIT & LOGGING ============
// Extract audit-relevant fields
export function getAuditFields(spec) {
  return {
    created_by: spec.fields.created_by,
    created_at: spec.fields.created_at,
    updated_at: spec.fields.updated_at,
  };
}

// ============ VALIDATION BUILDERS ============
// Generate validators from spec
export function buildValidators(spec) {
  const validators = {};
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.required) {
      validators[key] = [(v) => v && v.toString().trim() !== '', 'Required'];
    }
    if (field.type === 'email' && field.isValid) {
      validators[key] = [(v) => VALIDATION.EMAIL_REGEX.test(v), 'Invalid email'];
    }
    if (field.type === 'int') {
      validators[key] = [(v) => Number.isInteger(+v), 'Must be integer'];
    }
  }
  return validators;
}

export default config;
