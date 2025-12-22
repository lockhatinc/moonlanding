export const HTTP_STATUS_CODES = {
  success: {
    ok: 200,
    created: 201,
    accepted: 202,
    noContent: 204,
  },
  redirect: {
    movedPermanently: 301,
    found: 302,
    seeOther: 303,
    notModified: 304,
    temporaryRedirect: 307,
  },
  client: {
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    methodNotAllowed: 405,
    conflict: 409,
    unprocessableEntity: 422,
    tooManyRequests: 429,
  },
  server: {
    internalServerError: 500,
    notImplemented: 501,
    badGateway: 502,
    serviceUnavailable: 503,
    gatewayTimeout: 504,
  },
};

export const HTTP_STATUS_MESSAGES = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  307: 'Temporary Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

export const ERROR_STATUS_CODES = {
  INVALID_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
};

export const HTTP_RETRY_CONFIG = {
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  maxRetries: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
};

export const HTTP_TIMEOUT_CONFIG = {
  defaultTimeoutMs: 30000,
  uploadTimeoutMs: 120000,
  downloadTimeoutMs: 60000,
};
