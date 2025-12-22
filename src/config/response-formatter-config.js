export const RESPONSE_FORMATS = {
  ok: {
    status: 200,
    template: (data = null, message = 'Success') => ({
      ok: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    }),
  },
  created: {
    status: 201,
    template: (data, message = 'Resource created') => ({
      ok: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    }),
  },
  accepted: {
    status: 202,
    template: (data, message = 'Request accepted') => ({
      ok: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    }),
  },
  badRequest: {
    status: 400,
    template: (message = 'Bad request', errors = null) => ({
      ok: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    }),
  },
  unauthorized: {
    status: 401,
    template: (message = 'Unauthorized') => ({
      ok: false,
      message,
      timestamp: new Date().toISOString(),
    }),
  },
  forbidden: {
    status: 403,
    template: (message = 'Forbidden') => ({
      ok: false,
      message,
      timestamp: new Date().toISOString(),
    }),
  },
  notFound: {
    status: 404,
    template: (message = 'Not found') => ({
      ok: false,
      message,
      timestamp: new Date().toISOString(),
    }),
  },
  conflict: {
    status: 409,
    template: (message = 'Conflict', data = null) => ({
      ok: false,
      message,
      data,
      timestamp: new Date().toISOString(),
    }),
  },
  serverError: {
    status: 500,
    template: (message = 'Internal server error', error = null) => ({
      ok: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { error }),
      timestamp: new Date().toISOString(),
    }),
  },
  paginated: {
    status: 200,
    template: (data, total, page, pageSize, message = 'Success') => ({
      ok: true,
      message,
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: new Date().toISOString(),
    }),
  },
};

export function formatResponse(type, ...args) {
  const format = RESPONSE_FORMATS[type];
  if (!format) throw new Error(`Unknown response format: ${type}`);
  return {
    status: format.status,
    body: format.template(...args),
  };
}
