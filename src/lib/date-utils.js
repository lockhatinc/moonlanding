const SECONDS_TO_MS = 1000;
const DATE_FORMATS = {
  short: { month: 'short', day: 'numeric', year: 'numeric' },
  long: { month: 'long', day: 'numeric', year: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit' },
  datetime: { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  iso: 'iso',
};
const T = { minute: 60, hour: 3600, day: 86400, week: 604800 };

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

export function isWorkingDay(date) {
  const d = typeof date === 'number' ? secondsToDate(date) : date;
  if (!d) return false;
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

export function getWorkingDaysDiff(startSeconds, endSeconds) {
  if (!startSeconds || !endSeconds) return 0;
  const start = secondsToDate(startSeconds);
  const end = secondsToDate(endSeconds);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    if (isWorkingDay(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function addWorkingDays(startSeconds, numDays) {
  if (!startSeconds || numDays <= 0) return startSeconds;
  const date = secondsToDate(startSeconds);
  let added = 0;

  while (added < numDays) {
    date.setDate(date.getDate() + 1);
    if (isWorkingDay(date)) added++;
  }
  return dateToSeconds(date);
}

export function formatDateTime(value) {
  if (!value) return null;
  const date = typeof value === 'number' ? secondsToDate(value) : new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, DATE_FORMATS.datetime);
}

export function formatCurrency(amount, currency = 'ZAR', locale = 'en-ZA') {
  if (amount === null || amount === undefined) return null;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return null;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num);
}

export function formatNumber(value, decimals = 0, locale = 'en-ZA') {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
}

export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || bytes < 0) return null;
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return null;
  const h = Math.floor(seconds / T.hour);
  const m = Math.floor((seconds % T.hour) / T.minute);
  const s = Math.floor(seconds % T.minute);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function timeAgo(value) {
  if (!value) return null;
  const date = typeof value === 'number' ? secondsToDate(value) : new Date(value);
  if (isNaN(date.getTime())) return null;
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / SECONDS_TO_MS);
  if (diffSec < 0) return 'just now';
  if (diffSec < T.minute) return 'just now';
  if (diffSec < T.hour) return `${Math.floor(diffSec / T.minute)}m ago`;
  if (diffSec < T.day) return `${Math.floor(diffSec / T.hour)}h ago`;
  if (diffSec < T.week) return `${Math.floor(diffSec / T.day)}d ago`;
  return formatDate(value, 'short');
}

export function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text) return '';
  const str = String(text);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + suffix;
}

export function getFinancialYear(value) {
  const date = typeof value === 'number' ? secondsToDate(value) : new Date(value || Date.now());
  if (!date || isNaN(date.getTime())) return null;
  const month = date.getMonth();
  const year = date.getFullYear();
  return month >= 2 ? year : year - 1;
}

export function getFinancialYearRange(year) {
  const start = new Date(year, 2, 1);
  const end = new Date(year + 1, 1, 28);
  const lastDay = new Date(year + 1, 2, 0).getDate();
  end.setDate(lastDay);
  return { start: dateToSeconds(start), end: dateToSeconds(end) };
}

export function isWithinYears(dateSeconds, years = 2) {
  if (!dateSeconds) return false;
  const date = secondsToDate(dateSeconds);
  const now = new Date();
  const limit = new Date(now);
  limit.setFullYear(limit.getFullYear() + years);
  return date <= limit;
}

export function isBeforeDate(aSeconds, bSeconds) {
  if (!aSeconds || !bSeconds) return false;
  return aSeconds < bSeconds;
}

export function isDeadlineBeforeCommencement(deadlineSeconds, commencementSeconds) {
  return isBeforeDate(deadlineSeconds, commencementSeconds);
}

export function isDeadlineBeforeRequested(deadlineSeconds, requestedSeconds) {
  return isBeforeDate(deadlineSeconds, requestedSeconds);
}

export function getDaysUntil(targetSeconds) {
  if (!targetSeconds) return null;
  const now = Math.floor(Date.now() / SECONDS_TO_MS);
  return Math.ceil((targetSeconds - now) / 86400);
}

export function toUtcIso(value) {
  if (!value) return null;
  const date = typeof value === 'number' ? secondsToDate(value) : new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function fromFirestoreTimestamp(ts) {
  if (!ts) return null;
  if (ts._seconds !== undefined) return ts._seconds;
  if (ts.seconds !== undefined) return ts.seconds;
  if (typeof ts === 'number') return ts;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : dateToSeconds(d);
}
