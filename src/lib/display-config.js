// Display Configuration Constants - Consolidates UI behavior configuration
// All truncation, limit, and display preferences in one place

// Text truncation limits (characters before ellipsis)
export const DISPLAY_LIMITS = {
  // Field display truncation
  JSON_PREVIEW: 50,           // JSON field preview length
  TEXTAREA_PREVIEW: 100,      // Textarea preview in lists
  TEXT_PREVIEW: 200,          // General text preview
  EMAIL_PREVIEW: 150,         // Email addresses
  URL_PREVIEW: 100,           // URLs

  // API and realtime
  MAX_API_CALLS_HISTORY: 100, // Debug: max API calls to keep in history
  API_TIMEOUT_MS: 30000,      // API request timeout
  POLLING_INTERVAL_MS: 2000,  // Realtime polling interval

  // List pagination
  DEFAULT_PAGE_SIZE: 20,      // Items per page in lists
  MAX_INLINE_ITEMS: 5,        // Max items shown inline before "see more"

  // File handling
  MAX_UPLOAD_SIZE_MB: 100,    // Maximum upload file size
  MAX_FILE_NAME_LENGTH: 255,

  // Forms and inputs
  MIN_PASSWORD_LENGTH: 8,
  MAX_FIELD_NAME_LENGTH: 100,

  // Notifications and alerts
  TOAST_DURATION_MS: 3000,    // How long toast notifications show
  MAX_NOTIFICATIONS: 50,      // Max notifications to keep in queue

  // Performance
  DEBOUNCE_SEARCH_MS: 300,    // Search input debounce
  DEBOUNCE_FORM_CHANGE_MS: 500, // Form field change debounce
};

// Color scheme for status badges
export const STATUS_COLORS = {
  success: 'green',
  pending: 'yellow',
  warning: 'amber',
  error: 'red',
  info: 'blue',
  default: 'gray',
};

// Pagination and list display
export const LIST_CONFIG = {
  itemsPerPage: DISPLAY_LIMITS.DEFAULT_PAGE_SIZE,
  maxInlineItems: DISPLAY_LIMITS.MAX_INLINE_ITEMS,
};

// Timeout and retry configuration
export const TIMEOUT_CONFIG = {
  api: DISPLAY_LIMITS.API_TIMEOUT_MS,
  polling: DISPLAY_LIMITS.POLLING_INTERVAL_MS,
};

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} limit - Character limit
 * @returns {string} Truncated text
 */
export function truncate(text, limit = DISPLAY_LIMITS.TEXT_PREVIEW) {
  if (!text) return '';
  const str = String(text);
  return str.length > limit ? str.substring(0, limit) + '...' : str;
}

/**
 * Truncate JSON display
 * @param {*} value - Value to display
 * @returns {string} Truncated JSON
 */
export function truncateJson(value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return truncate(str, DISPLAY_LIMITS.JSON_PREVIEW);
}

/**
 * Truncate textarea display
 * @param {string} text - Text to truncate
 * @returns {string} Truncated text
 */
export function truncateTextarea(text) {
  return truncate(text, DISPLAY_LIMITS.TEXTAREA_PREVIEW);
}
