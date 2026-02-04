import { NextResponse } from '@/lib/next-polyfills';
import { withPageAuth } from '@/lib/auth-middleware';
import { revokeCollaborator } from '@/services/collaborator-role.service';

export async function DELETE(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id, collaboratorId } = params;

    revokeCollaborator(collaboratorId, 'manual_revoke', user.id);

    return NextResponse.json({
      success: true,
      message: 'Collaborator access revoked'
    });
  } catch (error) {
    console.error('[collaborator-delete] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
