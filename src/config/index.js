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
    return value ? new Date(value * 1000).toLocaleString() : '';
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

export default config;
