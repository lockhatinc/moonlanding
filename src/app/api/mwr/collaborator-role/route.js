import { NextResponse } from '@/lib/next-polyfills';
import { getDomainLoader } from '@/lib/domain-loader';
import { HTTP } from '@/config/constants';
import { get } from '@/engine';
import {
  assignCollaboratorRole,
  getCollaboratorRoleHistory,
  canAssignRole,
  patchCollaboratorRole,
  deactivateCollaboratorRole
} from '@/services/collaborator-role.service';
import { auditCollaboratorAdded, auditCollaboratorRemoved, auditPermissionModify } from '@/lib/audit-logger';
import { requireAuth } from '@/lib/auth-middleware';

function apiErr(message, status) {
  const e = new Error(message);
  e.statusCode = status;
  return e;
}

function checkDomain() {
  const domainLoader = getDomainLoader();
  if (!domainLoader.isEntityInDomain('collaborator_role', 'mwr')) {
    throw apiErr('collaborator_role not available in MWR domain', HTTP.FORBIDDEN);
  }
}

function errResponse(error) {
  const status = error.statusCode || HTTP.INTERNAL_ERROR;
  return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
}

export async function GET(request) {
  try {
    await requireAuth();
    checkDomain();
    const collaboratorId = new URL(request.url).searchParams.get('collaborator_id');
    if (!collaboratorId) return NextResponse.json({ error: 'collaborator_id parameter required' }, { status: HTTP.BAD_REQUEST });
    const roles = getCollaboratorRoleHistory(parseInt(collaboratorId));
    return NextResponse.json({ collaborator_id: parseInt(collaboratorId), roles, current_role: roles.find(r => r.is_active) || null });
  } catch (error) { return errResponse(error); }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    checkDomain();
    const body = await request.json();
    const { collaborator_id, role_type, role_description } = body;
    if (!collaborator_id || !role_type) throw apiErr('collaborator_id and role_type are required', HTTP.BAD_REQUEST);
    if (!canAssignRole(user.role, role_type)) throw apiErr(`User role ${user.role} cannot assign role ${role_type}`, HTTP.FORBIDDEN);
    const newRole = await assignCollaboratorRole(collaborator_id, role_type, user.id, role_description);
    const collaborator = get('collaborator', collaborator_id);
    if (collaborator) {
      await auditCollaboratorAdded({ user, reviewId: collaborator.review_id, collaboratorId: collaborator_id, collaboratorUserId: collaborator.user_id, permissions: { role_type }, reason: `Collaborator role assigned: ${role_type}`, metadata: { role_description, role_id: newRole.id } });
    }
    return NextResponse.json(newRole, { status: HTTP.CREATED });
  } catch (error) { return errResponse(error); }
}

export async function PATCH(request) {
  try {
    const user = await requireAuth();
    checkDomain();
    const body = await request.json();
    const { role_id, role_type, role_description } = body;
    if (!role_id) throw apiErr('role_id is required', HTTP.BAD_REQUEST);
    const result = await patchCollaboratorRole(role_id, user, { role_type, role_description });
    if (result.reassigned) {
      const collaborator = get('collaborator', result.collaborator_id);
      await auditPermissionModify({ user, entityType: 'collaborator', entityId: result.collaborator_id, oldPermissions: { role_type: result.old_role_type }, newPermissions: { role_type }, affectedUserId: collaborator?.user_id, reason: `Collaborator role changed from ${result.old_role_type} to ${role_type}`, reasonCode: 'role_change', metadata: { review_id: collaborator?.review_id } });
      return NextResponse.json(await assignCollaboratorRole(result.collaborator_id, role_type, user.id, role_description));
    }
    return NextResponse.json(result);
  } catch (error) { return errResponse(error); }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth();
    checkDomain();
    const roleId = new URL(request.url).searchParams.get('role_id');
    if (!roleId) return NextResponse.json({ error: 'role_id parameter required' }, { status: HTTP.BAD_REQUEST });
    const { updatedRole, collaborator, existingRole } = deactivateCollaboratorRole(roleId, user);
    await auditCollaboratorRemoved({ user, reviewId: collaborator?.review_id, collaboratorId: existingRole.collaborator_id, collaboratorUserId: collaborator?.user_id, permissions: { role_type: existingRole.role_type }, reason: `Collaborator role revoked: ${existingRole.role_type}`, metadata: { role_id: existingRole.id, revoked_at: Math.floor(Date.now() / 1000) } });
    return NextResponse.json({ success: true, role: updatedRole });
  } catch (error) { return errResponse(error); }
}
