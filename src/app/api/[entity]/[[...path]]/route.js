import { list, get, create, update, remove, search, getChildren, listWithPagination } from '@/engine';
import { getUser } from '@/engine.server';
import { getSpec, VALIDATORS } from '@/config';
import { ok, created, notFound, badRequest, serverError, withEntityAccess, parseParams } from '@/lib/api-helpers';
import { broadcastUpdate } from '@/lib/realtime-server';
import { validateStageTransition, validateRfiStatusChange } from '@/engine/events';
import { logger } from '@/lib/logger';

export async function GET(request, { params }) {
  const { entity, id, childKey } = await parseParams(params);
  return withEntityAccess(entity, 'list', async (spec, user) => {
    if (id && !childKey) {
      const record = get(entity, id);
      return record ? ok(record) : notFound();
    }
    if (id && childKey) {
      const childDef = spec.children?.[childKey];
      return childDef ? ok(getChildren(entity, id, childDef)) : notFound('Unknown child');
    }

    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || String(spec.list?.pageSize || 20));

    if (q) {
      const results = search(entity, q);
      return ok({ items: results });
    }

    const { items, pagination } = listWithPagination(entity, {}, page, pageSize);
    return ok({ items, pagination });
  });
}

export async function POST(request, { params }) {
  const { entity } = await parseParams(params);
  return withEntityAccess(entity, 'create', async (spec, user) => {
    const result = create(entity, await request.json(), user);
    broadcastUpdate(`/api/${entity}`, 'create', result);
    return created(result);
  });
}

export async function PUT(request, { params }) {
  const { entity, id } = await parseParams(params);
  if (!id) return badRequest('ID required');
  return withEntityAccess(entity, 'edit', async (spec, user) => {
    const prev = get(entity, id);
    if (!prev) return notFound();

    const data = await request.json();
    const entityValidators = VALIDATORS[entity];
    if (entityValidators) {
      for (const [field, validatorName] of Object.entries(entityValidators)) {
        if (data[field] !== undefined && data[field] !== prev[field]) {
          const validators = { validateStageTransition, validateRfiStatusChange };
          const validator = validators[validatorName];
          if (validator) await validator(prev, data[field], user);
        }
      }
    }

    update(entity, id, data, user);
    const result = get(entity, id);
    broadcastUpdate(`/api/${entity}/${id}`, 'update', result);
    broadcastUpdate(`/api/${entity}`, 'update', result);
    return ok(result);
  });
}

export async function PATCH(request, { params }) { return PUT(request, { params }); }

export async function DELETE(request, { params }) {
  const { entity, id } = await parseParams(params);
  if (!id) return badRequest('ID required');
  return withEntityAccess(entity, 'delete', async (spec, user) => {
    if (!get(entity, id)) return notFound();
    remove(entity, id);
    broadcastUpdate(`/api/${entity}/${id}`, 'delete', { id });
    broadcastUpdate(`/api/${entity}`, 'delete', { id });
    return ok({ success: true });
  });
}
