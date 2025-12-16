import { normalizeError, isAppError } from './error-types';
import { createErrorResponse } from './error-serializer';
import { logError } from './error-logger';

export function withErrorHandling(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      logError(error, { handler: handler.name || 'unknown' });
      const normalized = isAppError(error) ? error : normalizeError(error);
      throw normalized;
    }
  };
}

export function withAsyncErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const context_info = {
        route: context?.params?.entity || 'unknown',
        method: request.method || 'unknown',
      };

      logError(error, context_info);

      const includeStack = process.env.NODE_ENV !== 'production';
      const normalized = isAppError(error) ? error : normalizeError(error);

      return createErrorResponse(normalized, includeStack);
    }
  };
}

export function handleDatabaseError(dbError, operation = 'unknown') {
  if (dbError.message?.includes('UNIQUE constraint failed')) {
    const match = dbError.message.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
    const field = match ? match[2] : 'unknown';
    const error = new Error(`${field} already exists`);
    error.statusCode = 409;
    error.code = 'CONFLICT';
    error.field = field;
    return error;
  }

  if (dbError.message?.includes('FOREIGN KEY constraint failed')) {
    const error = new Error('Referenced record not found');
    error.statusCode = 400;
    error.code = 'INVALID_REFERENCE';
    return error;
  }

  if (dbError.message?.includes('database is locked')) {
    const error = new Error('Database is temporarily unavailable');
    error.statusCode = 503;
    error.code = 'SERVICE_UNAVAILABLE';
    return error;
  }

  if (dbError.message?.includes('no such table')) {
    const error = new Error('Database structure error');
    error.statusCode = 500;
    error.code = 'DATABASE_STRUCTURE_ERROR';
    return error;
  }

  return new Error(`Database operation failed: ${dbError.message}`);
}

export function validateAndHandleErrors(data, validators = []) {
  const errors = {};

  for (const validator of validators) {
    const result = validator(data);
    if (result.error) {
      errors[result.field] = result.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    const error = new Error('Validation failed');
    error.code = 'VALIDATION_ERROR';
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
}

export function createCustomErrorHandler(errorMap = {}) {
  return (error) => {
    for (const [errorType, handler] of Object.entries(errorMap)) {
      if (error.name === errorType || error.code === errorType) {
        return handler(error);
      }
    }

    return normalizeError(error);
  };
}
