import { NextResponse } from 'next/server';
import { google, createSession } from '@/engine.server';
import { getBy, create } from '@/engine';
import { cookies } from 'next/headers';

export async function GET(request) {
  if (!google) {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value;
  const storedCodeVerifier = cookieStore.get('google_code_verifier')?.value;

  if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
    const accessToken = tokens.accessToken();

    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const googleUser = await response.json();

    let user = getBy('user', 'email', googleUser.email);

    if (!user) {
      user = create('user', {
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        type: 'auditor',
        role: 'clerk',
        status: 'active',
      });
    }

    await createSession(user.id);

    cookieStore.delete('google_oauth_state');
    cookieStore.delete('google_code_verifier');

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
