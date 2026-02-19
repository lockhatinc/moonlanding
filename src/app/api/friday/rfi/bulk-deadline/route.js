import { getDatabase, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (user.type === 'client') {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only auditor users can set RFI deadlines' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { rfi_ids, deadline_date, engagement_id } = body;

  if (!rfi_ids || !Array.isArray(rfi_ids) || rfi_ids.length === 0) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'rfi_ids array required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!deadline_date) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'deadline_date required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const deadlineTimestamp = typeof deadline_date === 'number' ? deadline_date : Math.floor(new Date(deadline_date).getTime() / 1000);

  if (isNaN(deadlineTimestamp) || deadlineTimestamp <= 0) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Invalid deadline_date format' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const timestamp = now();
  const results = { updated: [], failed: [] };

  const bulkUpdate = db.transaction(() => {
    for (const rfiId of rfi_ids) {
      const rfi = db.prepare('SELECT id, deadline_date, engagement_id FROM rfi WHERE id = ?').get(rfiId);

      if (!rfi) {
        results.failed.push({ id: rfiId, reason: 'RFI not found' });
        continue;
      }

      if (engagement_id && rfi.engagement_id !== engagement_id) {
        results.failed.push({ id: rfiId, reason: 'RFI does not belong to specified engagement' });
        continue;
      }

      const oldDeadline = rfi.deadline_date;
      db.prepare('UPDATE rfi SET deadline_date = ?, updated_at = ?, updated_by = ? WHERE id = ?')
        .run(deadlineTimestamp, timestamp, user.id, rfiId);

      results.updated.push({ id: rfiId, old_deadline: oldDeadline, new_deadline: deadlineTimestamp });
    }
  });

  bulkUpdate();

  logAction('rfi', engagement_id || 'bulk', 'bulk_deadline_update', user.id, null, {
    total: rfi_ids.length,
    updated: results.updated.length,
    failed: results.failed.length,
    deadline_date: deadlineTimestamp
  });

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        total: rfi_ids.length,
        updated: results.updated.length,
        failed: results.failed.length,
        deadline_date: deadlineTimestamp,
        details: results
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'rfi-bulk-deadline');
