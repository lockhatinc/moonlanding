import { NextResponse } from 'next/server';
import { get } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { calculateDaysUntilDeadline, getDeadlineStatus } from '@/lib/mwr-core-engines';

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

    const daysRemaining = calculateDaysUntilDeadline(tender);
    const status = getDeadlineStatus(tender);

    return NextResponse.json({
      success: true,
      tender,
      days_remaining: daysRemaining,
      status
    });
  } catch (error) {
    console.error('[tender-get] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
