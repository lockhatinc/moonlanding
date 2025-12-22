import { DATE_FORMATS, TIME_ZONES, RELATIVE_TIME_THRESHOLDS } from '@/config/format-config';

const SECONDS_TO_MS = 1000;

export function secondsToDate(seconds) {
  return seconds ? new Date(seconds * SECONDS_TO_MS) : null;
}

export function dateToSeconds(date) {
  return date ? Math.floor(date.getTime() / SECONDS_TO_MS) : null;
}

export function formatDate(value, format = 'short') {
  if (!value) return null;
  const date = typeof value === 'number' ? secondsToDate(value) : new Date(value);
  if (isNaN(date.getTime())) return null;

  if (format === 'iso') {
    return date.toISOString().split('T')[0];
  }

  const formatOptions = DATE_FORMATS[format] || DATE_FORMATS.short;
  return date.toLocaleDateString(undefined, formatOptions);
}

export function parseDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return dateToSeconds(date);
}
