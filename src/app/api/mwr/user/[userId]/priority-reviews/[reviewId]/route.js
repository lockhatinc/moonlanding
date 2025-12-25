import { NextResponse } from 'next/server';
import { withPageAuth } from '@/lib/auth-middleware';
import { removePriorityReview } from '@/lib/mwr-core-engines';

export async function DELETE(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { userId, reviewId } = params;

    removePriorityReview(userId, reviewId);

    return NextResponse.json({
      success: true,
      message: 'Removed from priority reviews'
    });
  } catch (error) {
    console.error('[priority-review-delete] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
