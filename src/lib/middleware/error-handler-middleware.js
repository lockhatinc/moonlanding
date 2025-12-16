import { logger } from '@/lib/logger';

export function serializeError(error) {
  const serialized = {
    message: error.message,
    code: error.code || 'INTERNAL_SERVER_ERROR',
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
  };

  if (error.errors) {
    serialized.errors = error.errors;
  }

  if (error.details) {
    serialized.details = error.details;
  }

  if (process.env.NODE_ENV !== 'production' && error.stack) {
    serialized.stack = error.stack;
  }

  return serialized;
}

export function createErrorResponse(error) {
  const serialized = serializeError(error);
  return new Response(JSON.stringify(serialized), {
    status: error.statusCode || 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function logError(error, context = {}) {
  const severity = error.statusCode >= 500 ? 'error' : 'warn';

  logger[severity]('[API Error]', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    context,
    stack: error.stack,
  });
}

export function withErrorHandling(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      logError(error);
      throw error;
    }
  };
}

export async function handleDatabaseError(dbError, context = {}) {
  if (dbError.message?.includes('UNIQUE constraint failed')) {
    const field = dbError.message.split('UNIQUE constraint failed: ')[1]?.split('.')[1];
    const customError = new Error(`${field} already exists`);
    customError.statusCode = 409;
    customError.code = 'CONFLICT';
    customError.field = field;
    return customError;
  }

  if (dbError.message?.includes('FOREIGN KEY constraint failed')) {
    const customError = new Error('Referenced record not found');
    customError.statusCode = 400;
    customError.code = 'INVALID_REFERENCE';
    return customError;
  }

  if (dbError.message?.includes('database is locked')) {
    const customError = new Error('Database is busy, please try again');
    customError.statusCode = 503;
    customError.code = 'SERVICE_UNAVAILABLE';
    return customError;
  }

  return dbError;
}
