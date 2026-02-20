import { google, createSession } from '@/engine.server';
import { getBy, create } from '@/engine';
import { GOOGLE_APIS } from '@/config/constants';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { globalManager } from '@/lib/hot-reload/mutex';
import {
  validateOAuthProvider,
  getOAuthCookie,
  deleteOAuthCookie,
  buildOAuthErrorResponse,
  buildOAuthSuccessRedirect,
  validateOAuthState,
} from '@/lib/auth-route-helpers';

export async function GET(request) {
  const { valid, error } = validateOAuthProvider(google);
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
    // Build redirect URI from request to match what was used in authorization
    // Handle both Map-like headers (with .get()) and object-like headers
    const getHeader = (name) => {
      return (typeof request.headers?.get === 'function'
        ? request.headers.get(name)
        : request.headers?.[name]) || undefined;
    };

    const protocol = getHeader('x-forwarded-proto') || 'http';
    const host = getHeader('x-forwarded-host') || getHeader('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier, redirectUri);
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

    await createSession(user.id);

    await deleteOAuthCookie('google_oauth_state');
    await deleteOAuthCookie('google_code_verifier');

    return buildOAuthSuccessRedirect('/', request);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return buildOAuthErrorResponse('oauth_failed', request);
  }
}
