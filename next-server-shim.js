// Shim for next/server in buildless environment

export class NextResponse extends Response {
  constructor(body, init = {}) {
    const status = init.status || 200;
    const headers = init.headers || {};

    let bodyContent = body;
    let contentType = headers['Content-Type'];

    if (typeof body === 'object' && body !== null) {
      bodyContent = JSON.stringify(body);
      contentType = contentType || 'application/json';
    }

    super(bodyContent, {
      status,
      headers: {
        ...headers,
        'Content-Type': contentType || 'text/plain'
      }
    });
  }

  static json(body, init = {}) {
    return new NextResponse(body, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers
      }
    });
  }
}

export async function NextRequest(request) {
  return request;
}
