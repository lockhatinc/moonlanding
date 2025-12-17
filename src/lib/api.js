import { getUser } from '@/engine.server';
import { getSpec } from '@/config';
import { can } from '@/lib/permissions';
import { list, get, create, update, remove, listWithPagination, search } from '@/lib/query-engine';
import { validateEntity, validateUpdate, hasErrors } from '@/lib/validate';
import { broadcastUpdate } from '@/lib/realtime-server';

const err = (msg, code, status) => new Response(JSON.stringify({ status: 'error', message: msg, code, statusCode: status }), { status, headers: { 'Content-Type': 'application/json' } });
const ok = (data, status = 200) => new Response(JSON.stringify({ status: 'success', data }), { status, headers: { 'Content-Type': 'application/json' } });

export const createApiHandler = (entity, action) => async (request, { params, searchParams }) => {
  try {
    const user = await getUser();
    if (!user) return err('Auth required', 'UNAUTHORIZED', 401);

    const spec = getSpec(entity);
    if (!spec) return err('Unknown entity', 'NOT_FOUND', 404);
    if (!can(user, spec, action)) return err('Forbidden', 'FORBIDDEN', 403);

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
      if (!id) return err('ID required', 'BAD_REQUEST', 400);
      const item = get(entity, id);
      if (!item) return err('Not found', 'NOT_FOUND', 404);
      return ok(item);
    }

    if (action === 'create') {
      const data = await request.json();
      const errors = await validateEntity(spec, data);
      if (hasErrors(errors)) return err('Validation failed', 'VALIDATION_ERROR', 400);

      const result = create(entity, data, user);
      broadcastUpdate(`/api/${entity}`, 'create', result);
      return ok(result, 201);
    }

    if (action === 'update') {
      if (!id) return err('ID required', 'BAD_REQUEST', 400);
      const prev = get(entity, id);
      if (!prev) return err('Not found', 'NOT_FOUND', 404);

      const data = await request.json();
      const errors = await validateUpdate(spec, id, data);
      if (hasErrors(errors)) return err('Validation failed', 'VALIDATION_ERROR', 400);

      update(entity, id, data, user);
      const result = get(entity, id);
      broadcastUpdate(`/api/${entity}/${id}`, 'update', result);
      return ok(result);
    }

    if (action === 'delete') {
      if (!id) return err('ID required', 'BAD_REQUEST', 400);
      if (!get(entity, id)) return err('Not found', 'NOT_FOUND', 404);

      remove(entity, id);
      broadcastUpdate(`/api/${entity}/${id}`, 'delete', { id });
      return ok({ success: true });
    }

    return err('Unknown action', 'BAD_REQUEST', 400);
  } catch (error) {
    console.error('[API]', error);
    return err(error.message, 'SERVER_ERROR', 500);
  }
};
