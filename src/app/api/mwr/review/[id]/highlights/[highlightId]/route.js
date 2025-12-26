import { NextResponse } from 'next/server';
import { get, update } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { softDeleteHighlight } from '@/lib/highlight-soft-delete';

export async function PATCH(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id, highlightId } = params;
    const body = await request.json();

    const highlight = get('highlight', highlightId);
    if (!highlight) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found' },
        { status: 404 }
      );
    }

    const updates = {
      comment: body.comment !== undefined ? body.comment : highlight.comment,
      color: body.color || highlight.color,
      status: body.status || highlight.status,
      updated_at: Math.floor(new Date().getTime() / 1000),
      updated_by: user.id
    };

    update('highlight', highlightId, updates, user);

    return NextResponse.json({
      success: true,
      message: 'Highlight updated'
    });
  } catch (error) {
    console.error('[highlight-patch] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id, highlightId } = params;

    const highlight = get('highlight', highlightId);
    if (!highlight) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found' },
        { status: 404 }
      );
    }

    softDeleteHighlight(highlightId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Highlight deleted'
    });
  } catch (error) {
    console.error('[highlight-delete] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
