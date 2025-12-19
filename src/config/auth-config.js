export const SESSION = {
  cookieMaxAge: 600,
  description: 'Session cookie expiration time in seconds (10 minutes)',
};

export const TOKEN = {
  ttl: 86400,
  description: 'Access token time-to-live in seconds (24 hours)',
};

export const CACHE = {
  ttl: 1800000,
  description: 'Permission cache TTL in milliseconds (30 minutes)',
};

export const TIMEOUT = {
  api: 30000,
  googleApi: 10000,
  description: 'API request timeout values in milliseconds',
};

export const AUTH_CONFIG = {
  SESSION,
  TOKEN,
  CACHE,
  TIMEOUT,
};

export default AUTH_CONFIG;
