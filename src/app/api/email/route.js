// Email API routes
import { NextResponse } from 'next/server';
import { requireUser, can } from '@/engine';
import { getSpec } from '@/specs';
import * as gmail from '@/engine/gmail';

// Send email
export async function POST(request) {
  try {
    const user = await requireUser();

    // Only partners and managers can send emails
    if (!['partner', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { template, to, data, ...emailOptions } = body;

    let result;

    // Use template if provided
    if (template) {
      result = await gmail.sendTemplatedEmail(template, data, to);
    } else {
      // Direct email
      if (!to || !emailOptions.subject) {
        return NextResponse.json({ error: 'Missing required fields (to, subject)' }, { status: 400 });
      }
      result = await gmail.sendEmail({ to, ...emailOptions });
    }

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Send bulk emails
export async function PUT(request) {
  try {
    const user = await requireUser();

    // Only partners can send bulk emails
    if (user.role !== 'partner') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: 'emails array required' }, { status: 400 });
    }

    const results = await gmail.sendBulkEmails(emails);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
