import { NextResponse } from '@/lib/next-polyfills';
import { invalidateSession } from '@/engine.server';
import { config } from '@/config/env';

export async function GET() {
  await invalidateSession();
  return NextResponse.redirect(new URL('/login', config.app.url));
}

export async function POST() {
  await invalidateSession();
  return NextResponse.json({ success: true });
}
