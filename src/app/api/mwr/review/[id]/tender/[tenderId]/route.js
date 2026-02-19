import { NextResponse } from '@/lib/next-polyfills';
import { get, update, remove } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction } from '@/lib/audit-logger';
import {
  calculateDaysUntilDeadline,
  getDeadlineStatus,
  shouldAlertTender,
  validateDeadlineChange,
  autoCloseExpiredTender
} from '@/lib/mwr-core-engines';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const { id, tenderId } = params;

    const tender = get('tender', tenderId);
    if (!tender) {
      return NextResponse.json(
        { success: false, error: 'Tender not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tender,
      days_remaining: calculateDaysUntilDeadline(tender),
      deadline_status: getDeadlineStatus(tender),
      needs_alert: shouldAlertTender(tender)
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id, tenderId } = params;
    const body = await request.json();

    const tender = get('tender', tenderId);
    if (!tender) {
      return NextResponse.json(
        { success: false, error: 'Tender not found' },
        { status: 404 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const updates = { updated_at: timestamp, updated_by: user.id };

    if (body.deadline !== undefined) {
      const newDeadline = typeof body.deadline === 'number'
        ? body.deadline : Math.floor(new Date(body.deadline).getTime() / 1000);
      try {
        validateDeadlineChange(tender, newDeadline);
      } catch (err) {
        return NextResponse.json(
          { success: false, error: String(err?.message || err) },
          { status: 400 }
        );
      }
      updates.deadline = newDeadline;
    }

    if (body.announcement_date !== undefined) {
      updates.announcement_date = body.announcement_date
        ? (typeof body.announcement_date === 'number'
          ? body.announcement_date
          : Math.floor(new Date(body.announcement_date).getTime() / 1000))
        : null;
    }

    if (body.contact_person !== undefined) updates.contact_person = body.contact_person;
    if (body.contact_number !== undefined) updates.contact_number = body.contact_number;
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email;
    if (body.address !== undefined) updates.address = body.address;
    if (body.price !== undefined) updates.price = body.price;
    if (body.winning_price !== undefined) updates.winning_price = body.winning_price;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority_level !== undefined) updates.priority_level = body.priority_level;

    update('tender', tenderId, updates, user);

    logAction('tender', tenderId, 'tender_updated', user.id, tender, updates);

    return NextResponse.json({ success: true, message: 'Tender updated' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id, tenderId } = params;

    const tender = get('tender', tenderId);
    if (!tender) {
      return NextResponse.json(
        { success: false, error: 'Tender not found' },
        { status: 404 }
      );
    }

    remove('tender', tenderId, user);

    logAction('tender', tenderId, 'tender_deleted', user.id, tender, null);

    return NextResponse.json({ success: true, message: 'Tender deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
