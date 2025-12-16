export const HTTP_RESPONSES = {
  ok: (data) => ({ status: 200, data }),
  created: (data) => ({ status: 201, data }),
  badRequest: (error) => ({ status: 400, error }),
  unauthorized: (error = 'Unauthorized') => ({ status: 401, error }),
  forbidden: (error = 'Permission denied') => ({ status: 403, error }),
  notFound: (error = 'Not found') => ({ status: 404, error }),
  conflict: (error) => ({ status: 409, error }),
  serverError: (error) => ({ status: 500, error }),
};

export const RESPONSE_MAPPERS = {
  GET: (data) => ({ status: 200, data }),
  POST: (data) => ({ status: 201, data }),
  PUT: (data) => ({ status: 200, data }),
  DELETE: () => ({ status: 200, data: { success: true } }),
  LIST: (data) => ({ status: 200, data }),
};
