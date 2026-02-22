import { NextResponse, cookies } from '@/lib/next-polyfills';
import { SESSION } from '@/config/auth-config';
import { HTTP } from '@/config/constants';
import { globalManager } from '@/lib/hot-reload/mutex';

// OAuth state storage - in-memory cache more reliable than cookies through redirects
const oauthStateStore = new Map();

// Cleanup expired OAuth states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of oauthStateStore) {
    if (data.expiresAt < now) {
      oauthStateStore.delete(key);
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
  // Store OAuth state in memory instead of cookies (more reliable through redirects)
  const key = `${name}:${Date.now()}`;
  const expiresAt = Date.now() + (SESSION.cookieMaxAge * 1000);
  oauthStateStore.set(key, { value, expiresAt });

  // Also set a cookie with the key so we can retrieve it on callback
  return globalManager.lock('oauth-cookie', async () => {
    const cookieStore = await cookies();
    cookieStore.set('oauth_state_key', key, {
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: SESSION.cookieMaxAge,
      sameSite: 'lax',
    });
  });
}

export async function getOAuthCookie(name) {
  return globalManager.lock('oauth-cookie', async () => {
    const cookieStore = await cookies();
    const key = cookieStore.get('oauth_state_key')?.value;

    if (!key) {
      console.log('[OAuth] No oauth_state_key cookie found');
      return null;
    }

    const data = oauthStateStore.get(key);
    if (!data) {
      console.log('[OAuth] State not found in memory store:', key);
      return null;
    }

    if (data.expiresAt < Date.now()) {
      console.log('[OAuth] State expired:', key);
      oauthStateStore.delete(key);
      return null;
    }

    return data.value;
  });
}

export async function deleteOAuthCookie(name) {
  return globalManager.lock('oauth-cookie', async () => {
    const cookieStore = await cookies();
    const key = cookieStore.get('oauth_state_key')?.value;
    if (key) {
      oauthStateStore.delete(key);
    }
    cookieStore.delete('oauth_state_key');
  });
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
  if (!code || !state || !storedState || !storedCodeVerifier) {
    return { valid: false, error: 'invalid_state' };
  }
  if (state !== storedState) {
    return { valid: false, error: 'state_mismatch' };
  }
  return { valid: true };
}
