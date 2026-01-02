import { NextResponse } from '@/lib/next-polyfills';
import { lucia } from '@/engine.server';
import { permissionAuditService } from '@/services';
import { cookies } from '@/lib/next-polyfills';

async function getUser() {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return null;
  const { user } = await lucia.validateSession(sessionId);
  return user;
}

function checkAuditPermission(user) {
  if (!user) {
    return { allowed: false, error: 'Unauthorized' };
  }

  if (user.role === 'partner' || user.role === 'manager') {
    return { allowed: true, scope: 'all' };
  }

  if (user.role === 'clerk') {
    return { allowed: true, scope: 'own' };
  }

  return { allowed: false, error: 'Permission denied: Clients cannot view audit trails' };
}

export async function GET(request) {
  try {
    const user = await getUser();
    const permCheck = checkAuditPermission(user);

    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const userId = searchParams.get('user_id');
    const affectedUserId = searchParams.get('affected_user_id');
    const action = searchParams.get('action');
    const reasonCode = searchParams.get('reason_code');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const format = searchParams.get('format');

    let results;

    if (search) {
      results = await permissionAuditService.searchAuditTrail(search, limit);
    } else if (startDate && endDate) {
      const start = parseInt(startDate, 10);
      const end = parseInt(endDate, 10);
      results = await permissionAuditService.getChangesByDateRange(start, end, limit);
    } else if (action) {
      results = await permissionAuditService.getChangesByAction(action, limit);
    } else if (reasonCode) {
      results = await permissionAuditService.getChangesByReasonCode(reasonCode, limit);
    } else {
      const filters = {};

      if (entityType) filters.entityType = entityType;
      if (entityId) filters.entityId = entityId;

      if (permCheck.scope === 'own') {
        filters.userId = user.id;
      } else if (userId) {
        filters.userId = userId;
      }

      if (affectedUserId) filters.affectedUserId = affectedUserId;

      filters.limit = limit;
      filters.offset = offset;

      results = await permissionAuditService.getAuditTrail(filters);
    }

    if (format === 'csv') {
      const csv = await permissionAuditService.exportToCSV({
        entityType,
        entityId,
        userId: permCheck.scope === 'own' ? user.id : userId,
        affectedUserId,
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="permission_audit.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      scope: permCheck.scope,
    });
  } catch (error) {
    console.error('[AuditAPI] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit trail', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      entityType,
      entityId,
      action,
      oldPermissions,
      newPermissions,
      reason,
      reasonCode,
      affectedUserId,
      metadata,
    } = body;

    if (!entityType || !entityId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: entityType, entityId, action' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      null;

    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

    const auditId = await permissionAuditService.logPermissionChange({
      userId: user.id,
      entityType,
      entityId,
      action,
      oldPermissions,
      newPermissions,
      reason,
      reasonCode: reasonCode || 'other',
      affectedUserId,
      ipAddress,
      sessionId,
      metadata,
    });

    return NextResponse.json({
      success: true,
      auditId,
      message: 'Permission change logged successfully',
    });
  } catch (error) {
    console.error('[AuditAPI] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to log permission change', details: error.message },
      { status: 500 }
    );
  }
}
