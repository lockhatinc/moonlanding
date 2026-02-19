import { getDatabase, now, genId } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { get } from '@/engine';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

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

  const db = getDatabase();

  const rfiFiles = db.prepare(`
    SELECT r.id as rfi_id, r.name as rfi_name, rr.file_url, rr.file_name, rr.file_size
    FROM rfi r
    JOIN rfi_response rr ON rr.rfi_id = r.id
    WHERE r.engagement_id = ? AND rr.file_url IS NOT NULL
  `).all(engagement_id);

  const engagementFiles = db.prepare(`
    SELECT id, name, file_url, file_size, mime_type
    FROM file
    WHERE engagement_id = ?
  `).all(engagement_id);

  const allFiles = [
    ...rfiFiles.map(f => ({
      source: 'rfi',
      rfi_id: f.rfi_id,
      rfi_name: f.rfi_name,
      url: f.file_url,
      name: f.file_name,
      size: f.file_size
    })),
    ...engagementFiles.map(f => ({
      source: 'engagement',
      url: f.file_url,
      name: f.name,
      size: f.file_size,
      mime_type: f.mime_type
    }))
  ];

  if (allFiles.length === 0) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'No files found for this engagement' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const jobId = genId();
  db.prepare(`
    INSERT INTO activity_log (id, entity_type, entity_id, action, user_id, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(jobId, 'engagement', engagement_id, 'files_zip_requested', user.id,
    JSON.stringify({ file_count: allFiles.length, job_id: jobId }), now()
  );

  const client = db.prepare('SELECT name, email FROM client WHERE id = ?').get(engagement.client_id);

  db.prepare(`
    INSERT INTO email (id, recipient_email, sender_email, subject, body, html_body, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    genId(),
    user.email || client?.email,
    process.env.EMAIL_FROM || 'noreply@bidwise.app',
    `Engagement Files: ${engagement.name || engagement_id}`,
    `Your engagement files (${allFiles.length} files) are ready for download.`,
    `<p>Your engagement files (${allFiles.length} files) for <b>${engagement.name || engagement_id}</b> are ready.</p>`,
    'pending',
    now()
  );

  logAction('engagement', engagement_id, 'files_zip_created', user.id, null, { file_count: allFiles.length });

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        job_id: jobId,
        engagement_id,
        file_count: allFiles.length,
        files: allFiles
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'engagement-files-zip');
