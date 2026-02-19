import { NextResponse } from '@/lib/next-polyfills';
import { get, update, remove } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction } from '@/lib/audit-logger';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const { responseId } = params;

    const response = get('highlight_response', responseId);
    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      );
    }

    const author = response.user_id ? get('users', response.user_id) : null;

    return NextResponse.json({
      success: true,
      response: {
        ...response,
        author_name: author ? (author.name || author.email) : 'Unknown',
        author_role: author?.role || null
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
    const { id, highlightId, responseId } = params;
    const body = await request.json();

    const response = get('highlight_response', responseId);
    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      );
    }

    if (response.user_id !== user.id && user.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Can only edit own responses' },
        { status: 403 }
      );
    }

    const updates = {};
    if (body.text !== undefined) updates.text = body.text.trim();
    updates.updated_at = Math.floor(Date.now() / 1000);

    update('highlight_response', responseId, updates, user);

    return NextResponse.json({ success: true, message: 'Response updated' });
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
    const { id, highlightId, responseId } = params;

    const response = get('highlight_response', responseId);
    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      );
    }

    if (response.user_id !== user.id && user.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Can only delete own responses' },
        { status: 403 }
      );
    }

    remove('highlight_response', responseId, user);

    logAction('highlight', highlightId, 'response_deleted', user.id, response, null);

    return NextResponse.json({ success: true, message: 'Response deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
