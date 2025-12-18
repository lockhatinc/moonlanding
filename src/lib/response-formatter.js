import { HTTP } from '@/config/constants';

export const ok = (data, status = HTTP.OK) => new Response(
  JSON.stringify({ status: 'success', data }),
  { status, headers: { 'Content-Type': 'application/json' } }
);

export const created = (data) => ok(data, HTTP.CREATED);

export const apiError = (error) => {
  const statusCode = error.statusCode || HTTP.INTERNAL_ERROR;
  const body = error.toJSON?.() || { status: 'error', message: error.message, code: 'ERROR' };
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
};

export const jsonResponse = (body, statusCode = HTTP.OK) => new Response(
  JSON.stringify(body),
  { status: statusCode, headers: { 'Content-Type': 'application/json' } }
);
