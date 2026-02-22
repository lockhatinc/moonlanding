import { NextResponse, cookies } from '@/lib/next-polyfills';
import { SESSION } from '@/config/auth-config';
import { HTTP } from '@/config/constants';
import { globalManager } from '@/lib/hot-reload/mutex';

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
  return globalManager.lock('oauth-cookie', async () => {
    const cookieStore = await cookies();
    cookieStore.set(name, value, {
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: SESSION.cookieMaxAge,
      sameSite: 'lax',
      ...options,
    });
  });
}

export async function getOAuthCookie(name) {
  return globalManager.lock('oauth-cookie', async () => {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  });
}

export async function deleteOAuthCookie(name) {
  return globalManager.lock('oauth-cookie', async () => {
    const cookieStore = await cookies();
    cookieStore.delete(name);
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
