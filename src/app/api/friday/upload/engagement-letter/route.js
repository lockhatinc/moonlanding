import { getDatabase, now, genId } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { get, update } from '@/engine';
import { logAction } from '@/lib/audit-logger';
import { fileService } from '@/services/file.service';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  const contentType = request.headers?.['content-type'] || '';
  let engagementId, fileName, fileContent, mimeType;

  if (contentType.includes('application/json')) {
    const body = await request.json();
    engagementId = body.engagement_id;
    fileName = body.file_name;
    fileContent = body.file_content ? Buffer.from(body.file_content, 'base64') : null;
    mimeType = body.mime_type || 'application/pdf';
  } else {
    const formData = await request.formData?.();
    if (formData) {
      engagementId = formData.get('engagement_id');
      fileName = formData.get('file_name');
      const file = formData.get('file');
      if (file) {
        fileContent = Buffer.from(await file.arrayBuffer());
        mimeType = file.type || 'application/pdf';
        fileName = fileName || file.name;
      }
    }
  }

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
  const timestamp = now();
  let uploadResult = null;

  if (fileContent) {
    try {
      uploadResult = await fileService.uploadForEntity(
        fileContent,
        'engagement_file',
        { clientId: engagement.client_id, engagementId, fileName: fileName || 'engagement-letter' },
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
    `).run(fileId, fileName || 'Engagement Letter', fileUrl, fileContent?.length || 0, mimeType, engagementId, 'engagement_letter', timestamp, user.id);
  }

  update('engagement', engagementId, {
    letter_auditor_status: 'sent',
    letter_file_url: fileUrl,
    letter_file_name: fileName,
    updated_at: timestamp,
    updated_by: user.id
  });

  logAction('engagement', engagementId, 'engagement_letter_uploaded', user.id, null, {
    file_name: fileName, file_id: fileId, file_url: fileUrl
  });

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        engagement_id: engagementId,
        file_id: fileId,
        file_name: fileName,
        file_url: fileUrl,
        letter_status: 'sent'
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'upload-engagement-letter');
