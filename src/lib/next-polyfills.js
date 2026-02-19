export class NextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
    return this.body;
  }

  static json(body, init = {}) {
    return new NextResponse(body, init);
  }

  static redirect(url, status = 307) {
    return new NextResponse(null, {
      status,
      headers: { Location: url }
    });
  }
}

// Global request/response state set by server.js and route handlers
let currentRequest = null;
let currentResponse = null;

export function setCurrentRequest(req) {
  currentRequest = req;
}

export function setCurrentResponse(res) {
  currentResponse = res;
}

export async function cookies() {
  if (typeof window !== 'undefined') {
    throw new Error('cookies() should only be called on the server side');
  }

  // Parse cookies from request
  const cookieHeader = currentRequest?.headers?.cookie || '';
  const cookieMap = {};

  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(s => s.trim());
      if (name) cookieMap[name] = decodeURIComponent(value || '');
    });
  }

  return {
    get: (name) => {
      const value = cookieMap[name];
      return value ? { name, value } : undefined;
    },
    set: (name, value, options = {}) => {
      if (!currentResponse) return;

      let setCookieValue = `${name}=${encodeURIComponent(value)}`;
      if (options.path) setCookieValue += `; Path=${options.path}`;
      if (options.maxAge) setCookieValue += `; Max-Age=${options.maxAge}`;
      if (options.expires) setCookieValue += `; Expires=${options.expires}`;
      if (options.secure) setCookieValue += '; Secure';
      if (options.httpOnly) setCookieValue += '; HttpOnly';
      if (options.sameSite) setCookieValue += `; SameSite=${options.sameSite}`;

      const existing = currentResponse.getHeader('Set-Cookie') || [];
      const setCookies = Array.isArray(existing) ? existing : [existing];
      currentResponse.setHeader('Set-Cookie', [...setCookies, setCookieValue]);
    },
    delete: (name) => {
      if (!currentResponse) return;

      const setCookieValue = `${name}=; Path=/; Max-Age=0`;
      const existing = currentResponse.getHeader('Set-Cookie') || [];
      const setCookies = Array.isArray(existing) ? existing : [existing];
      currentResponse.setHeader('Set-Cookie', [...setCookies, setCookieValue]);
    },
    getAll: () => {
      return Object.entries(cookieMap).map(([name, value]) => ({ name, value }));
    },
    has: (name) => {
      return name in cookieMap;
    },
  };
}

export function headers() {
  return {
    get: (name) => null,
    getSetCookie: () => [],
    has: (name) => false,
    entries: () => [],
  };
}

export function revalidatePath(path, type = 'page') {
  // No-op in zero-build mode
}

export function revalidateTag(tag) {
  // No-op in zero-build mode
}

export function redirect(path, status = 302) {
  if (typeof window !== 'undefined') {
    window.location.href = path;
  } else {
    // Throw error with properties that page-renderer can recognize
    const error = new Error(`Redirect to ${path}`);
    error.type = 'redirect';
    error.location = path;
    error.status = status;
    throw error;
  }
}

export function notFound() {
  if (typeof window !== 'undefined') {
    window.location.href = '/404';
  } else {
    throw new Error('notFound()');
  }
}
