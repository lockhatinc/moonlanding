import { getDatabase } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { get } from '@/engine';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

function computeProgress(db, engagementId) {
  const rfiItems = db.prepare(`
    SELECT id, client_status, auditor_status
    FROM rfi
    WHERE engagement_id = ?
  `).all(engagementId);

  if (rfiItems.length === 0) return { progress: 0, client_progress: 0, total: 0, completed: 0, clientCompleted: 0 };

  let completed = 0;
  let clientCompleted = 0;

  for (const item of rfiItems) {
    if (item.auditor_status === 'completed' || item.auditor_status === 'accepted') {
      completed++;
    }
    if (item.client_status === 'sent' || item.client_status === 'completed') {
      clientCompleted++;
    }
  }

  return {
    progress: Math.round((completed / rfiItems.length) * 100),
    client_progress: Math.round((clientCompleted / rfiItems.length) * 100),
    total: rfiItems.length,
    completed,
    clientCompleted
  };
}

async function handleGet(request) {
  setCurrentRequest(request);
  await requireAuth();

  const url = new URL(request.url);
  const engagementId = url.searchParams.get('engagement_id');

  if (!engagementId) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'engagement_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const engagement = get('engagement', engagementId);
  if (!engagement) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Engagement not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const progressData = computeProgress(db, engagementId);

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        engagement_id: engagementId,
        ...progressData
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handlePost(request) {
  setCurrentRequest(request);
  await requireAuth();

  const body = await request.json();
  const { engagement_id } = body;

  if (!engagement_id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'engagement_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const engagement = get('engagement', engagement_id);
  if (!engagement) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Engagement not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const progressData = computeProgress(db, engagement_id);

  db.prepare(`
    UPDATE engagement SET progress = ?, client_progress = ?, updated_at = ?
    WHERE id = ?
  `).run(progressData.progress, progressData.client_progress, Math.floor(Date.now() / 1000), engagement_id);

  return new Response(
    JSON.stringify({
      status: 'success',
      data: { engagement_id, ...progressData, synced: true }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const GET = withErrorHandler(handleGet, 'engagement-progress-get');
export const POST = withErrorHandler(handlePost, 'engagement-progress-sync');
