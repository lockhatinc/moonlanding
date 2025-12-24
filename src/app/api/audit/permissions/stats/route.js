import { NextResponse } from 'next/server';
import { lucia } from '@/engine.server';
import { permissionAuditService } from '@/services';
import { cookies } from 'next/headers';

async function getUser() {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return null;
  const { user } = await lucia.validateSession(sessionId);
  return user;
}

export async function GET() {
  try {
    const user = await getUser();

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
