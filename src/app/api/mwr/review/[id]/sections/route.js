import { NextResponse } from '@/lib/next-polyfills';
import { get, list } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';

function computeSectionResolution(highlights, sectionId) {
  const sectionHighlights = sectionId
    ? highlights.filter(h => h.section_id === sectionId)
    : highlights;

  const total = sectionHighlights.length;
  if (total === 0) return { total: 0, resolved: 0, partial: 0, manager_resolved: 0, partner_resolved: 0, open: 0, progress: 100 };

  const resolved = sectionHighlights.filter(h => h.status === 'resolved').length;
  const partial = sectionHighlights.filter(h => h.status === 'partial_resolved').length;
  const managerResolved = sectionHighlights.filter(h => h.status === 'manager_resolved').length;
  const partnerResolved = sectionHighlights.filter(h => h.status === 'partner_resolved').length;
  const open = total - resolved - partial - managerResolved - partnerResolved;

  return {
    total,
    resolved,
    partial,
    manager_resolved: managerResolved,
    partner_resolved: partnerResolved,
    open,
    progress: Math.round(((resolved + managerResolved + partnerResolved) / total) * 100)
  };
}

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

    const checklists = list('checklist', { review_id: id });
    const highlights = list('highlight', { review_id: id });
    const allItems = [];

    for (const checklist of checklists) {
      const items = list('checklist_item', { checklist_id: checklist.id });
      allItems.push(...items);
    }

    const sections = checklists.map(checklist => {
      const items = allItems.filter(i => i.checklist_id === checklist.id);
      const completedItems = items.filter(i => i.is_done);
      const resolution = computeSectionResolution(highlights, checklist.id);
      const mandatory = checklist.mandatory || checklist.required || false;
      const mandatoryResolved = mandatory ? resolution.open === 0 : true;

      return {
        id: checklist.id,
        name: checklist.name,
        review_id: id,
        mandatory,
        mandatory_resolved: mandatoryResolved,
        item_count: items.length,
        completed_items: completedItems.length,
        item_progress: items.length > 0
          ? Math.round((completedItems.length / items.length) * 100) : 100,
        resolution,
        manager_approve: checklist.manager_approve || false,
        email_checklist: checklist.email_checklist || false
      };
    });

    const overallResolution = computeSectionResolution(highlights, null);
    const mandatorySectionsBlocking = sections.filter(s => s.mandatory && !s.mandatory_resolved);

    return NextResponse.json({
      success: true,
      sections,
      summary: {
        total_sections: sections.length,
        mandatory_sections: sections.filter(s => s.mandatory).length,
        mandatory_blocking: mandatorySectionsBlocking.length,
        can_change_status: mandatorySectionsBlocking.length === 0,
        overall_resolution: overallResolution
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
