// File upload/download API routes
import { NextResponse } from 'next/server';
import { requireUser, can } from '@/engine.server';
import { getSpec } from '@/specs';
import { create, get, remove } from '@/engine.server';
import * as drive from '@/engine/drive';

// Upload file
export async function POST(request) {
  try {
    const user = await requireUser();

    const formData = await request.formData();
    const file = formData.get('file');
    const entityType = formData.get('entity_type');
    const entityId = formData.get('entity_id');
    const folderId = formData.get('folder_id');

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check permission
    const spec = getSpec('file');
    if (!can(user, spec, 'create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Upload to Drive
    const buffer = Buffer.from(await file.arrayBuffer());
    const driveFile = await drive.uploadFile(
      buffer,
      file.name,
      file.type,
      folderId || undefined
    );

    // Create file record
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

    return NextResponse.json(fileRecord);
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// List files for entity
export async function GET(request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Missing entity_type or entity_id' }, { status: 400 });
    }

    // Check permission
    const spec = getSpec('file');
    if (!can(user, spec, 'list')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const files = await list('file', { entity_type: entityType, entity_id: entityId });
    return NextResponse.json(files);
  } catch (error) {
    console.error('File list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete file
export async function DELETE(request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file id' }, { status: 400 });
    }

    // Check permission
    const spec = getSpec('file');
    if (!can(user, spec, 'delete')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get file record
    const fileRecord = get('file', fileId);
    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from Drive
    if (fileRecord.drive_file_id) {
      try {
        await drive.deleteFile(fileRecord.drive_file_id);
      } catch (e) {
        console.warn('Failed to delete from Drive:', e.message);
      }
    }

    // Delete record
    remove('file', fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
