import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { get } from '@/engine';

export async function POST(request) {
  try {
    if (!auth) {
      console.error('[MWR Bridge] Firebase not configured');
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
    }

    const { fridayIdToken } = await request.json();

    if (!fridayIdToken) {
      return NextResponse.json({ error: 'Missing Friday ID token' }, { status: 400 });
    }

    const decodedToken = await auth.verifyIdToken(fridayIdToken);
    const userId = decodedToken.uid;

    const user = get('user', userId);
    if (!user || user.status !== 'active') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    const customToken = await auth.createCustomToken(userId, {
      role: user.role,
      type: user.type,
      teams: user.teams || []
    });

    return NextResponse.json({ mwrToken: customToken, userId });
  } catch (error) {
    console.error('[MWR Bridge] Token validation error:', error.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
