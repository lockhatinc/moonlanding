import { NextResponse } from '@/lib/next-polyfills';
import { invalidateSession, setCurrentRequest } from '@/engine.server';
import { config } from '@/config/env';

export async function GET(request) {
  setCurrentRequest(request);
  await invalidateSession();
  return NextResponse.redirect(new URL('/login', config.app.url));
}

export async function POST(request) {
  setCurrentRequest(request);
  await invalidateSession();
  return NextResponse.json({ success: true });
}
