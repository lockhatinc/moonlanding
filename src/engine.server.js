import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import { Google } from 'arctic';
import db from '@/engine';
import { config, hasGoogleAuth } from '@/config';
import { can, check } from '@/services/permission.service';
import { cookies } from '@/lib/next-polyfills';

const adapter = new BetterSqlite3Adapter(db, { user: 'users', session: 'sessions' });

export const lucia = new Lucia(adapter, {
  sessionCookie: { expires: config.auth.session.expires, attributes: { secure: config.auth.session.secure } },
  getUserAttributes: (row) => ({ id: row.id, email: row.email, name: row.name, avatar: row.avatar, type: row.type, role: row.role }),
});

console.log('[Engine] Lucia session cookie name:', lucia.sessionCookieName);

console.log('[Engine] Google Auth Config:', {
  hasGoogleAuth: hasGoogleAuth(),
  clientId: config.auth.google.clientId ? '***set***' : 'MISSING',
  clientSecret: config.auth.google.clientSecret ? '***set***' : 'MISSING',
  redirectUri: config.auth.google.redirectUri
});

export const google = hasGoogleAuth()
  ? new Google(config.auth.google.clientId, config.auth.google.clientSecret, config.auth.google.redirectUri)
  : null;

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) cookies[name] = decodeURIComponent(value);
  });
  return cookies;
}

let _currentRequest = null;
export function setCurrentRequest(req) { _currentRequest = req; }

export async function getUser() {
  try {
    const request = _currentRequest;
    if (!request) return null;
    const cookies = parseCookies(request.headers?.cookie || '');
    const sessionId = cookies[lucia.sessionCookieName];
    if (!sessionId) return null;
    const { user, session } = await lucia.validateSession(sessionId);
    if (!user || !session) return null;
    return user;
  } catch { return null; }
}

export async function requireUser() { const user = await getUser(); if (!user) throw new Error('Unauthorized'); return user; }

export async function createSession(userId) {
  const session = await lucia.createSession(userId, {}), sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies(); cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  return session;
}

export async function invalidateSession() {
  try {
    const cookieStore = await cookies(), sessionId = cookieStore.get(lucia.sessionCookieName)?.value;
    if (sessionId) await lucia.invalidateSession(sessionId);
    const blankCookie = lucia.createBlankSessionCookie(); cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
  } catch {}
}

export { can, check };
