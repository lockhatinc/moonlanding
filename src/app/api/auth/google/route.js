import { NextResponse } from '@/lib/next-polyfills';
import { google } from '@/engine.server';
import { generateState, generateCodeVerifier } from 'arctic';
import { globalManager } from '@/lib/hot-reload/mutex';
import { validateOAuthProvider, setOAuthCookie, buildOAuthErrorResponse } from '@/lib/auth-route-helpers';

export async function GET(request) {
  const { valid, error } = validateOAuthProvider(google);
  if (!valid) {
    return buildOAuthErrorResponse(error);
  }

  return globalManager.lock('oauth-state-init', async () => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    // Build redirect URI from request to support reverse proxies (Traefik, etc.)
    // Handle both Map-like headers (with .get()) and object-like headers
    const getHeader = (name) => {
      return (typeof request.headers?.get === 'function'
        ? request.headers.get(name)
        : request.headers?.[name]) || undefined;
    };

    const protocol = getHeader('x-forwarded-proto') || 'http';
    const host = getHeader('x-forwarded-host') || getHeader('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const url = await google.createAuthorizationURL(state, codeVerifier, {
      scopes: ['profile', 'email'],
      redirectUri,
    });

    await setOAuthCookie('google_oauth_state', state);
    await setOAuthCookie('google_code_verifier', codeVerifier);

    return NextResponse.redirect(url);
  });
}
