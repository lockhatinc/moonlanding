import { NextResponse } from 'next/server';
import { google } from '@/engine.server';
import { generateState, generateCodeVerifier } from 'arctic';
import { validateOAuthProvider, setOAuthCookie, buildOAuthErrorResponse } from '@/lib/auth-route-helpers';

export async function GET() {
  const { valid, error } = validateOAuthProvider(google);
  if (!valid) {
    return buildOAuthErrorResponse(error);
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ['profile', 'email'],
  });

  await setOAuthCookie('google_oauth_state', state);
  await setOAuthCookie('google_code_verifier', codeVerifier);

  return NextResponse.redirect(url);
}
