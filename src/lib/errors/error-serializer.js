import { isAppError, normalizeError } from './error-types';

export function serializeError(error, includeStack = false) {
  const normalized = isAppError(error) ? error : normalizeError(error);

  const serialized = {
    message: normalized.message,
    code: normalized.code,
    statusCode: normalized.statusCode,
    timestamp: normalized.timestamp || new Date().toISOString(),
  };

  if (normalized.errors) {
    serialized.errors = normalized.errors;
  }

  if (normalized.details) {
    serialized.details = normalized.details;
  }

  if (normalized.resource) {
    serialized.resource = normalized.resource;
  }

  if (normalized.field) {
    serialized.field = normalized.field;
  }

  if (normalized.retryAfter) {
    serialized.retryAfter = normalized.retryAfter;
  }

  if (includeStack && error.stack) {
    serialized.stack = error.stack;
  }

  return serialized;
}

export function createErrorResponse(error, includeStack = false) {
  const normalized = isAppError(error) ? error : normalizeError(error);
  const serialized = serializeError(normalized, includeStack);

  const headers = {
    'Content-Type': 'application/json',
  };

  if (normalized.retryAfter) {
    headers['Retry-After'] = String(normalized.retryAfter);
  }

  return new Response(
    JSON.stringify({
      status: 'error',
      ...serialized,
    }),
    {
      status: normalized.statusCode,
      headers,
    }
  );
}

export function stripSensitiveInfo(error) {
  const serialized = serializeError(error, false);

  if (process.env.NODE_ENV === 'production') {
    if (serialized.statusCode >= 500) {
      serialized.message = 'An error occurred. Please try again later.';
      delete serialized.details;
      delete serialized.stack;
    }
  }

  return serialized;
}
