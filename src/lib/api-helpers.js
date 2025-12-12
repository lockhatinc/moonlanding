// API Response Helpers - Consolidates common API patterns
import { NextResponse } from 'next/server';
import { getSpec } from '@/config';
import { migrate } from '@/engine';
import { getUser } from '@/engine.server';
import { can } from '@/lib/permissions';

let dbInit = false;
export function ensureDb() { if (!dbInit) { migrate(); dbInit = true; } }

// Standard responses
export const ok = (data) => NextResponse.json(data);
export const created = (data) => NextResponse.json(data, { status: 201 });
export const notFound = (msg = 'Not found') => NextResponse.json({ error: msg }, { status: 404 });
export const badRequest = (msg = 'Bad request') => NextResponse.json({ error: msg }, { status: 400 });
export const unauthorized = (msg = 'Unauthorized') => NextResponse.json({ error: msg }, { status: 403 });
export const serverError = (msg = 'Internal server error') => NextResponse.json({ error: msg }, { status: 500 });

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
    console.error(`API ${action} error:`, e);
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
