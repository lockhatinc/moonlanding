import { NextResponse } from '@/lib/next-polyfills';
import { get, update, remove } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { auditPermissionChange } from '@/lib/audit-logger';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const { permissionId } = params;

    const permission = get('permission', permissionId);
    if (!permission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    const grantedBy = permission.granted_by ? get('users', permission.granted_by) : null;
    const targetUser = permission.user_id ? get('users', permission.user_id) : null;

    return NextResponse.json({
      success: true,
      permission: {
        ...permission,
        granted_by_name: grantedBy ? (grantedBy.name || grantedBy.email) : null,
        target_user_name: targetUser ? (targetUser.name || targetUser.email) : null
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { permissionId } = params;
    const body = await request.json();

    if (!['partner', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only partners and managers can modify permissions' },
        { status: 403 }
      );
    }

    const permission = get('permission', permissionId);
    if (!permission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const updates = { updated_at: timestamp, updated_by: user.id };

    if (body.permission_type !== undefined) updates.permission_type = body.permission_type;
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at;

    const oldPerms = { permission_type: permission.permission_type };

    update('permission', permissionId, updates, user);

    await auditPermissionChange({
      user,
      entityType: permission.entity_type,
      entityId: permission.entity_id,
      action: 'modify',
      oldPermissions: oldPerms,
      newPermissions: { permission_type: updates.permission_type || permission.permission_type },
      affectedUserId: permission.user_id,
      reason: body.reason || 'Permission modified',
      reasonCode: 'permission_modify'
    });

    return NextResponse.json({ success: true, message: 'Permission updated' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { permissionId } = params;

    if (!['partner', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only partners and managers can revoke permissions' },
        { status: 403 }
      );
    }

    const permission = get('permission', permissionId);
    if (!permission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    remove('permission', permissionId, user);

    await auditPermissionChange({
      user,
      entityType: permission.entity_type,
      entityId: permission.entity_id,
      action: 'revoke',
      oldPermissions: { permission_type: permission.permission_type },
      affectedUserId: permission.user_id,
      reason: 'Permission revoked',
      reasonCode: 'permission_revoke'
    });

    return NextResponse.json({ success: true, message: 'Permission revoked' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
