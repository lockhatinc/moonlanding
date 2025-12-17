import { getUser } from '@/engine.server';
import { getSpec } from '@/config';
import { can } from '@/lib/permissions';
import { list, get, create, update, remove, listWithPagination, search } from '@/lib/query-engine';
import { validateEntity, validateUpdate, hasErrors } from '@/lib/validate';
import { broadcastUpdate } from '@/lib/realtime-server';
import { UnauthorizedError, PermissionError, NotFoundError, ValidationError, AppError, createErrorLogger } from '@/lib/error-handler';

const logger = createErrorLogger('HANDLER');

const ok = (data, status = 200) => new Response(
  JSON.stringify({ status: 'success', data }),
  { status, headers: { 'Content-Type': 'application/json' } }
);

const apiError = (error) => {
  const statusCode = error.statusCode || 500;
  return new Response(
    JSON.stringify(error.toJSON?.() || { status: 'error', message: error.message, code: 'ERROR' }),
    { status: statusCode, headers: { 'Content-Type': 'application/json' } }
  );
};

const wrapError = (fn, context) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    if (error instanceof AppError) {
      logger.error(error.code, error.context);
      throw error;
    }
    logger.error('INTERNAL_ERROR', { context, message: error.message });
    throw new AppError(error.message, 'INTERNAL_ERROR', 500, { context });
  }
};

export function createUniversalHandler(entityName) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`No spec found for entity: ${entityName}`);

  const crudHandlers = {
    list: async (request, context) => {
      const user = await getUser();
      if (!user) throw new UnauthorizedError('Authentication required');
      if (!can(user, spec, 'list')) throw new PermissionError(`Cannot list ${entityName}`);

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const pageSize = parseInt(searchParams.get('pageSize') || String(spec.list?.pageSize || 20));
      const q = searchParams.get('q');

      if (q) {
        const items = search(entityName, q);
        return ok({ items });
      }
      const { items, pagination } = listWithPagination(entityName, {}, page, pageSize);
      return ok({ items, pagination });
    },

    get: async (request, context) => {
      const user = await getUser();
      if (!user) throw new UnauthorizedError('Authentication required');
      if (!can(user, spec, 'view')) throw new PermissionError(`Cannot view ${entityName}`);

      const { id } = context.params;
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
      const item = get(entityName, id);
      if (!item) throw new NotFoundError(entityName, id);
      return ok(item);
    },

    create: async (request, context) => {
      const user = await getUser();
      if (!user) throw new UnauthorizedError('Authentication required');
      if (!can(user, spec, 'create')) throw new PermissionError(`Cannot create ${entityName}`);

      const data = await request.json();
      const errors = await validateEntity(spec, data);
      if (hasErrors(errors)) throw new ValidationError('Validation failed', errors);

      const result = create(entityName, data, user);
      broadcastUpdate(`/api/${entityName}`, 'create', result);
      return ok(result, 201);
    },

    update: async (request, context) => {
      const user = await getUser();
      if (!user) throw new UnauthorizedError('Authentication required');
      if (!can(user, spec, 'edit')) throw new PermissionError(`Cannot edit ${entityName}`);

      const { id } = context.params;
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
      const prev = get(entityName, id);
      if (!prev) throw new NotFoundError(entityName, id);

      const data = await request.json();
      const errors = await validateUpdate(spec, id, data);
      if (hasErrors(errors)) throw new ValidationError('Validation failed', errors);

      update(entityName, id, data, user);
      const result = get(entityName, id);
      broadcastUpdate(`/api/${entityName}/${id}`, 'update', result);
      return ok(result);
    },

    delete: async (request, context) => {
      const user = await getUser();
      if (!user) throw new UnauthorizedError('Authentication required');
      if (!can(user, spec, 'delete')) throw new PermissionError(`Cannot delete ${entityName}`);

      const { id } = context.params;
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
      if (!get(entityName, id)) throw new NotFoundError(entityName, id);

      remove(entityName, id);
      broadcastUpdate(`/api/${entityName}/${id}`, 'delete', { id });
      return ok({ success: true });
    },
  };

  const getAction = (request, context) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || context.params?.action;

    if (request.method === 'GET' && !action) return 'list';
    if (request.method === 'GET' && action === 'view') return 'get';
    if (request.method === 'POST' && !action) return 'create';
    if (request.method === 'PUT') return 'update';
    if (request.method === 'PATCH') return 'update';
    if (request.method === 'DELETE') return 'delete';

    return action;
  };

  return async (request, context) => {
    try {
      const action = getAction(request, context);
      const handler = crudHandlers[action] || spec.routes?.[request.method]?.handler;

      if (!handler) {
        throw new AppError(`Unknown action: ${action}`, 'BAD_REQUEST', 400);
      }

      if (typeof handler === 'string') {
        const customHandler = spec.handlers?.[handler];
        if (!customHandler) {
          throw new AppError(`Handler not found: ${handler}`, 'BAD_REQUEST', 400);
        }
        return await wrapError(customHandler, `${entityName}.${handler}`)(request, context);
      }

      return await wrapError(handler, `${entityName}.${action}`)(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return apiError(error);
      }
      return apiError(new AppError(error.message, 'INTERNAL_ERROR', 500));
    }
  };
}

export { createUniversalHandler as createApiHandler };
