import { NextResponse } from 'next/server';
import { google } from '@/engine.server';
import { generateState, generateCodeVerifier } from 'arctic';
import { cookies } from 'next/headers';

export async function GET() {
  if (!google) {
    return NextResponse.json(
      { error: 'Google OAuth not configured' },
      { status: 500 }
    );
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ['profile', 'email'],
  });

  const cookieStore = await cookies();

  cookieStore.set('google_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  });

  cookieStore.set('google_code_verifier', codeVerifier, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  });

  return NextResponse.redirect(url);
}
