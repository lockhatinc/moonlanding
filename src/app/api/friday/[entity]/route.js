import { createCrudHandlers } from '@/lib/crud-factory';
import { getDomainLoader } from '@/lib/domain-loader';
import { setCurrentRequest } from '@/engine.server';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

function wrapHandler(method) {
  return async (request, context) => {
    setCurrentRequest(request);
    const params = await context.params;
    const pathArray = params.path || [];
    const entityName = params.entity;
    const domain = 'friday';

    const domainLoader = getDomainLoader();
    if (!domainLoader.isEntityInDomain(entityName, domain)) {
      throw new AppError(
        `Entity ${entityName} not available in Friday domain`,
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    console.log(`[Route] Friday:${method} ${entityName}`, {
      pathArray,
      id: pathArray[0],
      childKey: pathArray[1],
    });

    const enhancedContext = {
      ...context,
      params: {
        entity: entityName,
        id: pathArray[0] || null,
        childKey: pathArray[1] || null,
      },
    };

    const modifiedRequest = new Request(request.url + `?domain=${domain}`, {
      method: request.method,
      headers: request.headers,
      body: method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined
    });

    const handlers = createCrudHandlers(entityName);
    return handlers(modifiedRequest, enhancedContext);
  };
}

export const GET = wrapHandler('GET');
export const POST = wrapHandler('POST');
export const PUT = wrapHandler('PUT');
export const PATCH = wrapHandler('PATCH');
export const DELETE = wrapHandler('DELETE');
