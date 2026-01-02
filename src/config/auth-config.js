export const SESSION = {
  cookieMaxAge: 600,
  description: 'Session cookie expiration time in seconds (10 minutes)',
};

export const TOKEN = {
  ttl: 86400,
  description: 'Access token time-to-live in seconds (24 hours)',
};

export const TIMEOUT = {
  api: 30000,
  googleApi: 10000,
  description: 'API request timeout values in milliseconds',
};

export const AUTH_CONFIG = {
  SESSION,
  TOKEN,
  TIMEOUT,
};

export default AUTH_CONFIG;
