import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import { Google } from 'arctic';
import { cookies } from 'next/headers';
import db from './db';

const adapter = new BetterSqlite3Adapter(db, {
  user: 'users',
  session: 'sessions',
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    type: row.type,
    role: row.role,
  }),
});

// Only create Google OAuth if credentials are configured
export const google = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? new Google(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    )
  : null;

export async function getUser() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;
    if (!sessionId) return null;

    const { user, session } = await lucia.validateSession(sessionId);

    if (session?.fresh) {
      const cookie = lucia.createSessionCookie(session.id);
      cookieStore.set(cookie.name, cookie.value, cookie.attributes);
    }
    if (!session) {
      const cookie = lucia.createBlankSessionCookie();
      cookieStore.set(cookie.name, cookie.value, cookie.attributes);
    }

    return user;
  } catch (e) {
    console.error('getUser error:', e.message);
    return null;
  }
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export function can(user, spec, action) {
  if (!user) return false;
  if (!spec.access?.[action]) return true; // No access control = allow all
  return spec.access[action].includes(user.role);
}

export function check(user, spec, action) {
  if (!can(user, spec, action)) {
    throw new Error(`Permission denied: ${spec.name}.${action}`);
  }
}

export async function createSession(userId) {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  return session;
}

export async function invalidateSession() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;
    if (sessionId) {
      await lucia.invalidateSession(sessionId);
    }
    const blankCookie = lucia.createBlankSessionCookie();
    cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
  } catch (e) {
    console.error('invalidateSession error:', e.message);
  }
}

// Simple password hashing (for demo - use bcrypt in production)
export function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}
