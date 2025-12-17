import { getUser } from '@/engine.server';
import { getSpec } from '@/config';
import { can } from '@/lib/permissions';
import { list, get, create, update, remove, listWithPagination, search } from '@/lib/query-engine';
import { validateEntity, validateUpdate, hasErrors } from '@/lib/validate';
import { broadcastUpdate } from '@/lib/realtime-server';
import { UnauthorizedError, PermissionError, NotFoundError, ValidationError, AppError, createErrorLogger } from '@/lib/error-handler';

const logger = createErrorLogger('API');

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

const createHandler = (entity, action) => async (request, { params, searchParams }) => {
  const user = await getUser();
  if (!user) throw new UnauthorizedError('Authentication required');

  const spec = getSpec(entity);
  if (!spec) throw new NotFoundError('entity', entity);
  if (!can(user, spec, action)) throw new PermissionError(`Cannot ${action} ${entity}`);

  const { id } = params;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = parseInt(searchParams.get('pageSize') || String(spec.list?.pageSize || 20));
  const q = searchParams.get('q');

  if (action === 'list') {
    if (q) {
      const items = search(entity, q);
      return ok({ items });
    }
    const { items, pagination } = listWithPagination(entity, {}, page, pageSize);
    return ok({ items, pagination });
  }

  if (action === 'get') {
    if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
    const item = get(entity, id);
    if (!item) throw new NotFoundError(entity, id);
    return ok(item);
  }

  if (action === 'create') {
    const data = await request.json();
    const errors = await validateEntity(spec, data);
    if (hasErrors(errors)) throw new ValidationError('Validation failed', errors);

    const result = create(entity, data, user);
    broadcastUpdate(`/api/${entity}`, 'create', result);
    return ok(result, 201);
  }

  if (action === 'update') {
    if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
    const prev = get(entity, id);
    if (!prev) throw new NotFoundError(entity, id);

    const data = await request.json();
    const errors = await validateUpdate(spec, id, data);
    if (hasErrors(errors)) throw new ValidationError('Validation failed', errors);

    update(entity, id, data, user);
    const result = get(entity, id);
    broadcastUpdate(`/api/${entity}/${id}`, 'update', result);
    return ok(result);
  }

  if (action === 'delete') {
    if (!id) throw new AppError('ID required', 'BAD_REQUEST', 400);
    if (!get(entity, id)) throw new NotFoundError(entity, id);

    remove(entity, id);
    broadcastUpdate(`/api/${entity}/${id}`, 'delete', { id });
    return ok({ success: true });
  }

  throw new AppError('Unknown action', 'BAD_REQUEST', 400);
};

export const createApiHandler = (entity, action) => async (request, { params, searchParams }) => {
  try {
    return await createHandler(entity, action)(request, { params, searchParams });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error(error.code, error.context);
      return apiError(error);
    }
    logger.error('INTERNAL_ERROR', { message: error.message });
    const appError = new AppError(error.message, 'INTERNAL_ERROR', 500, { originalMessage: error.message });
    return apiError(appError);
  }
};
