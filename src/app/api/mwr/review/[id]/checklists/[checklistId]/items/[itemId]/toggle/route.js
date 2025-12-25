import { NextResponse } from 'next/server';
import { withPageAuth } from '@/lib/auth-middleware';
import { completeChecklistItem, getChecklistProgress } from '@/lib/mwr-core-engines';

export async function PATCH(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id, checklistId, itemId } = params;

    completeChecklistItem(checklistId, itemId);

    const progress = getChecklistProgress(checklistId);

    return NextResponse.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('[checklist-toggle] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
