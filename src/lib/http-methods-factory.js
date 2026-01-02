import { createUniversalHandler } from '@/lib/universal-handler';

function createMethodHandler(entityNameOrGetter) {
  return async function(request, context) {
    const entityName = typeof entityNameOrGetter === 'function'
      ? await entityNameOrGetter(context)
      : entityNameOrGetter;

    const handler = createUniversalHandler(entityName);
    return await handler(request, context);
  };
}

export function createHttpMethods(entityNameOrGetter) {
  const handler = createMethodHandler(entityNameOrGetter);
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
  };
}
