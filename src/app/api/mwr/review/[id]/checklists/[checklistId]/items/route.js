import { NextResponse } from '@/lib/next-polyfills';
import { get, update } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { addChecklistItem, completeChecklistItem } from '@/lib/mwr-core-engines';

export async function POST(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id, checklistId } = params;
    const body = await request.json();

    const item = addChecklistItem(checklistId, {
      text: body.text,
      created_by: user.id
    });

    return NextResponse.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('[checklist-items-post] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
