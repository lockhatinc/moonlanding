import { createCrudHandlers } from '@/lib/crud-factory';
import { setCurrentRequest } from '@/engine.server';

function wrapHandler(method) {
  return async (request, context) => {
    setCurrentRequest(request);
    const params = await context.params;
    const pathArray = params.path || [];

    const enhancedContext = {
      ...context,
      params: {
        entity: 'review_template',
        id: pathArray[0] || null,
        childKey: pathArray[1] || null,
      },
    };

    const url = new URL(request.url);
    url.searchParams.set('domain', 'mwr');
    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined
    });

    const handlers = createCrudHandlers('review_template');
    return handlers(modifiedRequest, enhancedContext);
  };
}

export const GET = wrapHandler('GET');
export const POST = wrapHandler('POST');
export const PUT = wrapHandler('PUT');
export const PATCH = wrapHandler('PATCH');
export const DELETE = wrapHandler('DELETE');
