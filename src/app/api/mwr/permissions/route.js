import { NextResponse } from '@/lib/next-polyfills';
import { list, create, get } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction } from '@/lib/audit-logger';
import { auditPermissionChange } from '@/lib/audit-logger';

export async function GET(request) {
  try {
    const { user } = await withPageAuth('review', 'list');
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entity_type');
    const entityId = url.searchParams.get('entity_id');
    const userId = url.searchParams.get('user_id');

    const filter = {};
    if (entityType) filter.entity_type = entityType;
    if (entityId) filter.entity_id = entityId;
    if (userId) filter.user_id = userId;

    const permissions = list('permission', filter);

    return NextResponse.json({
      success: true,
      permissions,
      total: permissions.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function POST(request) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const body = await request.json();

    if (!body.entity_type || !body.entity_id || !body.user_id || !body.permission_type) {
      return NextResponse.json(
        { success: false, error: 'entity_type, entity_id, user_id, and permission_type required' },
        { status: 400 }
      );
    }

    if (!['partner', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only partners and managers can grant permissions' },
        { status: 403 }
      );
    }

    const existing = list('permission', {
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      user_id: body.user_id,
      permission_type: body.permission_type
    });

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Permission already exists' },
        { status: 409 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const permData = {
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      user_id: body.user_id,
      permission_type: body.permission_type,
      granted_by: user.id,
      granted_at: timestamp,
      expires_at: body.expires_at || null,
      created_at: timestamp,
      updated_at: timestamp
    };

    const permId = create('permission', permData, user);

    await auditPermissionChange({
      user,
      entityType: body.entity_type,
      entityId: body.entity_id,
      action: 'grant',
      newPermissions: { permission_type: body.permission_type },
      affectedUserId: body.user_id,
      reason: body.reason || 'Permission granted',
      reasonCode: 'permission_grant',
      metadata: { permission_id: permId }
    });

    return NextResponse.json({
      success: true,
      permissionId: permId,
      message: 'Permission granted'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
