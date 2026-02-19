import { getDatabase, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { get, update } from '@/engine';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (!['partner', 'manager'].includes(user.role)) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only partners and managers can set client inactive' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { client_id } = body;

  if (!client_id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'client_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const client = get('client', client_id);
  if (!client) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Client not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const timestamp = now();
  let repeatsStopped = 0;
  let infoGatheringDeleted = 0;

  const cascadeInactive = db.transaction(() => {
    update('client', client_id, { status: 'inactive', updated_at: timestamp, updated_by: user.id });

    const repeatingEngagements = db.prepare(`
      SELECT id, repeat_interval FROM engagement
      WHERE client_id = ? AND repeat_interval != 'once' AND (status IS NULL OR status != 'deleted')
    `).all(client_id);

    for (const eng of repeatingEngagements) {
      db.prepare('UPDATE engagement SET repeat_interval = ?, updated_at = ?, updated_by = ? WHERE id = ?')
        .run('once', timestamp, user.id, eng.id);
      repeatsStopped++;
    }

    const infoGatheringEngs = db.prepare(`
      SELECT id, progress FROM engagement
      WHERE client_id = ? AND stage = 'info_gathering' AND (progress IS NULL OR progress = 0)
        AND (status IS NULL OR status != 'deleted')
    `).all(client_id);

    for (const eng of infoGatheringEngs) {
      db.prepare('DELETE FROM rfi WHERE engagement_id = ?').run(eng.id);
      db.prepare('DELETE FROM rfi_section WHERE engagement_id = ?').run(eng.id);
      db.prepare('DELETE FROM message WHERE engagement_id = ?').run(eng.id);
      db.prepare('DELETE FROM engagement WHERE id = ?').run(eng.id);
      infoGatheringDeleted++;
    }
  });

  cascadeInactive();

  logAction('client', client_id, 'set_inactive', user.id, { status: client.status }, {
    status: 'inactive',
    repeats_stopped: repeatsStopped,
    info_gathering_deleted: infoGatheringDeleted
  });

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        client_id,
        status: 'inactive',
        repeats_stopped: repeatsStopped,
        info_gathering_deleted: infoGatheringDeleted
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'client-inactive');
