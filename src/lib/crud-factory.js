import { getSpec, API_ENDPOINTS } from '@/config';
import { list, get, create, update, remove, listWithPagination, search, getChildren } from '@/lib/query-engine';
import { validateEntity, validateUpdate, hasErrors } from '@/lib/validate';
import { requireAuth, requirePermission } from '@/lib/auth-middleware';
import { broadcastUpdate } from '@/lib/realtime-server';
import { executeHook } from '@/lib/hook-engine';
import { AppError, NotFoundError, ValidationError } from '@/lib/error-handler';
import { ok, created, paginated } from '@/lib/response-formatter';
import { HTTP } from '@/config/api-constants';
import { permissionService } from '@/services';
import { parse as parseQuery } from '@/lib/query-string-adapter';
import { withErrorHandler } from '@/lib/with-error-handler';

export const createCrudHandlers = (entityName) => {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`No spec: ${entityName}`);

  const handlers = {
    list: async (user, request) => {
      requirePermission(user, spec, 'list');
      const { q, page, pageSize } = parseQuery(request);
      if (q) {
        const results = search(entityName, q);
        const filtered = permissionService.filterRecords(user, spec, results);
        return ok({ items: filtered.map(item => permissionService.filterFields(user, spec, item)) });
      }
      const { items, pagination } = listWithPagination(entityName, {}, page, pageSize);
      const filtered = permissionService.filterRecords(user, spec, items);
      return paginated(filtered.map(item => permissionService.filterFields(user, spec, item)), pagination);
    },

    get: async (user, id) => {
      requirePermission(user, spec, 'view');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const item = get(entityName, id);
      if (!item) throw NotFoundError(entityName, id);
      if (!permissionService.checkRowAccess(user, spec, item)) throw new AppError('Access denied', 'FORBIDDEN', HTTP.FORBIDDEN);
      return ok(permissionService.filterFields(user, spec, item));
    },

    getChildren: async (user, id, childKey) => {
      requirePermission(user, spec, 'view');
      const childDef = spec.children?.[childKey];
      if (!childDef) throw new AppError('Unknown child', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      return ok(getChildren(entityName, id, childDef));
    },

    create: async (user, data) => {
      requirePermission(user, spec, 'create');
      permissionService.enforceEditPermissions(user, spec, data);
      const errors = await validateEntity(spec, data);
      if (hasErrors?.(errors) || Object.keys(errors).length) throw ValidationError('Validation failed', errors);
      const ctx = await executeHook(`create:${entityName}:before`, { entity: entityName, data, user });
      const result = create(ctx.entity || entityName, ctx.data || data, user);
      await executeHook(`create:${entityName}:after`, { entity: entityName, data: result, user });
      broadcastUpdate(API_ENDPOINTS.entity(entityName), 'create', permissionService.filterFields(user, spec, result));
      return created(permissionService.filterFields(user, spec, result));
    },

    update: async (user, id, data) => {
      requirePermission(user, spec, 'edit');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const prev = get(entityName, id);
      if (!prev) throw NotFoundError(entityName, id);
      if (!permissionService.checkRowAccess(user, spec, prev)) throw new AppError('Access denied', 'FORBIDDEN', HTTP.FORBIDDEN);
      permissionService.enforceEditPermissions(user, spec, data);
      const errors = await validateUpdate(spec, id, data);
      if (hasErrors?.(errors) || Object.keys(errors).length) throw ValidationError('Validation failed', errors);
      const ctx = await executeHook(`update:${entityName}:before`, { entity: entityName, id, data, user, prev });
      update(ctx.entity || entityName, ctx.id || id, ctx.data || data, user);
      const result = get(entityName, id);
      await executeHook(`update:${entityName}:after`, { entity: entityName, id, data: result, user });
      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'update', permissionService.filterFields(user, spec, result));
      broadcastUpdate(API_ENDPOINTS.entity(entityName), 'update', permissionService.filterFields(user, spec, result));
      return ok(permissionService.filterFields(user, spec, result));
    },

    delete: async (user, id) => {
      requirePermission(user, spec, 'delete');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const record = get(entityName, id);
      if (!record) throw NotFoundError(entityName, id);
      if (!permissionService.checkRowAccess(user, spec, record)) throw new AppError('Access denied', 'FORBIDDEN', HTTP.FORBIDDEN);
      const ctx = await executeHook(`delete:${entityName}:before`, { entity: entityName, id, record, user });
      if (spec.fields.status) update(entityName, ctx.id || id, { status: 'deleted' }, user);
      else remove(entityName, ctx.id || id);
      await executeHook(`delete:${entityName}:after`, { entity: entityName, id, record, user });
      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'delete', { id });
      broadcastUpdate(API_ENDPOINTS.entity(entityName), 'delete', { id });
      return ok({ success: true });
    }
  };

  return withErrorHandler(async (request, context) => {
    const user = await requireAuth();
    const { id, childKey } = context.params || {};
    const { action } = parseQuery(request);
    const method = request.method;

    if (method === 'GET') {
      if (id && childKey) return await handlers.getChildren(user, id, childKey);
      if (id || action === 'view') return await handlers.get(user, id || context.params?.id);
      return await handlers.list(user, request);
    }
    if (method === 'POST') return await handlers.create(user, await request.json());
    if (method === 'PUT' || method === 'PATCH') return await handlers.update(user, id, await request.json());
    if (method === 'DELETE') return await handlers.delete(user, id);

    throw new AppError(`Unknown action`, 'BAD_REQUEST', HTTP.BAD_REQUEST);
  }, `CRUD:${entityName}`);
};
