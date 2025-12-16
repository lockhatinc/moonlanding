import { NextResponse } from 'next/server';
import { requireUser } from '@/engine.server';
import * as gmail from '@/engine/gmail';

export async function POST(request) {
  try {
    const user = await requireUser();

    if (!['partner', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { template, to, data, ...emailOptions } = body;

    let result;

    if (template) {
      result = await gmail.sendTemplatedEmail(template, data, to);
    } else {
      if (!to || !emailOptions.subject) {
        return NextResponse.json({ error: 'Missing required fields (to, subject)' }, { status: 400 });
      }
      result = await gmail.sendEmail({ to, ...emailOptions });
    }

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    throw new Error(`[API Error] ${'Email send error:', error}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireUser();

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
    throw new Error(`[API Error] ${'Bulk email error:', error}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
