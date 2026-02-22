import { NextResponse } from '@/lib/next-polyfills';
import { SESSION } from '@/config/auth-config';
import { HTTP } from '@/config/constants';

// OAuth state storage - in-memory cache
// State parameter itself contains the key, so it survives the Google redirect
const oauthStateStore = new Map();

// Cleanup expired OAuth states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of oauthStateStore) {
    if (data.expiresAt < now) {
      oauthStateStore.delete(key);
      console.log('[OAuth] Cleaned up expired state:', key.substring(0, 20));
    }
  }
}, 5 * 60 * 1000);

export function validateOAuthProvider(provider) {
  if (!provider) {
    return {
      valid: false,
      error: 'OAuth not configured',
    };
  }
  return { valid: true };
}

export async function setOAuthCookie(name, value, options = {}) {
  // Store OAuth state in memory, return the key as the "cookie" value
  // The key will be sent to Google and returned unchanged, solving the cookie persistence issue
  const timestamp = Date.now();
  const key = `oauth-${timestamp}-${Math.random().toString(36).substring(7)}`;
  const expiresAt = timestamp + (SESSION.cookieMaxAge * 1000);

  oauthStateStore.set(key, {
    value,
    expiresAt,
    createdAt: timestamp,
  });

  console.log('[OAuth] Stored state in memory:', { key: key.substring(0, 20), expiresIn: SESSION.cookieMaxAge });

  // Return the key - this will be used as part of the state variable sent to Google
  // Google returns it unchanged, allowing us to retrieve the state on callback
  return key;
}

export async function getOAuthCookie(name) {
  // name parameter is actually the key that was sent to Google and returned
  const key = name;

  const data = oauthStateStore.get(key);

  if (!data) {
    console.log('[OAuth] State not found in memory:', key?.substring(0, 20));
    return null;
  }

  if (data.expiresAt < Date.now()) {
    console.log('[OAuth] State expired:', key.substring(0, 20));
    oauthStateStore.delete(key);
    return null;
  }

  console.log('[OAuth] Retrieved state from memory:', key.substring(0, 20));
  return data.value;
}

export async function deleteOAuthCookie(name) {
  // name parameter is the key
  const key = name;
  if (key) {
    oauthStateStore.delete(key);
    console.log('[OAuth] Deleted state from memory:', key.substring(0, 20));
  }
}

export function buildOAuthErrorResponse(message, request) {
  if (request) {
    return NextResponse.redirect(new URL(`/login?error=${message}`, request.url));
  }
  return NextResponse.json({ error: message }, { status: HTTP.INTERNAL_ERROR });
}

export function buildOAuthSuccessRedirect(path, request) {
  return NextResponse.redirect(new URL(path, request.url));
}

export function validateOAuthState(code, state, storedState, storedCodeVerifier) {
  if (!code || !state) {
    return { valid: false, error: 'invalid_state' };
  }
  // With server-side state storage, storedState and storedCodeVerifier are retrieved from memory
  // If they exist, the stateKey was valid and found in memory
  if (!storedState || !storedCodeVerifier) {
    return { valid: false, error: 'state_not_found' };
  }
  return { valid: true };
}
