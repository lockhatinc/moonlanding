import { DISPLAY } from '@/config/constants';
import { DISPLAY_LIMITS as LIMITS, FIELD_DISPLAY_RULES, TRUNCATION_INDICATORS } from '@/config';

export const DISPLAY_LIMITS = {
  ...DISPLAY,
  ...LIMITS,
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

export function truncate(text, limit = FIELD_DISPLAY_RULES.text.truncate, indicator = TRUNCATION_INDICATORS.text) {
  if (!text) return '';
  const str = String(text);
  return str.length > limit ? str.substring(0, limit) + indicator : str;
}

export function truncateJson(value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return truncate(str, FIELD_DISPLAY_RULES.json.truncate, TRUNCATION_INDICATORS.json);
}

export function truncateTextarea(text) {
  return truncate(text, FIELD_DISPLAY_RULES.textarea.truncate, TRUNCATION_INDICATORS.multiline);
}
