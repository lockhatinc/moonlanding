import { NextResponse } from 'next/server';
import { invalidateSession } from '@/engine/auth';

export async function GET() {
  await invalidateSession();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'));
}

export async function POST() {
  await invalidateSession();
  return NextResponse.json({ success: true });
}
