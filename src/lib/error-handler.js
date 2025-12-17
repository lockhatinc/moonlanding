export class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, context = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
  }

  toJSON() {
    return {
      status: 'error',
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = {}, context = {}) {
    super(message, 'VALIDATION_ERROR', 400, { ...context, errors });
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(entity, id, context = {}) {
    super(
      `${entity} with id ${id} not found`,
      'NOT_FOUND',
      404,
      { ...context, entity, id }
    );
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends AppError {
  constructor(message = 'Permission denied', context = {}) {
    super(message, 'PERMISSION_DENIED', 403, context);
    this.name = 'PermissionError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', context = {}) {
    super(message, 'UNAUTHORIZED', 401, context);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', context = {}) {
    super(message, 'CONFLICT', 409, context);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError = null, context = {}) {
    super(message, 'DATABASE_ERROR', 500, { ...context, originalMessage: originalError?.message });
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class ExternalAPIError extends AppError {
  constructor(service, message, statusCode = 500, context = {}) {
    super(message, 'EXTERNAL_API_ERROR', statusCode, { ...context, service });
    this.name = 'ExternalAPIError';
  }
}

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
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new AppError('Invalid request format', 'BAD_REQUEST', 400, { originalMessage: error.message });
  }

  if (error instanceof TypeError) {
    return new AppError('Invalid operation', 'TYPE_ERROR', 400, { originalMessage: error.message });
  }

  if (error.message?.includes('database is locked')) {
    return new DatabaseError('Database is currently locked. Please try again.', error, { retry: true });
  }

  if (error.message?.includes('UNIQUE constraint failed')) {
    return new ConflictError('Duplicate entry detected', { constraint: error.message });
  }

  return new AppError(error.message || 'Unknown error', 'INTERNAL_ERROR', 500, {
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
