import { NextResponse } from '@/lib/next-polyfills';
import { get, list, create, update } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction } from '@/lib/audit-logger';
import {
  calculateDaysUntilDeadline,
  getDeadlineStatus,
  shouldAlertTender,
  validateDeadlineChange
} from '@/lib/mwr-core-engines';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const { id } = params;

    const review = get('review', id);
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    const tenders = list('tender', { review_id: id });

    const enriched = tenders.map(tender => ({
      ...tender,
      days_remaining: calculateDaysUntilDeadline(tender),
      deadline_status: getDeadlineStatus(tender),
      needs_alert: shouldAlertTender(tender)
    }));

    return NextResponse.json({
      success: true,
      tenders: enriched,
      total: enriched.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id } = params;
    const body = await request.json();

    const review = get('review', id);
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    if (!body.deadline) {
      return NextResponse.json(
        { success: false, error: 'Deadline required for tender' },
        { status: 400 }
      );
    }

    const nowTs = Math.floor(Date.now() / 1000);
    const deadline = typeof body.deadline === 'number' ? body.deadline : Math.floor(new Date(body.deadline).getTime() / 1000);

    if (deadline <= nowTs) {
      return NextResponse.json(
        { success: false, error: 'Deadline must be in the future' },
        { status: 400 }
      );
    }

    const announcement = body.announcement_date
      ? (typeof body.announcement_date === 'number' ? body.announcement_date : Math.floor(new Date(body.announcement_date).getTime() / 1000))
      : null;

    if (announcement && announcement <= deadline) {
      return NextResponse.json(
        { success: false, error: 'Announcement date must be after deadline' },
        { status: 400 }
      );
    }

    const tenderData = {
      review_id: id,
      deadline,
      announcement_date: announcement,
      contact_person: body.contact_person || null,
      contact_number: body.contact_number || null,
      contact_email: body.contact_email || null,
      address: body.address || null,
      price: body.price || null,
      winning_price: body.winning_price || null,
      status: 'open',
      priority_level: body.priority_level || 'normal',
      created_by: user.id,
      created_at: nowTs,
      updated_at: nowTs
    };

    const tenderId = create('tender', tenderData, user);

    logAction('tender', tenderId, 'tender_created', user.id, null, tenderData);

    return NextResponse.json({
      success: true,
      tenderId,
      message: 'Tender created'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
