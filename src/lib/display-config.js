

export const DISPLAY_LIMITS = {
  
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

export const STATUS_COLORS = {
  success: 'green',
  pending: 'yellow',
  warning: 'amber',
  error: 'red',
  info: 'blue',
  default: 'gray',
};

export const LIST_CONFIG = {
  itemsPerPage: DISPLAY_LIMITS.DEFAULT_PAGE_SIZE,
  maxInlineItems: DISPLAY_LIMITS.MAX_INLINE_ITEMS,
};

export const TIMEOUT_CONFIG = {
  api: DISPLAY_LIMITS.API_TIMEOUT_MS,
  polling: DISPLAY_LIMITS.POLLING_INTERVAL_MS,
};

export function truncate(text, limit = DISPLAY_LIMITS.TEXT_PREVIEW) {
  if (!text) return '';
  const str = String(text);
  return str.length > limit ? str.substring(0, limit) + '...' : str;
}

export function truncateJson(value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return truncate(str, DISPLAY_LIMITS.JSON_PREVIEW);
}

export function truncateTextarea(text) {
  return truncate(text, DISPLAY_LIMITS.TEXTAREA_PREVIEW);
}
