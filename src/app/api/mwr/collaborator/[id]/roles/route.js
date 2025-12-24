import { NextResponse } from 'next/server';
import { getDomainLoader } from '@/lib/domain-loader';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';
import { get } from '@/engine';
import {
  getCollaboratorRole,
  getCollaboratorRoleHistory,
  getCollaboratorRolePermissions
} from '@/services/collaborator-role.service';

async function getUserFromRequest(request) {
  return { id: 1, role: 'partner' };
}

export async function GET(request, context) {
  try {
    const domainLoader = getDomainLoader();
    const domain = 'mwr';

    if (!domainLoader.isEntityInDomain('collaborator', domain)) {
      throw new AppError(
        'collaborator not available in MWR domain',
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Collaborator ID required' },
        { status: HTTP.BAD_REQUEST }
      );
    }

    const collaboratorId = parseInt(id);

    const collaborator = get('collaborator', collaboratorId);

    if (!collaborator) {
      throw new AppError('Collaborator not found', 'NOT_FOUND', HTTP.NOT_FOUND);
    }

    const currentRole = getCollaboratorRole(collaboratorId);
    const roleHistory = getCollaboratorRoleHistory(collaboratorId);

    const permissions = currentRole
      ? getCollaboratorRolePermissions(currentRole.role_type)
      : [];

    return NextResponse.json({
      collaborator_id: collaboratorId,
      collaborator_name: collaborator.name || collaborator.email,
      current_role: currentRole,
      permissions: permissions,
      is_manager: collaborator.is_manager || false,
      role_history: roleHistory,
      total_role_changes: roleHistory.length
    });
  } catch (error) {
    console.error('[API] GET /api/mwr/collaborator/[id]/roles error:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP.INTERNAL_SERVER_ERROR }
    );
  }
}
