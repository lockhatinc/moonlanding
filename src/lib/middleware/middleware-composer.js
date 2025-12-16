import { authRequired } from './auth-middleware';
import { createEntityPermissionMiddleware } from './permission-middleware';
import { validateInput, validateUpdate } from './validation-middleware';
import { withErrorHandling, createErrorResponse } from './error-handler-middleware';
import { getSpec } from '@/config';

export async function chainMiddleware(...middlewares) {
  return async (context) => {
    let result = context;
    for (const middleware of middlewares) {
      result = await middleware(result);
    }
    return result;
  };
}

export function composeApiHandler(middlewares, handler) {
  return withErrorHandling(async (...args) => {
    let context = { args };

    for (const middleware of middlewares) {
      context = await middleware(context);
    }

    return await handler(context);
  });
}

export async function createApiHandler(entityName, action, handler, options = {}) {
  const spec = getSpec(entityName);
  if (!spec) {
    throw new Error(`Unknown entity: ${entityName}`);
  }

  const middlewares = [];

  if (options.requireAuth !== false) {
    middlewares.push(async (context) => {
      context.user = await authRequired();
      return context;
    });
  }

  if (options.requirePermission !== false) {
    middlewares.push(async (context) => {
      const spec = getSpec(entityName);
      const checkPermission = createEntityPermissionMiddleware(entityName, action);
      context.spec = await checkPermission(context.user);
      return context;
    });
  }

  if (options.validateInput && action === 'create') {
    middlewares.push(async (context) => {
      const result = await validateInput(spec, context.data, true);
      context.validationResult = result;
      return context;
    });
  }

  if (options.validateUpdate && action === 'update') {
    middlewares.push(async (context) => {
      const result = await validateUpdate(spec, context.id, context.data, true);
      context.validationResult = result;
      return context;
    });
  }

  return composeApiHandler(middlewares, handler);
}

export function withAuth(handler) {
  return withErrorHandling(async (req, context) => {
    const user = await authRequired();
    return handler(req, { ...context, user });
  });
}

export function withPermission(entityName, action, handler) {
  return withErrorHandling(async (req, context) => {
    const spec = await createEntityPermissionMiddleware(entityName, action)(context.user);
    return handler(req, { ...context, spec });
  });
}

export function withValidation(spec, handler, updateMode = false) {
  return withErrorHandling(async (req, context) => {
    const data = context.data || context.body;

    if (updateMode) {
      const result = await validateUpdate(spec, context.id, data, true);
      context.validationResult = result;
    } else {
      const result = await validateInput(spec, data, true);
      context.validationResult = result;
    }

    return handler(req, context);
  });
}
