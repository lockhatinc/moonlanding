export class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = null;
    this.timestamp = new Date().toISOString();
  }

  setDetails(details) {
    this.details = details;
    return this;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Permission denied', resource = null) {
    super(message, 'FORBIDDEN', 403);
    this.name = 'AuthorizationError';
    this.resource = resource;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', resource = null) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', field = null) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
    this.field = field;
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR') {
    super(message, code, 500);
    this.name = 'ServerError';
  }
}

export class DatabaseError extends ServerError {
  constructor(message = 'Database error', operation = null) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
    this.operation = operation;
  }
}

export class ExternalAPIError extends ServerError {
  constructor(message = 'External API error', service = null, statusCode = null) {
    super(message, 'EXTERNAL_API_ERROR');
    this.name = 'ExternalAPIError';
    this.service = service;
    this.externalStatusCode = statusCode;
  }
}

export function isAppError(error) {
  return error instanceof AppError;
}

export function normalizeError(error) {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new ValidationError('Invalid input format', { syntax: error.message });
  }

  if (error?.message?.includes('UNIQUE constraint failed')) {
    return new ConflictError('Duplicate entry');
  }

  if (error?.message?.includes('FOREIGN KEY constraint failed')) {
    return new ValidationError('Referenced record not found');
  }

  if (error?.message?.includes('database is locked')) {
    return new ServerError('Database temporarily unavailable', 'DATABASE_LOCKED');
  }

  return new ServerError(error?.message || 'Unknown error');
}
