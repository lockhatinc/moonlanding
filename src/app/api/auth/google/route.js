import { NextResponse } from '@/lib/next-polyfills';
import { google } from '@/engine.server';
import { Google } from 'arctic';
import { generateState, generateCodeVerifier } from 'arctic';
import { globalManager } from '@/lib/hot-reload/mutex';
import { config } from '@/config';
import { validateOAuthProvider, setOAuthCookie, buildOAuthErrorResponse } from '@/lib/auth-route-helpers';

export async function GET(request) {
  // Check for ?check=1 query param - used by login page to verify Google is configured
  const url = new URL(request.url);
  const isCheck = url.searchParams.get('check') === '1';

  if (isCheck) {
    const { valid } = validateOAuthProvider(google);
    return new Response(JSON.stringify({ configured: valid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build redirect URI from request to support reverse proxies (Traefik, etc.)
  // Node.js http.IncomingMessage headers are lowercase object properties
  const protocol = request.headers['x-forwarded-proto'] || 'http';
  const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  console.log('[OAuth] Redirect URI:', {
    'x-forwarded-proto': request.headers['x-forwarded-proto'],
    'x-forwarded-host': request.headers['x-forwarded-host'],
    'host': request.headers.host,
    'computed-redirectUri': redirectUri
  });

  // Create a dynamic Google client instance with the request-specific redirect URI
  const dynamicGoogle = new Google(
    config.auth.google.clientId,
    config.auth.google.clientSecret,
    redirectUri
  );

  const { valid, error } = validateOAuthProvider(dynamicGoogle);
  if (!valid) {
    return buildOAuthErrorResponse(error);
  }

  return globalManager.lock('oauth-state-init', async () => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = await dynamicGoogle.createAuthorizationURL(state, codeVerifier, {
      scopes: ['profile', 'email'],
    });

    await setOAuthCookie('google_oauth_state', state);
    await setOAuthCookie('google_code_verifier', codeVerifier);

    return NextResponse.redirect(url);
  });
}

export async function HEAD(request) {
  try {
    const { valid } = validateOAuthProvider(google);
    console.log('[OAuth HEAD] Google configured:', valid);
    return new Response(null, { status: valid ? 200 : 503 });
  } catch (error) {
    console.error('[OAuth HEAD] Error:', error);
    return new Response(null, { status: 500 });
  }
}
