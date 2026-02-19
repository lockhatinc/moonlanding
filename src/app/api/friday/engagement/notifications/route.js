import { getDatabase, now, genId } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handleGet(request) {
  setCurrentRequest(request);
  await requireAuth();

  const db = getDatabase();
  const url = new URL(request.url);
  const engagementId = url.searchParams.get('engagement_id');

  if (engagementId) {
    const notifications = db.prepare(`
      SELECT * FROM engagement_notification
      WHERE engagement_id = ?
      ORDER BY created_at DESC
    `).all(engagementId);

    return new Response(
      JSON.stringify({ status: 'success', data: notifications }),
      { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const notifications = db.prepare(`
    SELECT * FROM engagement_notification
    WHERE active = 1
    ORDER BY trigger_days ASC
  `).all();

  return new Response(
    JSON.stringify({ status: 'success', data: notifications }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  const body = await request.json();
  const { trigger_type, trigger_days, trigger_reference, recipient_type, template_id, active } = body;

  if (!trigger_type || trigger_days === undefined || !trigger_reference || !recipient_type) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'trigger_type, trigger_days, trigger_reference, and recipient_type required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const validTriggerTypes = ['before', 'after'];
  const validReferences = ['commencement_date', 'deadline_date'];
  const validRecipients = ['client_admin', 'client_user', 'team_manager', 'team_clerk', 'partner'];

  if (!validTriggerTypes.includes(trigger_type)) {
    return new Response(
      JSON.stringify({ status: 'error', message: `trigger_type must be one of: ${validTriggerTypes.join(', ')}` }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!validReferences.includes(trigger_reference)) {
    return new Response(
      JSON.stringify({ status: 'error', message: `trigger_reference must be one of: ${validReferences.join(', ')}` }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!validRecipients.includes(recipient_type)) {
    return new Response(
      JSON.stringify({ status: 'error', message: `recipient_type must be one of: ${validRecipients.join(', ')}` }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const id = genId();
  const timestamp = now();

  db.prepare(`
    INSERT INTO engagement_notification (id, trigger_type, trigger_days, trigger_reference, recipient_type, template_id, active, created_at, created_by, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, trigger_type, trigger_days, trigger_reference, recipient_type, template_id || null, active !== false ? 1 : 0, timestamp, user.id, timestamp, user.id);

  return new Response(
    JSON.stringify({
      status: 'success',
      data: { id, trigger_type, trigger_days, trigger_reference, recipient_type, active: active !== false }
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleDelete(request) {
  setCurrentRequest(request);
  await requireAuth();

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  db.prepare('DELETE FROM engagement_notification WHERE id = ?').run(id);

  return new Response(
    JSON.stringify({ status: 'success', data: { id, deleted: true } }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const GET = withErrorHandler(handleGet, 'engagement-notifications-get');
export const POST = withErrorHandler(handlePost, 'engagement-notifications-create');
export const DELETE = withErrorHandler(handleDelete, 'engagement-notifications-delete');
