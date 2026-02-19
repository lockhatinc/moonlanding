import { NextResponse } from '@/lib/next-polyfills';
import { get, list } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { getColorStats } from '@/lib/mwr-core-engines';

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

    const highlights = list('highlight', { review_id: id });
    const checklists = list('checklist', { review_id: id });
    const collaborators = list('collaborator', { review_id: id });

    const colorStats = getColorStats(id);

    const highlightsByStatus = {};
    for (const h of highlights) {
      const status = h.status || 'open';
      highlightsByStatus[status] = (highlightsByStatus[status] || 0) + 1;
    }

    const highlightsByPage = {};
    for (const h of highlights) {
      const page = h.page_number || 0;
      highlightsByPage[page] = (highlightsByPage[page] || 0) + 1;
    }

    let totalItems = 0;
    let completedItems = 0;
    for (const cl of checklists) {
      const items = list('checklist_item', { checklist_id: cl.id });
      totalItems += items.length;
      completedItems += items.filter(i => i.is_done).length;
    }

    const totalHighlights = highlights.length;
    const resolvedHighlights = highlights.filter(h =>
      h.status === 'resolved' || h.status === 'manager_resolved' || h.status === 'partner_resolved'
    ).length;

    const recentActivity = highlights
      .filter(h => h.updated_at)
      .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))
      .slice(0, 10)
      .map(h => ({
        highlight_id: h.id,
        status: h.status,
        updated_at: h.updated_at,
        updated_by: h.updated_by
      }));

    return NextResponse.json({
      success: true,
      analytics: {
        highlights: {
          total: totalHighlights,
          resolved: resolvedHighlights,
          completion_rate: totalHighlights > 0
            ? Math.round((resolvedHighlights / totalHighlights) * 100) : 100,
          by_status: highlightsByStatus,
          by_page: highlightsByPage,
          color_distribution: colorStats
        },
        checklists: {
          total: checklists.length,
          items_total: totalItems,
          items_completed: completedItems,
          completion_rate: totalItems > 0
            ? Math.round((completedItems / totalItems) * 100) : 100
        },
        collaborators: {
          total: collaborators.length,
          active: collaborators.filter(c => !c.expires_at || c.expires_at > Math.floor(Date.now() / 1000)).length
        },
        recent_activity: recentActivity,
        review_age_days: review.created_at
          ? Math.floor((Date.now() / 1000 - review.created_at) / 86400) : 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
