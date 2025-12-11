import { list, get, create, update, remove, search, getChildren, getUser, can } from '@/engine';
import { getSpec } from '@/specs';
import { ok, created, notFound, badRequest, unauthorized, serverError, ensureDb, parseParams } from '@/lib/api-helpers';

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
  } catch (e) { console.error('API GET error:', e); return serverError(); }
}

export async function POST(request, { params }) {
  ensureDb();
  try {
    const { entity } = await parseParams(params);
    let spec; try { spec = getSpec(entity); } catch { return notFound('Unknown entity'); }
    const user = await getUser();
    if (!can(user, spec, 'create')) return unauthorized();
    return created(create(entity, await request.json(), user));
  } catch (e) { console.error('API POST error:', e); return serverError(e.message); }
}

export async function PUT(request, { params }) {
  ensureDb();
  try {
    const { entity, id } = await parseParams(params);
    if (!id) return badRequest('ID required');
    let spec; try { spec = getSpec(entity); } catch { return notFound('Unknown entity'); }
    const user = await getUser();
    if (!can(user, spec, 'edit')) return unauthorized();
    if (!get(entity, id)) return notFound();
    update(entity, id, await request.json(), user);
    return ok(get(entity, id));
  } catch (e) { console.error('API PUT error:', e); return serverError(e.message); }
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
    return ok({ success: true });
  } catch (e) { console.error('API DELETE error:', e); return serverError(e.message); }
}
