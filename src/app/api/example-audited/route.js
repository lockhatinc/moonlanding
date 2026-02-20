import { NextResponse } from '@/lib/next-polyfills';
import { get, create, update, remove } from '@/engine';
import { requireAuth } from '@/lib/auth-middleware';
import { auditCreate, auditUpdate, auditDelete } from '@/lib/with-audit-logging';
import { logAuthzFailure } from '@/lib/audit-logger-enhanced';
import { withErrorHandler } from '@/lib/with-error-handler';

export const POST = withErrorHandler(async (request) => {
  const user = await requireAuth();
  const body = await request.json();

  const newEntity = create('example_entity', {
    name: body.name,
    description: body.description,
    created_by: user.id,
  });

  auditCreate('example_entity', newEntity.id, user.id, newEntity);

  return NextResponse.json({ success: true, data: newEntity });
});

export const PATCH = withErrorHandler(async (request) => {
  const user = await requireAuth();
  const body = await request.json();
  const { id } = body;

  const existing = get('example_entity', id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.created_by !== user.id && user.role !== 'admin') {
    logAuthzFailure(user.id, 'example_entity', id, 'edit');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const updated = update('example_entity', id, { name: body.name, description: body.description }, user);
  auditUpdate('example_entity', id, user.id, existing, updated);

  return NextResponse.json({ success: true, data: updated });
});

export const DELETE = withErrorHandler(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  const existing = get('example_entity', id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.created_by !== user.id && user.role !== 'admin') {
    logAuthzFailure(user.id, 'example_entity', id, 'delete');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  remove('example_entity', id);
  auditDelete('example_entity', id, user.id, existing);

  return NextResponse.json({ success: true });
});
