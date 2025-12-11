import { NextResponse } from 'next/server';
import { getSpec, specs } from '@/engine/spec';
import { list, get, create, update, remove, search, getChildren } from '@/engine/crud';
import { getUser, can } from '@/engine/auth';
import { migrate } from '@/engine/db';

// Initialize database on first request
let dbInitialized = false;
function ensureDb() {
  if (!dbInitialized) {
    migrate(specs);
    dbInitialized = true;
  }
}

// GET /api/[entity] - List all
// GET /api/[entity]/[id] - Get single
// GET /api/[entity]/[id]/[child] - Get children
export async function GET(request, { params }) {
  ensureDb();

  try {
    const { entity, path = [] } = await params;

    let spec;
    try {
      spec = getSpec(entity);
    } catch {
      return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
    }

    const user = await getUser();
    if (!can(user, spec, 'list')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [id, childKey] = path;

    // Get single record
    if (id && !childKey) {
      const record = get(entity, id);
      if (!record) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(record);
    }

    // Get children
    if (id && childKey) {
      const childDef = spec.children?.[childKey];
      if (!childDef) {
        return NextResponse.json({ error: 'Unknown child' }, { status: 404 });
      }
      const children = getChildren(entity, id, childDef);
      return NextResponse.json(children);
    }

    // List with optional search
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (q) {
      const results = search(entity, q);
      return NextResponse.json(results);
    }

    const records = list(entity);
    return NextResponse.json(records);
  } catch (error) {
    console.error('API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/[entity] - Create new
export async function POST(request, { params }) {
  ensureDb();

  try {
    const { entity } = await params;

    let spec;
    try {
      spec = getSpec(entity);
    } catch {
      return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
    }

    const user = await getUser();
    if (!can(user, spec, 'create')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const result = create(entity, data, user);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/[entity]/[id] - Update existing
export async function PUT(request, { params }) {
  ensureDb();

  try {
    const { entity, path = [] } = await params;
    const [id] = path;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    let spec;
    try {
      spec = getSpec(entity);
    } catch {
      return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
    }

    const user = await getUser();
    if (!can(user, spec, 'edit')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existing = get(entity, id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = await request.json();
    update(entity, id, data, user);

    const updated = get(entity, id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('API PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/[entity]/[id] - Partial update
export async function PATCH(request, { params }) {
  return PUT(request, { params });
}

// DELETE /api/[entity]/[id] - Delete
export async function DELETE(request, { params }) {
  ensureDb();

  try {
    const { entity, path = [] } = await params;
    const [id] = path;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    let spec;
    try {
      spec = getSpec(entity);
    } catch {
      return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
    }

    const user = await getUser();
    if (!can(user, spec, 'delete')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existing = get(entity, id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    remove(entity, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
