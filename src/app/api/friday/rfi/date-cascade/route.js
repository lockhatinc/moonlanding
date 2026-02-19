import { getDatabase, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { get } from '@/engine';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (user.type === 'client') {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only auditor users can cascade RFI dates' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { engagement_id, new_commencement_date } = body;

  if (!engagement_id || !new_commencement_date) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'engagement_id and new_commencement_date required' }),
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

  const newDate = typeof new_commencement_date === 'number'
    ? new_commencement_date
    : Math.floor(new Date(new_commencement_date).getTime() / 1000);

  if (isNaN(newDate) || newDate <= 0) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Invalid date format' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const oldDate = engagement.commencement_date;
  const dateDiff = oldDate ? (newDate - oldDate) : 0;

  const db = getDatabase();
  const timestamp = now();
  let updatedCount = 0;

  const cascadeUpdate = db.transaction(() => {
    db.prepare('UPDATE engagement SET commencement_date = ?, updated_at = ?, updated_by = ? WHERE id = ?')
      .run(newDate, timestamp, user.id, engagement_id);

    const rfiItems = db.prepare('SELECT id, date_requested, deadline_date FROM rfi WHERE engagement_id = ?')
      .all(engagement_id);

    for (const rfi of rfiItems) {
      const updates = {};

      if (dateDiff !== 0) {
        if (rfi.date_requested) {
          updates.date_requested = rfi.date_requested + dateDiff;
        } else {
          updates.date_requested = newDate;
        }

        if (rfi.deadline_date) {
          updates.deadline_date = rfi.deadline_date + dateDiff;
        }
      } else {
        updates.date_requested = newDate;
      }

      updates.updated_at = timestamp;
      updates.updated_by = user.id;

      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);

      db.prepare(`UPDATE rfi SET ${setClauses} WHERE id = ?`).run(...values, rfi.id);
      updatedCount++;
    }
  });

  cascadeUpdate();

  logAction('engagement', engagement_id, 'date_cascade', user.id,
    { commencement_date: oldDate },
    { commencement_date: newDate, rfi_updated: updatedCount, date_diff_seconds: dateDiff }
  );

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        engagement_id,
        old_commencement_date: oldDate,
        new_commencement_date: newDate,
        rfi_items_updated: updatedCount,
        date_shift_days: Math.round(dateDiff / 86400)
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'rfi-date-cascade');
