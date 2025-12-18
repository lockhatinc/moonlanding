import { getSpec } from '@/config';
import { list, get, create, update, remove, listWithPagination, search, getChildren } from '@/lib/query-engine';
import { validateEntity, validateUpdate, hasErrors } from '@/lib/validate';
import { requireAuth, requirePermission } from '@/lib/auth-middleware';
import { broadcastUpdate } from '@/lib/realtime-server';
import { executeHook } from '@/lib/hook-registry';
import { AppError, NotFoundError, ValidationError, createErrorLogger } from '@/lib/error-handler';
import { ok, created, apiError } from '@/lib/response-formatter';

const logger = createErrorLogger('CRUD');

const parseUrl = (request) => {
  const { searchParams } = new URL(request.url);
  return {
    q: searchParams.get('q'),
    page: Math.max(1, parseInt(searchParams.get('page') || '1')),
    pageSize: parseInt(searchParams.get('pageSize') || '20'),
    action: searchParams.get('action')
  };
};

export const createCrudHandlers = (entityName) => {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`No spec: ${entityName}`);

  const handlers = {
    list: async (user, request) => {
      requirePermission(user, spec, 'list');
      const { q, page, pageSize } = parseUrl(request);
      if (q) return ok({ items: search(entityName, q) });
      const { items, pagination } = listWithPagination(entityName, {}, page, pageSize || spec.list?.pageSize || 20);
      return ok({ items, pagination });
    },

    get: async (user, id) => {
      requirePermission(user, spec, 'view');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
      const item = get(entityName, id);
      if (!item) throw new NotFoundError(entityName, id);
      return ok(item);
    },

    getChildren: async (user, id, childKey) => {
      requirePermission(user, spec, 'view');
      const childDef = spec.children?.[childKey];
      if (!childDef) throw new AppError('Unknown child', 'BAD_REQUEST', 400);
      return ok(getChildren(entityName, id, childDef));
    },

    create: async (user, data) => {
      requirePermission(user, spec, 'create');
      const errors = await validateEntity(spec, data);
      if (hasErrors?.(errors) || Object.keys(errors).length) throw new ValidationError('Validation failed', errors);
      const ctx = await executeHook(`create:${entityName}:before`, { entity: entityName, data, user });
      const result = create(ctx.entity || entityName, ctx.data || data, user);
      await executeHook(`create:${entityName}:after`, { entity: entityName, data: result, user });
      broadcastUpdate(`/api/${entityName}`, 'create', result);
      return created(result);
    },

    update: async (user, id, data) => {
      requirePermission(user, spec, 'edit');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
      const prev = get(entityName, id);
      if (!prev) throw new NotFoundError(entityName, id);
      const errors = await validateUpdate(spec, id, data);
      if (hasErrors?.(errors) || Object.keys(errors).length) throw new ValidationError('Validation failed', errors);
      const ctx = await executeHook(`update:${entityName}:before`, { entity: entityName, id, data, user, prev });
      update(ctx.entity || entityName, ctx.id || id, ctx.data || data, user);
      const result = get(entityName, id);
      await executeHook(`update:${entityName}:after`, { entity: entityName, id, data: result, user });
      broadcastUpdate(`/api/${entityName}/${id}`, 'update', result);
      broadcastUpdate(`/api/${entityName}`, 'update', result);
      return ok(result);
    },

    delete: async (user, id) => {
      requirePermission(user, spec, 'delete');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
      const record = get(entityName, id);
      if (!record) throw new NotFoundError(entityName, id);
      const ctx = await executeHook(`delete:${entityName}:before`, { entity: entityName, id, record, user });
      if (spec.fields.status) update(entityName, ctx.id || id, { status: 'deleted' }, user);
      else remove(entityName, ctx.id || id);
      await executeHook(`delete:${entityName}:after`, { entity: entityName, id, record, user });
      broadcastUpdate(`/api/${entityName}/${id}`, 'delete', { id });
      broadcastUpdate(`/api/${entityName}`, 'delete', { id });
      return ok({ success: true });
    }
  };

  return async (request, context) => {
    try {
      const user = await requireAuth();
      const { id, childKey } = context.params || {};
      const { action } = parseUrl(request);
      const method = request.method;

      if (method === 'GET') {
        if (id && childKey) return await handlers.getChildren(user, id, childKey);
        if (id || action === 'view') return await handlers.get(user, id || context.params?.id);
        return await handlers.list(user, request);
      }
      if (method === 'POST') return await handlers.create(user, await request.json());
      if (method === 'PUT' || method === 'PATCH') return await handlers.update(user, id, await request.json());
      if (method === 'DELETE') return await handlers.delete(user, id);

      throw new AppError(`Unknown action`, 'BAD_REQUEST', 400);
    } catch (e) {
      logger.error(entityName, e);
      return apiError(e instanceof AppError ? e : new AppError(e.message, 'INTERNAL_ERROR', 500));
    }
  };
};
