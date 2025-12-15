// File download API route
import { NextResponse } from 'next/server';
import { requireUser } from '@/engine.server';
import { can } from '@/lib/permissions';
import { get } from '@/engine';
import { getSpec } from '@/config';
import * as drive from '@/engine/drive';

// Download file
export async function GET(request, { params }) {
  try {
    const user = await requireUser();
    const { id } = params;

    // Check permission
    const spec = getSpec('file');
    if (!can(user, spec, 'view')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get file record
    const fileRecord = get('file', id);
    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Download from Drive
    const content = await drive.downloadFile(fileRecord.drive_file_id);

    return new NextResponse(content, {
      headers: {
        'Content-Type': fileRecord.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileRecord.file_name}"`,
      },
    });
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
