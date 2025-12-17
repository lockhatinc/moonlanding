export class AppError extends Error {
  constructor(message, code = 'ERROR', statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.errors = errors;
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT', 409);
  }
}

export class ServerError extends AppError {
  constructor(message = 'Server error', code = 'SERVER_ERROR') {
    super(message, code, 500);
  }
}
