import { NextResponse } from '@/lib/next-polyfills';
import { getUser, setCurrentRequest } from '@/engine.server';
import { HTTP } from '@/config/constants';

export async function GET(request) {
  setCurrentRequest(request);
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: HTTP.UNAUTHORIZED });
  }

  return NextResponse.json({ user });
}
