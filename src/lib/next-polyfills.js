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

export function revalidatePath(path, type = 'page') {
  // No-op in zero-build mode
}

export function revalidateTag(tag) {
  // No-op in zero-build mode
}
