import { NextResponse } from '@/lib/next-polyfills';
import { getUser, setCurrentRequest } from '@/engine.server';
import { permissionAuditService } from '@/services';

export async function GET(request) {
  setCurrentRequest(request);
  try {
    console.log('[AuditStats] Request cookie header:', request.headers?.cookie);
    const user = await getUser();
    console.log('[AuditStats] Validated user:', user);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'partner' && user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Permission denied: Only partners and managers can view audit stats' },
        { status: 403 }
      );
    }

    const stats = await permissionAuditService.getAuditStats();
    const actionBreakdown = await permissionAuditService.getActionBreakdown();
    const reasonCodeBreakdown = await permissionAuditService.getReasonCodeBreakdown();

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        earliest_change: stats.earliest_change
          ? new Date(stats.earliest_change * 1000).toISOString()
          : null,
        latest_change: stats.latest_change
          ? new Date(stats.latest_change * 1000).toISOString()
          : null,
      },
      breakdown: {
        by_action: actionBreakdown,
        by_reason_code: reasonCodeBreakdown,
      },
    });
  } catch (error) {
    console.error('[AuditStatsAPI] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit statistics', details: error.message },
      { status: 500 }
    );
  }
}
