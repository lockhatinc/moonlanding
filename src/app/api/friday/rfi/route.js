import { NextResponse } from 'next/server';
import { list } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { getCurrentState } from '@/lib/rfi-dual-state-engine';

export async function GET(request) {
  try {
    const { user, spec } = await withPageAuth('rfi', 'list');

    const searchParams = new URL(request.url).searchParams;
    const engagementId = searchParams.get('engagement_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters = {};
    if (engagementId) filters.engagement_id = engagementId;
    if (status !== null) filters.status = parseInt(status);

    const rfis = list('rfi', filters, { limit });

    // Enrich with display states
    const enrichedRfis = rfis.map(rfi => {
      const engagement = list('engagement', { id: rfi.engagement_id }, { limit: 1 })[0];
      const state = getCurrentState(rfi, engagement?.stage || 'info_gathering');

      return {
        ...rfi,
        displayState: state,
        daysOutstanding: state.days_outstanding,
        escalationTriggered: state.escalation_triggered
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedRfis,
      count: enrichedRfis.length
    });
  } catch (error) {
    console.error('[rfi-route] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
