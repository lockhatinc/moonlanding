import { NextResponse } from 'next/server';
import { list, get, create, update, remove, search, getChildren } from '@/engine';
import { getUser } from '@/engine.server';
import { getSpec } from '@/config';
import { ok, created, notFound, badRequest, unauthorized, serverError, parseParams } from '@/lib/api-helpers';
import { broadcastUpdate } from '@/lib/realtime-server';
import { logger } from '@/lib/logger';

const withErrorHandling = async (handler, action, entity) => {
  try {
    return await handler();
  } catch (e) {
    logger.apiError(action, entity, e);
    console.error(`[${action.toUpperCase()}] ${entity}:`, e.message);
    return serverError(e.message || 'Internal server error');
  }
};

const withAuth = async (action, entity, handler) => {
  let spec;
  try {
    spec = getSpec(entity);
  } catch {
    return notFound('Unknown entity');
  }

  const user = await getUser();
  if (!user) return unauthorized('Not authenticated');

  const { can } = await import('@/lib/permissions');
  if (!can(user, spec, action)) return unauthorized('Permission denied');

  return await handler(spec, user);
};

export const createCrudHandlers = (options = {}) => ({
  GET: async (request, { params }) => {
    return withErrorHandling(async () => {
      const { entity, id, childKey } = await parseParams(params);

      return withAuth('list', entity, async (spec, user) => {
        const q = new URL(request.url).searchParams.get('q');

        if (id && !childKey) {
          const record = get(entity, id);
          return record ? ok(record) : notFound();
        }

        if (id && childKey) {
          const childDef = spec.children?.[childKey];
          if (!childDef) return notFound('Unknown child');
          return ok(getChildren(entity, id, childDef));
        }

        const results = q ? search(entity, q) : list(entity);
        return ok(results);
      });
    }, 'GET', 'unknown');
  },

  POST: async (request, { params }) => {
    return withErrorHandling(async () => {
      const { entity } = await parseParams(params);

      return withAuth('create', entity, async (spec, user) => {
        const data = await request.json();
        const result = create(entity, data, user);
        broadcastUpdate(`/api/${entity}`, 'create', result);
        return created(result);
      });
    }, 'POST', 'unknown');
  },

  PUT: async (request, { params }) => {
    return withErrorHandling(async () => {
      const { entity, id } = await parseParams(params);
      if (!id) return badRequest('ID required');

      return withAuth('edit', entity, async (spec, user) => {
        const prev = get(entity, id);
        if (!prev) return notFound();

        const data = await request.json();

        if (options.onBeforeUpdate) {
          const result = await options.onBeforeUpdate(entity, prev, data, user);
          if (result !== null) return result;
        }

        update(entity, id, data, user);
        const result = get(entity, id);
        broadcastUpdate(`/api/${entity}/${id}`, 'update', result);
        broadcastUpdate(`/api/${entity}`, 'update', result);

        if (options.onAfterUpdate) {
          await options.onAfterUpdate(entity, result, user);
        }

        return ok(result);
      });
    }, 'PUT', entity);
  },

  DELETE: async (request, { params }) => {
    return withErrorHandling(async () => {
      const { entity, id } = await parseParams(params);
      if (!id) return badRequest('ID required');

      return withAuth('delete', entity, async (spec, user) => {
        const record = get(entity, id);
        if (!record) return notFound();

        if (options.onBeforeDelete) {
          const result = await options.onBeforeDelete(entity, record, user);
          if (result !== null) return result;
        }

        remove(entity, id);
        broadcastUpdate(`/api/${entity}/${id}`, 'delete', { id });
        broadcastUpdate(`/api/${entity}`, 'delete', { id });

        if (options.onAfterDelete) {
          await options.onAfterDelete(entity, record, user);
        }

        return ok({ success: true });
      });
    }, 'DELETE', entity);
  },

  PATCH: async (request, { params }) => {
    return (await createCrudHandlers(options)).PUT(request, { params });
  },
});

export const createAuthRoute = (handler) => {
  return async (...args) => {
    try {
      const user = await getUser();
      if (!user) return unauthorized('Not authenticated');
      return await handler(user, ...args);
    } catch (e) {
      logger.apiError('auth', 'auth', e);
      return serverError(e.message);
    }
  };
};

export const createPublicRoute = (handler) => {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (e) {
      logger.apiError('public', 'public', e);
      return serverError(e.message);
    }
  };
};
