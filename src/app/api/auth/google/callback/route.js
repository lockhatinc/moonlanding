import { google, createSession } from '@/engine.server';
import { getBy, create } from '@/engine';
import { Google } from 'arctic';
import { GOOGLE_APIS } from '@/config/constants';
import { config } from '@/config';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { globalManager } from '@/lib/hot-reload/mutex';
import { NextResponse } from '@/lib/next-polyfills';
import {
  validateOAuthProvider,
  getOAuthCookie,
  deleteOAuthCookie,
  buildOAuthErrorResponse,
  validateOAuthState,
} from '@/lib/auth-route-helpers';

export async function GET(request) {
  // Build redirect URI from request to match what was used in authorization
  // Node.js http.IncomingMessage headers are lowercase object properties
  const protocol = request.headers['x-forwarded-proto'] || 'http';
  const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  console.log('[OAuth Callback] Processing with redirect URI:', {
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
    return buildOAuthErrorResponse(error, request);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const storedState = await getOAuthCookie('google_oauth_state');
  const storedCodeVerifier = await getOAuthCookie('google_code_verifier');

  const stateValidation = validateOAuthState(code, state, storedState, storedCodeVerifier);
  if (!stateValidation.valid) {
    return buildOAuthErrorResponse(stateValidation.error, request);
  }

  try {
    const tokens = await dynamicGoogle.validateAuthorizationCode(code, storedCodeVerifier);
    const accessToken = tokens.accessToken();

    const response = await fetch(GOOGLE_APIS.oauth2, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const googleUser = await response.json();

    const user = await globalManager.lock('oauth-user-create', async () => {
      let existing = getBy('user', 'email', googleUser.email);
      if (existing) return existing;

      const engine = await getConfigEngine();
      const roles = engine.getRoles();
      const defaultRole = Object.keys(roles)[0] || 'clerk';

      return create('user', {
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        type: 'auditor',
        role: defaultRole,
        status: 'active',
      });
    });

    const { session, sessionCookie } = await createSession(user.id);
    console.log('[OAuth Callback] Session created:', { userId: user.id, sessionId: session.id });

    await deleteOAuthCookie('google_oauth_state');
    await deleteOAuthCookie('google_code_verifier');

    // Create redirect response and explicitly set the session cookie on it
    const redirectUrl = new URL('/', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return buildOAuthErrorResponse('oauth_failed', request);
  }
}
