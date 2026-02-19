import { getDatabase } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handleGet(request) {
  setCurrentRequest(request);
  await requireAuth();

  const url = new URL(request.url);
  const teamId = url.searchParams.get('team_id');
  const clientId = url.searchParams.get('client_id');
  const yearFilter = url.searchParams.get('year');

  const db = getDatabase();
  const conditions = ['1=1'];
  const params = [];

  if (teamId) {
    conditions.push("json_extract(users, '$') LIKE ?");
    params.push(`%${teamId}%`);
  }

  if (clientId) {
    conditions.push('client_id = ?');
    params.push(clientId);
  }

  if (yearFilter) {
    const yearStart = new Date(`${yearFilter}-03-01`).getTime() / 1000;
    const yearEnd = new Date(`${Number(yearFilter) + 1}-02-28`).getTime() / 1000;
    conditions.push('created_at >= ? AND created_at <= ?');
    params.push(yearStart, yearEnd);
  }

  const where = conditions.join(' AND ');

  const stageCounts = db.prepare(`
    SELECT stage, COUNT(*) as count
    FROM engagement
    WHERE ${where} AND (status IS NULL OR status != 'deleted')
    GROUP BY stage
    ORDER BY stage
  `).all(...params);

  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM engagement
    WHERE ${where}
    GROUP BY status
    ORDER BY status
  `).all(...params);

  const totalCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM engagement
    WHERE ${where} AND (status IS NULL OR status != 'deleted')
  `).get(...params);

  const stages = {};
  for (const row of stageCounts) {
    stages[row.stage || 'unknown'] = row.count;
  }

  const statuses = {};
  for (const row of statusCounts) {
    statuses[row.status || 'unknown'] = row.count;
  }

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        stages,
        statuses,
        total: totalCount.count,
        filters: { team_id: teamId, client_id: clientId, year: yearFilter }
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const GET = withErrorHandler(handleGet, 'engagement-stage-counts');
