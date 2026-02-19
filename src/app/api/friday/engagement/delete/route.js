import { NextResponse } from '@/lib/next-polyfills';
import { getDatabase, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { get, remove } from '@/engine';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

const ALLOWED_STAGES = ['info_gathering'];
const PARTNER_ROLE = 'partner';

async function handleDelete(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (user.role !== PARTNER_ROLE) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only partners can delete engagements' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { engagement_id } = body;

  if (!engagement_id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'engagement_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const engagement = get('engagement', engagement_id);
  if (!engagement) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Engagement not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!ALLOWED_STAGES.includes(engagement.stage)) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: `Cannot delete engagement in ${engagement.stage} stage. Only Info Gathering engagements can be deleted.`
      }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const progress = Number(engagement.progress) || 0;
  if (progress > 0) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: `Cannot delete engagement with ${progress}% progress. Only 0% progress engagements can be deleted.`
      }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const deleteRelated = db.transaction(() => {
    db.prepare('DELETE FROM rfi WHERE engagement_id = ?').run(engagement_id);
    db.prepare('DELETE FROM rfi_section WHERE engagement_id = ?').run(engagement_id);
    db.prepare('DELETE FROM message WHERE engagement_id = ?').run(engagement_id);
    db.prepare('DELETE FROM activity_log WHERE entity_type = ? AND entity_id = ?').run('engagement', engagement_id);
    remove('engagement', engagement_id);
  });

  deleteRelated();

  logAction('engagement', engagement_id, 'delete', user.id, engagement, null);

  return new Response(
    JSON.stringify({
      status: 'success',
      data: { engagement_id, deleted: true }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handleDelete, 'engagement-delete');
