import { NextResponse } from '@/lib/next-polyfills';
import { getDomainLoader } from '@/lib/domain-loader';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';
import { list, get, create, update } from '@/engine';
import {
  assignCollaboratorRole,
  getCollaboratorRole,
  getCollaboratorRoleHistory,
  canAssignRole
} from '@/services/collaborator-role.service';
import { permissionService } from '@/services/permission.service';
import { auditCollaboratorAdded, auditCollaboratorRemoved, auditPermissionModify } from '@/lib/audit-logger';

async function getUserFromRequest(request) {
  return { id: 1, role: 'partner' };
}

export async function GET(request) {
  try {
    const domainLoader = getDomainLoader();
    const domain = 'mwr';

    if (!domainLoader.isEntityInDomain('collaborator_role', domain)) {
      throw new AppError(
        'collaborator_role not available in MWR domain',
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    const url = new URL(request.url);
    const collaboratorId = url.searchParams.get('collaborator_id');

    if (!collaboratorId) {
      return NextResponse.json(
        { error: 'collaborator_id parameter required' },
        { status: HTTP.BAD_REQUEST }
      );
    }

    const roles = getCollaboratorRoleHistory(parseInt(collaboratorId));

    return NextResponse.json({
      collaborator_id: parseInt(collaboratorId),
      roles: roles,
      current_role: roles.find(r => r.is_active) || null
    });
  } catch (error) {
    console.error('[API] GET /api/mwr/collaborator-role error:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP.INTERNAL_ERROR }
    );
  }
}

export async function POST(request) {
  try {
    const domainLoader = getDomainLoader();
    const domain = 'mwr';

    if (!domainLoader.isEntityInDomain('collaborator_role', domain)) {
      throw new AppError(
        'collaborator_role not available in MWR domain',
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    const user = await getUserFromRequest(request);

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', HTTP.UNAUTHORIZED);
    }

    const body = await request.json();
    const { collaborator_id, role_type, role_description } = body;

    if (!collaborator_id || !role_type) {
      throw new AppError(
        'collaborator_id and role_type are required',
        'VALIDATION_ERROR',
        HTTP.BAD_REQUEST
      );
    }

    if (!canAssignRole(user.role, role_type)) {
      throw new AppError(
        `User role ${user.role} cannot assign role ${role_type}`,
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    const newRole = await assignCollaboratorRole(
      collaborator_id,
      role_type,
      user.id,
      role_description
    );

    const collaborator = get('collaborator', collaborator_id);
    if (collaborator) {
      await auditCollaboratorAdded({
        user,
        reviewId: collaborator.review_id,
        collaboratorId: collaborator_id,
        collaboratorUserId: collaborator.user_id,
        permissions: { role_type },
        reason: `Collaborator role assigned: ${role_type}`,
        metadata: {
          role_description,
          role_id: newRole.id,
        },
      });
    }

    return NextResponse.json(newRole, { status: HTTP.CREATED });
  } catch (error) {
    console.error('[API] POST /api/mwr/collaborator-role error:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP.INTERNAL_ERROR }
    );
  }
}

export async function PATCH(request) {
  try {
    const domainLoader = getDomainLoader();
    const domain = 'mwr';

    if (!domainLoader.isEntityInDomain('collaborator_role', domain)) {
      throw new AppError(
        'collaborator_role not available in MWR domain',
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    const user = await getUserFromRequest(request);

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', HTTP.UNAUTHORIZED);
    }

    const body = await request.json();
    const { role_id, role_type, role_description } = body;

    if (!role_id) {
      throw new AppError(
        'role_id is required',
        'VALIDATION_ERROR',
        HTTP.BAD_REQUEST
      );
    }

    const existingRole = get('collaborator_role', role_id);

    if (!existingRole) {
      throw new AppError('Role not found', 'NOT_FOUND', HTTP.NOT_FOUND);
    }

    if (!existingRole.is_active) {
      throw new AppError(
        'Cannot modify inactive role',
        'VALIDATION_ERROR',
        HTTP.BAD_REQUEST
      );
    }

    if (role_type && !canAssignRole(user.role, role_type)) {
      throw new AppError(
        `User role ${user.role} cannot assign role ${role_type}`,
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    if (role_type && role_type !== existingRole.role_type) {
      const collaborator = get('collaborator', existingRole.collaborator_id);

      await auditPermissionModify({
        user,
        entityType: 'collaborator',
        entityId: existingRole.collaborator_id,
        oldPermissions: { role_type: existingRole.role_type },
        newPermissions: { role_type },
        affectedUserId: collaborator?.user_id,
        reason: `Collaborator role changed from ${existingRole.role_type} to ${role_type}`,
        reasonCode: 'role_change',
        metadata: {
          review_id: collaborator?.review_id,
          old_role_id: existingRole.id,
        },
      });

      const newRole = await assignCollaboratorRole(
        existingRole.collaborator_id,
        role_type,
        user.id,
        role_description || existingRole.role_description
      );

      return NextResponse.json(newRole);
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    const updatedRole = update('collaborator_role', role_id, {
      role_description: role_description || existingRole.role_description,
      updated_at: nowSeconds,
      updated_by: user.id
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('[API] PATCH /api/mwr/collaborator-role error:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP.INTERNAL_ERROR }
    );
  }
}

export async function DELETE(request) {
  try {
    const domainLoader = getDomainLoader();
    const domain = 'mwr';

    if (!domainLoader.isEntityInDomain('collaborator_role', domain)) {
      throw new AppError(
        'collaborator_role not available in MWR domain',
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    const user = await getUserFromRequest(request);

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', HTTP.UNAUTHORIZED);
    }

    const url = new URL(request.url);
    const roleId = url.searchParams.get('role_id');

    if (!roleId) {
      return NextResponse.json(
        { error: 'role_id parameter required' },
        { status: HTTP.BAD_REQUEST }
      );
    }

    const existingRole = get('collaborator_role', parseInt(roleId));

    if (!existingRole) {
      throw new AppError('Role not found', 'NOT_FOUND', HTTP.NOT_FOUND);
    }

    if (!existingRole.is_active) {
      throw new AppError(
        'Role already inactive',
        'VALIDATION_ERROR',
        HTTP.BAD_REQUEST
      );
    }

    if (!['partner', 'manager'].includes(user.role)) {
      throw new AppError(
        'Only partners and managers can revoke roles',
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    const updatedRole = update('collaborator_role', parseInt(roleId), {
      is_active: false,
      superseded_at: nowSeconds,
      updated_at: nowSeconds,
      updated_by: user.id
    });

    const collaborator = get('collaborator', existingRole.collaborator_id);
    if (collaborator && collaborator.primary_role_id === existingRole.id) {
      update('collaborator', existingRole.collaborator_id, {
        primary_role_id: null,
        is_manager: false,
        updated_at: nowSeconds
      });
    }

    await auditCollaboratorRemoved({
      user,
      reviewId: collaborator?.review_id,
      collaboratorId: existingRole.collaborator_id,
      collaboratorUserId: collaborator?.user_id,
      permissions: { role_type: existingRole.role_type },
      reason: `Collaborator role revoked: ${existingRole.role_type}`,
      metadata: {
        role_id: existingRole.id,
        revoked_at: nowSeconds,
      },
    });

    create('activity_log', {
      entity_type: 'collaborator_role',
      entity_id: existingRole.id,
      action: 'role_revoked',
      message: `Role ${existingRole.role_type} revoked by ${user.role}`,
      details: JSON.stringify({
        collaborator_id: existingRole.collaborator_id,
        role_type: existingRole.role_type,
        revoked_by: user.id,
        revoked_at: nowSeconds
      })
    });

    return NextResponse.json({
      success: true,
      role: updatedRole
    });
  } catch (error) {
    console.error('[API] DELETE /api/mwr/collaborator-role error:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP.INTERNAL_ERROR }
    );
  }
}
