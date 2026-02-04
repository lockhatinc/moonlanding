import { NextResponse } from '@/lib/next-polyfills';
import { get, list, create, remove } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { addCollaborator, getReviewCollaborators, revokeCollaborator } from '@/services/collaborator-role.service';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const { id } = params;

    const collaborators = getReviewCollaborators(id);

    return NextResponse.json({
      success: true,
      collaborators
    });
  } catch (error) {
    console.error('[collaborators-get] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id } = params;
    const body = await request.json();
    const { email, expiry_days } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    const expiresAt = expiry_days
      ? Math.floor(new Date().getTime() / 1000) + (expiry_days * 24 * 60 * 60)
      : null;

    const collaboratorId = addCollaborator(id, email, {
      expiresAt,
      createdBy: user.id
    });

    return NextResponse.json({
      success: true,
      collaboratorId,
      message: `Added ${email} as collaborator`
    });
  } catch (error) {
    console.error('[collaborators-post] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
