import { COLORS, BADGE_COLORS_MANTINE } from '@/config/constants';
export { secondsToDate, dateToSeconds, formatDate, parseDate } from './utils-client';
export { fieldRegistry, getFieldHandler, coerceFieldValue, formatFieldValue } from './field-types';

export function getEnumOption(spec, optionsKey, value) {
  return spec.options?.[optionsKey]?.find(o => String(o.value) === String(value));
}

export function getEnumOptions(spec, optionsKey) {
  return spec.options?.[optionsKey] || [];
}

export const BADGE_COLORS = COLORS.BADGE;

export function getBadgeStyle(colorName) {
  return BADGE_COLORS_MANTINE[colorName] || BADGE_COLORS_MANTINE.gray;
}
