import { NextResponse } from 'next/server';

export async function POST(request) {
  console.warn('[MWR Bridge] Firebase authentication is disabled');
  return NextResponse.json(
    { error: 'MWR Bridge authentication endpoint is disabled (Firebase not configured)' },
    { status: 503 }
  );
}
