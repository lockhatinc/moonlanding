import { NextResponse } from 'next/server';
import { invalidateSession } from '@/engine.server';

export async function GET() {
  await invalidateSession();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL || 'http:
}

export async function POST() {
  await invalidateSession();
  return NextResponse.json({ success: true });
}
