import { HTTP } from './api-constants';

export const HTTP_RESPONSES = {
  ok: (data) => ({ status: HTTP.OK, data }),
  created: (data) => ({ status: HTTP.CREATED, data }),
  badRequest: (error) => ({ status: HTTP.BAD_REQUEST, error }),
  unauthorized: (error = 'Unauthorized') => ({ status: HTTP.UNAUTHORIZED, error }),
  forbidden: (error = 'Permission denied') => ({ status: HTTP.FORBIDDEN, error }),
  notFound: (error = 'Not found') => ({ status: HTTP.NOT_FOUND, error }),
  conflict: (error) => ({ status: HTTP.CONFLICT, error }),
  serverError: (error) => ({ status: HTTP.INTERNAL_ERROR, error }),
};

export const RESPONSE_MAPPERS = {
  GET: (data) => ({ status: HTTP.OK, data }),
  POST: (data) => ({ status: HTTP.CREATED, data }),
  PUT: (data) => ({ status: HTTP.OK, data }),
  DELETE: () => ({ status: HTTP.OK, data: { success: true } }),
  LIST: (data) => ({ status: HTTP.OK, data }),
};
