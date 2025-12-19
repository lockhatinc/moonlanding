import { createUniversalHandler } from '@/lib/universal-handler';

function createMethodHandler(entityNameOrGetter) {
  return async function(request, context) {
    const entityName = typeof entityNameOrGetter === 'function'
      ? await entityNameOrGetter(context)
      : entityNameOrGetter;

    const params = context?.params
      ? await context.params
      : { entity: entityName };

    return createUniversalHandler(entityName)(request, { params });
  };
}

export function createHttpMethods(entityNameOrGetter) {
  return {
    GET: createMethodHandler(entityNameOrGetter),
    POST: createMethodHandler(entityNameOrGetter),
    PUT: createMethodHandler(entityNameOrGetter),
    PATCH: createMethodHandler(entityNameOrGetter),
    DELETE: createMethodHandler(entityNameOrGetter),
  };
}
