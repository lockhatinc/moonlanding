import { NextResponse } from 'next/server';
import { getDatabase, now } from '@/lib/database-core';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email_id, engagement_id, rfi_id } = body;

    if (!email_id) {
      return NextResponse.json(
        { error: 'email_id is required' },
        { status: 400 }
      );
    }

    if (!engagement_id && !rfi_id) {
      return NextResponse.json(
        { error: 'Either engagement_id or rfi_id must be provided' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    const email = db.prepare('SELECT * FROM email WHERE id = ?').get(email_id);

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    if (email.allocated) {
      return NextResponse.json(
        { error: 'Email already allocated' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      UPDATE email
      SET allocated = 1,
          engagement_id = ?,
          rfi_id = ?,
          status = 'processed',
          updated_at = ?
      WHERE id = ?
    `);

    stmt.run(engagement_id || null, rfi_id || null, now(), email_id);

    const updatedEmail = db.prepare('SELECT * FROM email WHERE id = ?').get(email_id);

    console.log('[EMAIL_ALLOCATE] Email allocated:', {
      email_id,
      engagement_id: engagement_id || null,
      rfi_id: rfi_id || null,
    });

    return NextResponse.json({
      success: true,
      email: updatedEmail,
    });

  } catch (error) {
    console.error('[EMAIL_ALLOCATE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
