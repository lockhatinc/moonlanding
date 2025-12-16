export function ok(data, headers = {}) {
  return new Response(JSON.stringify({ status: 'success', data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function created(data, headers = {}) {
  return new Response(JSON.stringify({ status: 'success', data }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function badRequest(error, headers = {}) {
  return new Response(
    JSON.stringify({
      status: 'error',
      code: 'BAD_REQUEST',
      message: error,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}

export function unauthorized(error = 'Authentication required', headers = {}) {
  return new Response(
    JSON.stringify({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: error,
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}

export function forbidden(error = 'Permission denied', headers = {}) {
  return new Response(
    JSON.stringify({
      status: 'error',
      code: 'FORBIDDEN',
      message: error,
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}

export function notFound(error = 'Not found', headers = {}) {
  return new Response(
    JSON.stringify({
      status: 'error',
      code: 'NOT_FOUND',
      message: error,
    }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}

export function conflict(error, headers = {}) {
  return new Response(
    JSON.stringify({
      status: 'error',
      code: 'CONFLICT',
      message: error,
    }),
    {
      status: 409,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}

export function serverError(error = 'Internal server error', headers = {}) {
  return new Response(
    JSON.stringify({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: error,
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}

export function rateLimitError(retryAfter = 60, headers = {}) {
  return new Response(
    JSON.stringify({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter,
    }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter), ...headers },
    }
  );
}

export function validation(errors, headers = {}) {
  return new Response(
    JSON.stringify({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}
