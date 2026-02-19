import { getDatabase, now, genId } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { logAction } from '@/lib/audit-logger';
import { fileService } from '@/services/file.service';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  const contentType = request.headers?.['content-type'] || '';
  let targetUserId, fileName, fileContent, mimeType;

  if (contentType.includes('application/json')) {
    const body = await request.json();
    targetUserId = body.user_id || user.id;
    fileName = body.file_name;
    fileContent = body.file_content ? Buffer.from(body.file_content, 'base64') : null;
    mimeType = body.mime_type || 'application/pdf';
  } else {
    const formData = await request.formData?.();
    if (formData) {
      targetUserId = formData.get('user_id') || user.id;
      fileName = formData.get('file_name');
      const file = formData.get('file');
      if (file) {
        fileContent = Buffer.from(await file.arrayBuffer());
        mimeType = file.type || 'application/pdf';
        fileName = fileName || file.name;
      }
    }
  }

  if (targetUserId !== user.id && !['partner', 'manager'].includes(user.role)) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only partners/managers can upload CVs for other users' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const targetUser = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(targetUserId);
  if (!targetUser) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'User not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const timestamp = now();
  let uploadResult = null;

  if (fileContent) {
    try {
      uploadResult = await fileService.uploadForEntity(
        fileContent,
        'general',
        { fileName: fileName || 'cv' },
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

  db.prepare('UPDATE users SET cv_url = ?, cv_file_name = ?, updated_at = ?, updated_by = ? WHERE id = ?')
    .run(fileUrl, fileName, timestamp, user.id, targetUserId);

  logAction('users', targetUserId, 'cv_uploaded', user.id, null, {
    file_name: fileName, file_url: fileUrl
  });

  return new Response(
    JSON.stringify({
      status: 'success',
      data: { user_id: targetUserId, file_name: fileName, file_url: fileUrl }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'upload-user-cv');
