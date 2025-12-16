import { DISPLAY } from '@/config/constants';

export const DISPLAY_LIMITS = {
  ...DISPLAY,
  DEFAULT_PAGE_SIZE: 20,
  MIN_PASSWORD_LENGTH: 8,
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
