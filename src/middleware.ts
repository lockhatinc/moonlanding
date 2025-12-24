import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

let _initialized = false;

export async function middleware(request: NextRequest) {
  if (!_initialized) {
    _initialized = true;
    try {
      const { initializeSystemConfig } = await import('@/config/system-config-loader');
      await initializeSystemConfig();
      console.log('[Middleware] System config initialized');
    } catch (error) {
      console.error('[Middleware] Failed to initialize system config:', (error as Error).message);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
