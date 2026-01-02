import { NextResponse } from '@/lib/next-polyfills';
import { lucia } from '@/engine.server';
import { auditDashboard } from '@/lib/audit-dashboard';
import { cookies } from '@/lib/next-polyfills';

async function getUser() {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return null;
  const { user } = await lucia.validateSession(sessionId);
  return user;
}

function checkDashboardPermission(user) {
  if (!user) {
    return { allowed: false, error: 'Unauthorized' };
  }

  if (user.role === 'partner' || user.role === 'manager') {
    return { allowed: true };
  }

  return { allowed: false, error: 'Permission denied: Only partners and managers can access audit dashboard' };
}

export async function GET(request) {
  try {
    const user = await getUser();
    const permCheck = checkDashboardPermission(user);

    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'summary';
    const days = parseInt(searchParams.get('days') || '30', 10);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const userId = searchParams.get('user_id');
    const affectedUserId = searchParams.get('affected_user_id');
    const searchTerm = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let data;

    switch (view) {
      case 'summary':
        data = await auditDashboard.generateSummaryReport(days);
        break;

      case 'recent':
        data = await auditDashboard.getRecentActivity(days, limit);
        break;

      case 'user':
        if (!userId) {
          return NextResponse.json({ error: 'user_id required for user view' }, { status: 400 });
        }
        data = await auditDashboard.getUserActivity(userId, limit);
        break;

      case 'entity':
        if (!entityType || !entityId) {
          return NextResponse.json(
            { error: 'entity_type and entity_id required for entity view' },
            { status: 400 }
          );
        }
        data = await auditDashboard.getEntityHistory(entityType, entityId, limit);
        break;

      case 'affected':
        if (!affectedUserId) {
          return NextResponse.json(
            { error: 'affected_user_id required for affected view' },
            { status: 400 }
          );
        }
        data = await auditDashboard.getAffectedUserChanges(affectedUserId, limit);
        break;

      case 'actions':
        data = await auditDashboard.getActionSummary();
        break;

      case 'collaborators':
        if (!entityId) {
          return NextResponse.json(
            { error: 'entity_id (review_id) required for collaborators view' },
            { status: 400 }
          );
        }
        data = await auditDashboard.getCollaboratorChanges(entityId, limit);
        break;

      case 'roles':
        data = await auditDashboard.getRoleChangeHistory(limit);
        break;

      case 'lifecycle':
        if (!entityType) {
          return NextResponse.json(
            { error: 'entity_type required for lifecycle view' },
            { status: 400 }
          );
        }
        data = await auditDashboard.getLifecycleTransitionAudits(entityType, limit);
        break;

      case 'search':
        if (!searchTerm) {
          return NextResponse.json({ error: 'search parameter required' }, { status: 400 });
        }
        data = await auditDashboard.searchAudits(searchTerm, limit);
        break;

      case 'compliance':
        const startDate = parseInt(searchParams.get('start_date') || '0', 10);
        const endDate = parseInt(searchParams.get('end_date') || Math.floor(Date.now() / 1000).toString(), 10);

        if (!startDate) {
          return NextResponse.json({ error: 'start_date required for compliance view' }, { status: 400 });
        }

        data = await auditDashboard.getComplianceReport(startDate, endDate);
        break;

      case 'anomalous':
        const threshold = parseInt(searchParams.get('threshold') || '10', 10);
        data = await auditDashboard.getAnomalousActivity(threshold);
        break;

      default:
        return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      view,
      data,
    });
  } catch (error) {
    console.error('[AuditDashboardAPI] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit dashboard data', details: error.message },
      { status: 500 }
    );
  }
}
