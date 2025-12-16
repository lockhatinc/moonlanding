import { logger } from '@/lib/logger';
import { isAppError } from './error-types';

export function logError(error, context = {}, severity = null) {
  const isApp = isAppError(error);

  const determinedSeverity = severity || (error.statusCode >= 500 ? 'error' : 'warn');

  const errorInfo = {
    message: error.message,
    code: error.code || 'UNKNOWN',
    statusCode: error.statusCode || 500,
    name: error.name || 'Error',
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error.stack && process.env.NODE_ENV !== 'production') {
    errorInfo.stack = error.stack;
  }

  if (error.errors) {
    errorInfo.validationErrors = error.errors;
  }

  if (error.details) {
    errorInfo.details = error.details;
  }

  logger[determinedSeverity]('[ERROR]', errorInfo);

  return errorInfo;
}

export function logValidationError(errors, context = {}) {
  logger.warn('[VALIDATION ERROR]', {
    errors,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export function logAuthError(reason, context = {}) {
  logger.warn('[AUTH ERROR]', {
    reason,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export function logPermissionError(entity, action, context = {}) {
  logger.warn('[PERMISSION ERROR]', {
    entity,
    action,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export function logDatabaseError(operation, error, context = {}) {
  logger.error('[DATABASE ERROR]', {
    operation,
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export function logExternalAPIError(service, error, context = {}) {
  logger.error('[EXTERNAL API ERROR]', {
    service,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    ...context,
  });
}
