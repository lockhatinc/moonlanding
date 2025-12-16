

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

export const REPEAT_INTERVALS = {
  ONCE: 'once',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
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

export const BADGE_COLORS_MANTINE = {
  green: { bg: '#d3f9d8', color: '#2f9e44' },
  yellow: { bg: '#fff3bf', color: '#f08c00' },
  amber: { bg: '#ffe066', color: '#d9480f' },
  blue: { bg: '#d0ebff', color: '#1971c2' },
  gray: { bg: '#f1f3f5', color: '#495057' },
  red: { bg: '#ffe0e0', color: '#c92a2a' },
};

export const DISPLAY = {
  JSON_PREVIEW: 50,
  TEXTAREA_PREVIEW: 100,
  TEXT_PREVIEW: 200,
  EMAIL_PREVIEW: 150,
  URL_PREVIEW: 100,
  MAX_API_CALLS_HISTORY: 100,
  API_TIMEOUT_MS: 30000,
  POLLING_INTERVAL_MS: 2000,
  MAX_INLINE_ITEMS: 5,
  MAX_UPLOAD_SIZE_MB: 100,
  MAX_FILE_NAME_LENGTH: 255,
  MAX_FIELD_NAME_LENGTH: 100,
  TOAST_DURATION_MS: 3000,
  MAX_NOTIFICATIONS: 50,
  DEBOUNCE_SEARCH_MS: 300,
  DEBOUNCE_FORM_CHANGE_MS: 500,
};

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

export const STAGE_TRANSITIONS = {
  'info_gathering': 'commencement',
  'commencement': 'team_execution',
  'team_execution': 'partner_review',
  'partner_review': 'finalization',
  'finalization': 'close_out',
};

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const GOOGLE_SCOPES = {
  drive: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ],
  gmail: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  docs: ['https://www.googleapis.com/auth/documents'],
};

export const GOOGLE_APIS = {
  oauth2: 'https://www.googleapis.com/oauth2/v1/userinfo',
};
