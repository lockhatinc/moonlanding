import { cookies } from 'next/headers';
import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import { Google } from 'arctic';
import db from './engine';
import { config, hasGoogleAuth } from './config';
import { can, check } from './lib/permissions';

const adapter = new BetterSqlite3Adapter(db, { user: 'users', session: 'sessions' });

export const lucia = new Lucia(adapter, {
  sessionCookie: { expires: config.auth.session.expires, attributes: { secure: config.auth.session.secure } },
  getUserAttributes: (row) => ({ id: row.id, email: row.email, name: row.name, avatar: row.avatar, type: row.type, role: row.role }),
});

export const google = hasGoogleAuth
  ? new Google(config.auth.google.clientId, config.auth.google.clientSecret, config.auth.google.redirectUri)
  : null;

export async function getUser() {
  try {
    const cookieStore = await cookies(), sessionId = cookieStore.get(lucia.sessionCookieName)?.value;
    if (!sessionId) return null;
    const { user, session } = await lucia.validateSession(sessionId);
    if (session?.fresh) { const cookie = lucia.createSessionCookie(session.id); cookieStore.set(cookie.name, cookie.value, cookie.attributes); }
    if (!session) { const cookie = lucia.createBlankSessionCookie(); cookieStore.set(cookie.name, cookie.value, cookie.attributes); }
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
