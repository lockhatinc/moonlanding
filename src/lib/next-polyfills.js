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

export async function cookies() {
  if (typeof window !== 'undefined') {
    throw new Error('cookies() should only be called on the server side');
  }
  return {
    get: (name) => ({ name, value: '' }),
    set: (name, value, options) => {},
    delete: (name) => {},
    getAll: () => [],
    has: (name) => false,
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

// Frontend polyfills for Next.js navigation
export function redirect(path) {
  if (typeof window !== 'undefined') {
    window.location.href = path;
  } else {
    throw new Error('redirect() called on server without proper handling');
  }
}

export function notFound() {
  if (typeof window !== 'undefined') {
    window.location.href = '/404';
  } else {
    throw new Error('notFound()');
  }
}

export function useRouter() {
  if (typeof window === 'undefined') {
    throw new Error('useRouter() cannot be called on server');
  }

  return {
    push: (path) => window.location.href = path,
    replace: (path) => window.location.replace(path),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
    prefetch: (path) => {}, // No-op
  };
}

export function usePathname() {
  if (typeof window === 'undefined') {
    throw new Error('usePathname() cannot be called on server');
  }
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

export function useSearchParams() {
  if (typeof window === 'undefined') {
    throw new Error('useSearchParams() cannot be called on server');
  }

  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

  return {
    get: (name) => searchParams.get(name),
    getAll: (name) => searchParams.getAll(name),
    has: (name) => searchParams.has(name),
    entries: () => searchParams.entries(),
    keys: () => searchParams.keys(),
    values: () => searchParams.values(),
    forEach: (callback) => searchParams.forEach(callback),
    toString: () => searchParams.toString(),
  };
}

export function Link({ href, children, ...props }) {
  // Simple client-side link component
  return {
    _type: 'Link',
    href,
    children,
    props,
    onClick: (e) => {
      e.preventDefault();
      if (typeof window !== 'undefined') {
        window.location.href = href;
      }
    }
  };
}

export function dynamic(fn, options = {}) {
  // Return a lazy-loaded component wrapper
  return async () => {
    try {
      const module = await fn();
      return module.default || module;
    } catch (err) {
      console.error('[Dynamic Import Error]', err);
      // Return error component
      return () => null;
    }
  };
}

export const useFormStatus = () => {
  // Mock form status hook
  return {
    pending: false,
    data: null,
    method: null,
    action: null,
  };
};
