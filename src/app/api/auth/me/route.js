import { NextResponse } from 'next/server';
import { getUser } from '@/engine.server';
import { HTTP } from '@/config/api-constants';

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: HTTP.UNAUTHORIZED });
  }

  return NextResponse.json({ user });
}
