// API Response Helpers - Consolidates common API patterns
import { NextResponse } from 'next/server';
import { getSpec } from '@/config';
import { migrate } from '@/engine';
import { getUser } from '@/engine.server';
import { can } from '@/lib/permissions';
import { logger } from '@/lib/logger';

let dbInit = false;
export function ensureDb() { if (!dbInit) { migrate(); dbInit = true; } }

// Standard responses with metadata
const withMetadata = (data, status = 200, type = 'success') => ({
  status,
  type,
  timestamp: new Date().toISOString(),
  data,
  ...(!data.error && { success: true }),
});

export const ok = (data) => NextResponse.json(withMetadata(data, 200, 'success'));
export const created = (data) => NextResponse.json(withMetadata(data, 201, 'created'), { status: 201 });
export const notFound = (msg = 'Not found') => NextResponse.json(withMetadata({ error: msg }, 404, 'error'), { status: 404 });
export const badRequest = (msg = 'Bad request') => NextResponse.json(withMetadata({ error: msg }, 400, 'error'), { status: 400 });
export const unauthorized = (msg = 'Unauthorized') => NextResponse.json(withMetadata({ error: msg }, 403, 'error'), { status: 403 });
export const serverError = (msg = 'Internal server error') => NextResponse.json(withMetadata({ error: msg }, 500, 'error'), { status: 500 });

/**
 * Wrap API handler with common checks
 * @param {string} entity - Entity name (from params)
 * @param {string} action - Required permission
 * @param {Function} handler - async (spec, user, request) => Response
 */
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

/**
 * Parse entity and path from dynamic route params
 */
export async function parseParams(params) {
  const { entity, path = [] } = await params;
  const [id, childKey] = path;
  return { entity, id, childKey, path };
}
