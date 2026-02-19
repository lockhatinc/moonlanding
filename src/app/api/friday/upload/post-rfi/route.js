import { getDatabase, now, genId } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { get, update } from '@/engine';
import { logAction } from '@/lib/audit-logger';
import { fileService } from '@/services/file.service';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

const VALID_TYPES = ['draft_afs', 'draft_journals'];

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (user.type === 'client') {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only auditor users can upload post-RFI files' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const contentType = request.headers?.['content-type'] || '';
  let engagementId, fileType, fileName, fileContent, mimeType;

  if (contentType.includes('application/json')) {
    const body = await request.json();
    engagementId = body.engagement_id;
    fileType = body.file_type;
    fileName = body.file_name;
    fileContent = body.file_content ? Buffer.from(body.file_content, 'base64') : null;
    mimeType = body.mime_type || 'application/pdf';
  } else {
    const formData = await request.formData?.();
    if (formData) {
      engagementId = formData.get('engagement_id');
      fileType = formData.get('file_type');
      fileName = formData.get('file_name');
      const file = formData.get('file');
      if (file) {
        fileContent = Buffer.from(await file.arrayBuffer());
        mimeType = file.type || 'application/pdf';
        fileName = fileName || file.name;
      }
    }
  }

  if (!engagementId || !fileType) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'engagement_id and file_type required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!VALID_TYPES.includes(fileType)) {
    return new Response(
      JSON.stringify({ status: 'error', message: `file_type must be one of: ${VALID_TYPES.join(', ')}` }),
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
  const timestamp = now();
  let uploadResult = null;

  if (fileContent) {
    try {
      uploadResult = await fileService.uploadForEntity(
        fileContent,
        'engagement_file',
        { clientId: engagement.client_id, engagementId, fileName: fileName || fileType },
        mimeType
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ status: 'error', message: `Upload failed: ${err.message}` }),
        { status: HTTP.INTERNAL_ERROR, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const fileUrl = uploadResult?.webViewLink || uploadResult?.id || null;
  const fileId = genId();

  if (fileUrl) {
    db.prepare(`
      INSERT INTO file (id, name, file_url, file_size, mime_type, engagement_id, file_type, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fileId, fileName || fileType, fileUrl, fileContent?.length || 0, mimeType, engagementId, fileType, timestamp, user.id);
  }

  const statusField = fileType === 'draft_afs' ? 'post_rfi_auditor_status' : 'post_rfi_journal_auditor_status';
  const urlField = fileType === 'draft_afs' ? 'post_rfi_file_url' : 'post_rfi_journal_file_url';

  update('engagement', engagementId, {
    [statusField]: 'sent',
    [urlField]: fileUrl,
    updated_at: timestamp,
    updated_by: user.id
  });

  const client = db.prepare('SELECT email, name FROM client WHERE id = ?').get(engagement.client_id);
  if (client?.email) {
    const typeLabel = fileType === 'draft_afs' ? 'Draft Annual Financial Statements' : 'Draft Journals';
    db.prepare(`
      INSERT INTO email (id, recipient_email, sender_email, subject, body, html_body, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      genId(),
      client.email,
      process.env.EMAIL_FROM || 'noreply@bidwise.app',
      `${typeLabel} Available - ${engagement.name || engagementId}`,
      `Your ${typeLabel.toLowerCase()} for ${engagement.name || engagementId} are now available for review.`,
      `<p>Your <b>${typeLabel.toLowerCase()}</b> for <b>${engagement.name || engagementId}</b> are available.</p>`,
      'pending',
      timestamp
    );
  }

  logAction('engagement', engagementId, `post_rfi_${fileType}_uploaded`, user.id, null, {
    file_type: fileType, file_id: fileId, file_url: fileUrl
  });

  return new Response(
    JSON.stringify({
      status: 'success',
      data: { engagement_id: engagementId, file_type: fileType, file_id: fileId, file_url: fileUrl }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'upload-post-rfi');
