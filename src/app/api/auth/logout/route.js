import { setCurrentRequest, invalidateSession } from '@/engine.server';
import { setCurrentResponse } from '@/lib/next-polyfills';
import { config } from '@/config/env';

export async function GET(request, { res } = {}) {
  setCurrentRequest(request);
  // Create a response-like object to capture Set-Cookie headers
  const headers = new Map();
  const mockRes = {
    getHeader: (name) => headers.get(name),
    setHeader: (name, value) => headers.set(name, value),
  };
  setCurrentResponse(mockRes);

  await invalidateSession();

  // Create redirect response with Set-Cookie header
  const response = new Response(null, { status: 307 });
  const setCookies = headers.get('Set-Cookie');
  if (setCookies) {
    const setCookieArray = Array.isArray(setCookies) ? setCookies : [setCookies];
    setCookieArray.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });
  }
  response.headers.set('Location', `/login`);

  return response;
}

export async function POST(request) {
  setCurrentRequest(request);
  // Create a response-like object to capture Set-Cookie headers
  const headers = new Map();
  const mockRes = {
    getHeader: (name) => headers.get(name),
    setHeader: (name, value) => headers.set(name, value),
  };
  setCurrentResponse(mockRes);

  await invalidateSession();

  // Create response with Set-Cookie header
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const setCookies = headers.get('Set-Cookie');
  if (setCookies) {
    const setCookieArray = Array.isArray(setCookies) ? setCookies : [setCookies];
    setCookieArray.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });
  }

  return response;
}
