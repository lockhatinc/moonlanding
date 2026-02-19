import { NextResponse } from '@/lib/next-polyfills';
import { get, list, update } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction, ACTIVITY_TYPES } from '@/lib/audit-logger';
import { applyHighlightColor } from '@/lib/mwr-core-engines';

const RESOLUTION_LEVELS = ['resolved', 'partial_resolved', 'manager_resolved', 'partner_resolved'];

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

    const resolutionLevel = body.resolution_level || 'resolved';
    if (!RESOLUTION_LEVELS.includes(resolutionLevel)) {
      return NextResponse.json(
        { success: false, error: `Invalid resolution level. Must be one of: ${RESOLUTION_LEVELS.join(', ')}` },
        { status: 400 }
      );
    }

    const roleRequirements = {
      resolved: ['staff', 'senior', 'manager', 'partner'],
      partial_resolved: ['staff', 'senior', 'manager', 'partner'],
      manager_resolved: ['manager', 'partner'],
      partner_resolved: ['partner']
    };

    const allowedRoles = roleRequirements[resolutionLevel];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: `Role ${user.role} cannot set ${resolutionLevel}` },
        { status: 403 }
      );
    }

    const filter = { review_id: id };
    if (body.section_id) filter.section_id = body.section_id;

    const highlights = list('highlight', filter);
    const unresolvedHighlights = highlights.filter(h => h.status !== 'resolved' && h.status !== resolutionLevel);

    const timestamp = Math.floor(Date.now() / 1000);
    const succeeded = [];
    const failed = [];

    for (const highlight of unresolvedHighlights) {
      try {
        const colored = applyHighlightColor(highlight, resolutionLevel === 'resolved' ? 'resolved' : highlight.status);
        update('highlight', highlight.id, {
          status: resolutionLevel,
          resolved_by: user.id,
          resolved_at: timestamp,
          resolved_role: user.role,
          color: colored.color,
          updated_at: timestamp,
          updated_by: user.id
        }, user);
        succeeded.push(highlight.id);
      } catch (err) {
        failed.push({ id: highlight.id, error: String(err?.message || err) });
      }
    }

    logAction('review', id, ACTIVITY_TYPES.HIGHLIGHT_RESOLVE, user.id, null, {
      resolution_level: resolutionLevel,
      count: succeeded.length,
      section_id: body.section_id || null
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: unresolvedHighlights.length,
        succeeded: succeeded.length,
        failed: failed.length,
        already_resolved: highlights.length - unresolvedHighlights.length
      },
      succeeded,
      failed
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
