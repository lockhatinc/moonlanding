import { NextResponse } from '@/lib/next-polyfills';
import { google } from '@/engine.server';
import { generateState, generateCodeVerifier } from 'arctic';
import { globalManager } from '@/lib/hot-reload/mutex';
import { validateOAuthProvider, setOAuthCookie, buildOAuthErrorResponse } from '@/lib/auth-route-helpers';

export async function GET() {
  const { valid, error } = validateOAuthProvider(google);
  if (!valid) {
    return buildOAuthErrorResponse(error);
  }

  return globalManager.lock('oauth-state-init', async () => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = await google.createAuthorizationURL(state, codeVerifier, {
      scopes: ['profile', 'email'],
    });

    await setOAuthCookie('google_oauth_state', state);
    await setOAuthCookie('google_code_verifier', codeVerifier);

    return NextResponse.redirect(url);
  });
}
