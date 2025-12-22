export const DATE_FORMATS = {
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

export const TIME_ZONES = {
  default: 'America/New_York',
  utc: 'UTC',
};

export const RELATIVE_TIME_THRESHOLDS = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
};
