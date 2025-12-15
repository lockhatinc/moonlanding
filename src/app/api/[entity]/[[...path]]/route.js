import { list, get, create, update, remove, search, getChildren } from '@/engine';
import { getUser, can } from '@/engine.server';
import { getSpec, VALIDATORS } from '@/config';
import { ok, created, notFound, badRequest, unauthorized, serverError, ensureDb, parseParams } from '@/lib/api-helpers';
import { broadcastUpdate } from '@/lib/realtime-server';
import { validateStageTransition, validateRfiStatusChange } from '@/engine/events';
import { logger } from '@/lib/logger';

export async function GET(request, { params }) {
  ensureDb();
  try {
    const { entity, id, childKey } = await parseParams(params);
    let spec; try { spec = getSpec(entity); } catch { return notFound('Unknown entity'); }
    if (!can(await getUser(), spec, 'list')) return unauthorized();

    if (id && !childKey) {
      const record = get(entity, id);
      return record ? ok(record) : notFound();
    }
    if (id && childKey) {
      const childDef = spec.children?.[childKey];
      return childDef ? ok(getChildren(entity, id, childDef)) : notFound('Unknown child');
    }
    const q = new URL(request.url).searchParams.get('q');
    return ok(q ? search(entity, q) : list(entity));
  } catch (e) { logger.apiError('GET', params.entity, e); return serverError(); }
}

export async function POST(request, { params }) {
  ensureDb();
  try {
    const { entity } = await parseParams(params);
    let spec; try { spec = getSpec(entity); } catch { return notFound('Unknown entity'); }
    const user = await getUser();
    if (!can(user, spec, 'create')) return unauthorized();
    const result = create(entity, await request.json(), user);
    broadcastUpdate(`/api/${entity}`, 'create', result);
    return created(result);
  } catch (e) { logger.apiError('POST', params.entity, e); return serverError(e.message); }
}

export async function PUT(request, { params }) {
  ensureDb();
  try {
    const { entity, id } = await parseParams(params);
    if (!id) return badRequest('ID required');
    let spec; try { spec = getSpec(entity); } catch { return notFound('Unknown entity'); }
    const user = await getUser();
    if (!can(user, spec, 'edit')) return unauthorized();
    const prev = get(entity, id);
    if (!prev) return notFound();

    const data = await request.json();

    // Run configured validators for this entity
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
  } catch (e) { logger.apiError('PUT', params.entity, e); return serverError(e.message); }
}

export async function PATCH(request, { params }) { return PUT(request, { params }); }

export async function DELETE(request, { params }) {
  ensureDb();
  try {
    const { entity, id } = await parseParams(params);
    if (!id) return badRequest('ID required');
    let spec; try { spec = getSpec(entity); } catch { return notFound('Unknown entity'); }
    if (!can(await getUser(), spec, 'delete')) return unauthorized();
    if (!get(entity, id)) return notFound();
    remove(entity, id);
    broadcastUpdate(`/api/${entity}/${id}`, 'delete', { id });
    broadcastUpdate(`/api/${entity}`, 'delete', { id });
    return ok({ success: true });
  } catch (e) { logger.apiError('DELETE', params.entity, e); return serverError(e.message); }
}
