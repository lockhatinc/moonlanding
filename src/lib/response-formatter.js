import { HTTP } from '@/config/constants';

export const ok = (data, status = HTTP.OK) => new Response(
  JSON.stringify({ status: 'success', data }),
  { status, headers: { 'Content-Type': 'application/json' } }
);

export const created = (data, location = null) => {
  const response = ok(data, HTTP.CREATED);
  if (location) response.headers.set('Location', location);
  return response;
};

export const apiError = (error) => {
  const statusCode = error.statusCode || HTTP.INTERNAL_ERROR;
  const body = error.toJSON?.() || { status: 'error', message: error.message, code: 'ERROR' };
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
};

export const jsonResponse = (body, statusCode = HTTP.OK) => new Response(
  JSON.stringify(body),
  { status: statusCode, headers: { 'Content-Type': 'application/json' } }
);

export const paginated = (items, pagination, status = HTTP.OK) => {
  return ok({ items, pagination }, status);
};

export const bulkResult = (succeeded = [], failed = [], status = HTTP.OK) => {
  return ok({
    summary: {
      total: succeeded.length + failed.length,
      succeeded: succeeded.length,
      failed: failed.length
    },
    succeeded,
    failed
  }, status);
};

export const notFound = (message = 'Resource not found') => {
  return new Response(
    JSON.stringify({ status: 'error', message, code: 'NOT_FOUND' }),
    { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
  );
};

export const noContent = () => {
  return new Response(null, { status: HTTP.NO_CONTENT });
};
