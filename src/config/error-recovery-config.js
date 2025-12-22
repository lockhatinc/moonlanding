export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  TIMEOUT: 'TIMEOUT',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN',
};

export const RECOVERY_STRATEGIES = {
  [ERROR_TYPES.NETWORK]: {
    name: 'Network Error',
    message: 'Connection lost. Please check your internet connection.',
    action: 'retry',
    maxRetries: 3,
    retryDelay: 2000,
    backoffMultiplier: 2,
    userNotifiable: true,
  },
  [ERROR_TYPES.UNAUTHORIZED]: {
    name: 'Unauthorized',
    message: 'Your session has expired. Please log in again.',
    action: 'redirect',
    target: '/login',
    userNotifiable: true,
  },
  [ERROR_TYPES.FORBIDDEN]: {
    name: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    action: 'notify',
    userNotifiable: true,
  },
  [ERROR_TYPES.NOT_FOUND]: {
    name: 'Not Found',
    message: 'The requested resource could not be found.',
    action: 'notify',
    userNotifiable: true,
  },
  [ERROR_TYPES.VALIDATION]: {
    name: 'Validation Error',
    message: 'Invalid input. Please check your data and try again.',
    action: 'notify',
    userNotifiable: true,
  },
  [ERROR_TYPES.SERVER]: {
    name: 'Server Error',
    message: 'A server error occurred. Please try again later.',
    action: 'retry',
    maxRetries: 3,
    retryDelay: 5000,
    backoffMultiplier: 2,
    userNotifiable: true,
  },
  [ERROR_TYPES.TIMEOUT]: {
    name: 'Request Timeout',
    message: 'The request took too long. Please try again.',
    action: 'retry',
    maxRetries: 2,
    retryDelay: 3000,
    userNotifiable: true,
  },
  [ERROR_TYPES.CONFLICT]: {
    name: 'Conflict',
    message: 'The resource was modified by another user. Please refresh and try again.',
    action: 'refresh',
    userNotifiable: true,
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    name: 'Rate Limited',
    message: 'Too many requests. Please wait before trying again.',
    action: 'retry',
    maxRetries: 1,
    retryDelay: 60000,
    userNotifiable: false,
  },
  [ERROR_TYPES.UNKNOWN]: {
    name: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    action: 'notify',
    userNotifiable: true,
  },
};

export function getErrorType(statusCode) {
  if (!statusCode || statusCode < 0) return ERROR_TYPES.NETWORK;
  if (statusCode === 401) return ERROR_TYPES.UNAUTHORIZED;
  if (statusCode === 403) return ERROR_TYPES.FORBIDDEN;
  if (statusCode === 404) return ERROR_TYPES.NOT_FOUND;
  if (statusCode === 409) return ERROR_TYPES.CONFLICT;
  if (statusCode === 422 || statusCode === 400) return ERROR_TYPES.VALIDATION;
  if (statusCode === 429) return ERROR_TYPES.RATE_LIMIT;
  if (statusCode >= 500) return ERROR_TYPES.SERVER;
  return ERROR_TYPES.UNKNOWN;
}

export function getRecoveryStrategy(errorType) {
  return RECOVERY_STRATEGIES[errorType] || RECOVERY_STRATEGIES[ERROR_TYPES.UNKNOWN];
}

export function shouldRetry(errorType, attempt = 1) {
  const strategy = getRecoveryStrategy(errorType);
  if (strategy.action !== 'retry') return false;
  return attempt <= (strategy.maxRetries || 1);
}

export function getRetryDelay(errorType, attempt = 1) {
  const strategy = getRecoveryStrategy(errorType);
  if (strategy.action !== 'retry') return 0;
  const baseDelay = strategy.retryDelay || 1000;
  const multiplier = strategy.backoffMultiplier || 1;
  return baseDelay * Math.pow(multiplier, attempt - 1);
}
