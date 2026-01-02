import { createCrudHandlers } from '@/lib/crud-factory';

function wrapHandler(method) {
  return async (request, context) => {
    const params = await context.params;
    const pathArray = params.path || [];
    const entityName = params.entity;

    console.log(`[Route] ${method} ${entityName}`, {
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

    const handlers = createCrudHandlers(entityName);
    return handlers(request, enhancedContext);
  };
}

export const GET = wrapHandler('GET');
export const POST = wrapHandler('POST');
export const PUT = wrapHandler('PUT');
export const PATCH = wrapHandler('PATCH');
export const DELETE = wrapHandler('DELETE');
