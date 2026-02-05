import { HTTP } from '@/config/constants';
import { ERROR_MESSAGES, LOG_PREFIXES } from '@/config';
import { AppError } from '@/lib/errors';

export { AppError };

const ERROR_TYPES = {
  VALIDATION: { code: 'VALIDATION_ERROR', status: HTTP.BAD_REQUEST },
  NOT_FOUND: { code: 'NOT_FOUND', status: HTTP.NOT_FOUND },
  PERMISSION: { code: 'PERMISSION_DENIED', status: HTTP.FORBIDDEN },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: HTTP.UNAUTHORIZED },
  CONFLICT: { code: 'CONFLICT', status: HTTP.CONFLICT },
  DATABASE: { code: 'DATABASE_ERROR', status: HTTP.INTERNAL_ERROR },
  EXTERNAL_API: { code: 'EXTERNAL_API_ERROR', status: HTTP.INTERNAL_ERROR },
  INTERNAL: { code: 'INTERNAL_ERROR', status: HTTP.INTERNAL_ERROR },
};

export function createError(type, message, context = {}) {
  const errorType = ERROR_TYPES[type] || ERROR_TYPES.INTERNAL;
  const error = new Error(message);
  error.name = `${type}Error`;
  error.code = errorType.code;
  error.statusCode = context.statusCode || errorType.status;
  error.context = context;
  error.toJSON = function() {
    return {
      status: 'error',
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  };
  return error;
}

export const ValidationError = (message, errors = {}, context = {}) =>
  createError('VALIDATION', message, { ...context, errors });

export const NotFoundError = (entity, id, context = {}) =>
  createError('NOT_FOUND', ERROR_MESSAGES.operation.notFound(`${entity} with id ${id}`), { ...context, entity, id });

export const PermissionError = (action = 'access', context = {}) =>
  createError('PERMISSION', ERROR_MESSAGES.permission.denied, context);

export const UnauthorizedError = (context = {}) =>
  createError('UNAUTHORIZED', ERROR_MESSAGES.auth.unauthorized, context);

export const ConflictError = (field = 'record', context = {}) =>
  createError('CONFLICT', ERROR_MESSAGES.operation.alreadyExists(field), context);

export const DatabaseError = (operation, originalError = null, context = {}) =>
  createError('DATABASE', ERROR_MESSAGES.system.error, { ...context, originalMessage: originalError?.message, originalError });

export const ExternalAPIError = (service, message, statusCode = HTTP.INTERNAL_ERROR, context = {}) =>
  createError('EXTERNAL_API', message, { statusCode, ...context, service });

export const errorHandler = (handler) => {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (e) {
      const error = normalizeError(e);
      console.error(`[ERROR] ${error.code}:`, error.toJSON());
      throw error;
    }
  };
};

export const apiErrorHandler = (handler) => {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (e) {
      const error = normalizeError(e);
      console.error(`[API ERROR] ${error.code}:`, error.toJSON());

      return new Response(
        JSON.stringify(error.toJSON()),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
};

export function normalizeError(error) {
  if (error instanceof AppError || error.toJSON) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new AppError('Invalid request format', 'BAD_REQUEST', HTTP.BAD_REQUEST, { originalMessage: error.message });
  }

  if (error instanceof TypeError) {
    return new AppError('Invalid operation', 'TYPE_ERROR', HTTP.BAD_REQUEST, { originalMessage: error.message });
  }

  if (error.message?.includes('database is locked')) {
    return DatabaseError('operation', error, { retry: true });
  }

  if (error.message?.includes('UNIQUE constraint failed')) {
    const field = error.message.match(/UNIQUE constraint failed: (.+)/)?.[1] || 'record';
    return ConflictError(field, { constraint: error.message });
  }

  return new AppError(error.message || ERROR_MESSAGES.operationFailed('unknown operation'), 'INTERNAL_ERROR', HTTP.INTERNAL_ERROR, {
    originalMessage: error.message,
    stack: error.stack?.split('\n').slice(0, 3).join('\n'),
  });
}

export function formatErrorResponse(error, includeStack = false) {
  const normalized = normalizeError(error);
  const response = normalized.toJSON();

  if (includeStack && error.stack) {
    response.stack = error.stack.split('\n').slice(0, 5);
  }

  return response;
}

export const createErrorLogger = (context = '') => {
  return {
    error: (message, details = {}) => {
      console.error(`[${context}] Error:`, message, details);
    },
    warn: (message, details = {}) => {
      console.warn(`[${context}] Warning:`, message, details);
    },
    info: (message, details = {}) => {
      console.log(`[${context}] Info:`, message, details);
    },
    debug: (message, details = {}) => {
      if (process.env.DEBUG) {
        console.debug(`[${context}] Debug:`, message, details);
      }
    },
  };
};
