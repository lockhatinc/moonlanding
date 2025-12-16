import { badRequest, unauthorized, notFound, serverError, ok } from '@/lib/api-helpers';
import { requireUser } from '@/engine.server';
import { can } from '@/lib/permissions';
import { create, get, remove, list } from '@/engine';
import { getSpec } from '@/config';
import * as drive from '@/engine/drive';

export async function POST(request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get('file');
    const entityType = formData.get('entity_type');
    const entityId = formData.get('entity_id');
    const folderId = formData.get('folder_id');
    if (!file || !entityType || !entityId) return badRequest('Missing required fields');
    const spec = getSpec('file');
    if (!can(user, spec, 'create')) return unauthorized();
    const buffer = Buffer.from(await file.arrayBuffer());
    const driveFile = await drive.uploadFile(buffer, file.name, file.type, folderId || undefined);
    const fileRecord = create('file', {
      entity_type: entityType,
      entity_id: entityId,
      drive_file_id: driveFile.id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      mime_type: file.type,
      download_url: driveFile.webContentLink,
    }, user);
    return ok(fileRecord);
  } catch (error) {
    console.error('[FILES] POST error:', error.message);
    return serverError(error.message);
  }
}

export async function GET(request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    if (!entityType || !entityId) return badRequest('Missing entity_type or entity_id');
    const spec = getSpec('file');
    if (!can(user, spec, 'list')) return unauthorized();
    const files = list('file', { entity_type: entityType, entity_id: entityId });
    return ok(files);
  } catch (error) {
    console.error('[FILES] GET error:', error.message);
    return serverError(error.message);
  }
}

export async function DELETE(request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    if (!fileId) return badRequest('Missing file id');
    const spec = getSpec('file');
    if (!can(user, spec, 'delete')) return unauthorized();
    const fileRecord = get('file', fileId);
    if (!fileRecord) return notFound('File not found');
    if (fileRecord.drive_file_id) {
      try {
        await drive.deleteFile(fileRecord.drive_file_id);
      } catch (e) {
        console.warn('[FILES] Failed to delete from Drive:', e.message);
      }
    }
    remove('file', fileId);
    return ok({ success: true });
  } catch (error) {
    console.error('[FILES] DELETE error:', error.message);
    return serverError(error.message);
  }
}
