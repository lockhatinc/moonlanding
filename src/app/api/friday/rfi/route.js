import { NextResponse } from '@/lib/next-polyfills';
import { list, listWithPagination } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { getCurrentState } from '@/lib/rfi-engine';
import { paginated } from '@/lib/response-formatter';
import { globalManager } from '@/lib/hot-reload/mutex';

export async function GET(request) {
  try {
    const { user, spec } = await withPageAuth('rfi', 'list');

    const searchParams = new URL(request.url).searchParams;
    const engagementId = searchParams.get('engagement_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const filters = {};
    if (engagementId) filters.engagement_id = engagementId;
    if (status !== null) filters.status = parseInt(status);

    const { items: rfis, pagination } = await listWithPagination('rfi', filters, page, pageSize);

    const enrichedRfis = await globalManager.lock('rfi-enrich', async () => {
      return rfis.map(rfi => {
        const engagement = list('engagement', { id: rfi.engagement_id }, { limit: 1 })[0];
        const state = getCurrentState(rfi, engagement?.stage || 'info_gathering');

        return {
          ...rfi,
          displayState: state,
          daysOutstanding: state.days_outstanding,
          escalationTriggered: state.escalation_triggered
        };
      });
    });

    return paginated(enrichedRfis, pagination);
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
