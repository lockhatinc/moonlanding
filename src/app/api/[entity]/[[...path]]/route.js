import { NextResponse } from 'next/server';
import { getSpec, specs } from '@/specs';
import { list, get, create, update, remove, search, getChildren, getUser, can, migrate } from '@/engine';

let dbInit = false;
function ensureDb() { if (!dbInit) { migrate(); dbInit = true; } }

export async function GET(request, { params }) {
  ensureDb();
  try {
    const { entity, path = [] } = await params;
    let spec; try { spec = getSpec(entity); } catch { return NextResponse.json({ error: 'Unknown entity' }, { status: 404 }); }
    const user = await getUser();
    if (!can(user, spec, 'list')) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const [id, childKey] = path;
    if (id && !childKey) { const record = get(entity, id); return record ? NextResponse.json(record) : NextResponse.json({ error: 'Not found' }, { status: 404 }); }
    if (id && childKey) { const childDef = spec.children?.[childKey]; return childDef ? NextResponse.json(getChildren(entity, id, childDef)) : NextResponse.json({ error: 'Unknown child' }, { status: 404 }); }
    const { searchParams } = new URL(request.url), q = searchParams.get('q');
    return NextResponse.json(q ? search(entity, q) : list(entity));
  } catch (e) { console.error('API GET error:', e); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(request, { params }) {
  ensureDb();
  try {
    const { entity } = await params;
    let spec; try { spec = getSpec(entity); } catch { return NextResponse.json({ error: 'Unknown entity' }, { status: 404 }); }
    const user = await getUser();
    if (!can(user, spec, 'create')) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    return NextResponse.json(create(entity, await request.json(), user), { status: 201 });
  } catch (e) { console.error('API POST error:', e); return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 }); }
}

export async function PUT(request, { params }) {
  ensureDb();
  try {
    const { entity, path = [] } = await params, [id] = path;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    let spec; try { spec = getSpec(entity); } catch { return NextResponse.json({ error: 'Unknown entity' }, { status: 404 }); }
    const user = await getUser();
    if (!can(user, spec, 'edit')) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (!get(entity, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    update(entity, id, await request.json(), user);
    return NextResponse.json(get(entity, id));
  } catch (e) { console.error('API PUT error:', e); return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 }); }
}

export async function PATCH(request, { params }) { return PUT(request, { params }); }

export async function DELETE(request, { params }) {
  ensureDb();
  try {
    const { entity, path = [] } = await params, [id] = path;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    let spec; try { spec = getSpec(entity); } catch { return NextResponse.json({ error: 'Unknown entity' }, { status: 404 }); }
    const user = await getUser();
    if (!can(user, spec, 'delete')) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (!get(entity, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    remove(entity, id);
    return NextResponse.json({ success: true });
  } catch (e) { console.error('API DELETE error:', e); return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 }); }
}
