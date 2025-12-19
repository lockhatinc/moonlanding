
import { NextResponse } from 'next/server';
import { getSpec } from '@/config';
import { migrate } from '@/engine';
import { getUser } from '@/engine.server';
import { can } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import { HTTP } from '@/config/api-constants';

let dbInit = false;
export function ensureDb() { if (!dbInit) { migrate(); dbInit = true; } }

const withMetadata = (data, status = HTTP.OK, type = 'success') => ({
  status,
  type,
  timestamp: new Date().toISOString(),
  data,
  ...(!data.error && { success: true }),
});

export const ok = (data) => NextResponse.json(withMetadata(data, HTTP.OK, 'success'));
export const created = (data) => NextResponse.json(withMetadata(data, HTTP.CREATED, 'created'), { status: HTTP.CREATED });
export const notFound = (msg = 'Not found') => NextResponse.json(withMetadata({ error: msg }, HTTP.NOT_FOUND, 'error'), { status: HTTP.NOT_FOUND });
export const badRequest = (msg = 'Bad request') => NextResponse.json(withMetadata({ error: msg }, HTTP.BAD_REQUEST, 'error'), { status: HTTP.BAD_REQUEST });
export const unauthorized = (msg = 'Unauthorized') => NextResponse.json(withMetadata({ error: msg }, HTTP.FORBIDDEN, 'error'), { status: HTTP.FORBIDDEN });
export const serverError = (msg = 'Internal server error') => NextResponse.json(withMetadata({ error: msg }, HTTP.INTERNAL_ERROR, 'error'), { status: HTTP.INTERNAL_ERROR });

export async function withEntityAccess(entity, action, handler) {
  ensureDb();
  try {
    let spec;
    try { spec = getSpec(entity); } catch { return notFound('Unknown entity'); }
    const user = await getUser();
    if (!can(user, spec, action)) return unauthorized();
    return await handler(spec, user);
  } catch (e) {
    logger.apiError(action, entity, e);
    return serverError(e.message || 'Internal server error');
  }
}

export async function parseParams(params) {
  const { entity, path = [] } = await params;
  const [id, childKey] = path;
  return { entity, id, childKey, path };
}
