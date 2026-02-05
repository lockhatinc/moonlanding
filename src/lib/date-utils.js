const SECONDS_TO_MS = 1000;

const DATE_FORMATS = {
  short: { month: 'short', day: 'numeric', year: 'numeric' },
  long: { month: 'long', day: 'numeric', year: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit' },
  datetime: {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  iso: 'iso',
};

const TIME_ZONES = {
  default: 'America/New_York',
  utc: 'UTC',
};

const RELATIVE_TIME_THRESHOLDS = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
};

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
