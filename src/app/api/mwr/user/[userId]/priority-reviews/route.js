import { NextResponse } from '@/lib/next-polyfills';
import { list } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { getPriorityReviews, addPriorityReview } from '@/lib/mwr-core-engines';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'list');
    const { userId } = params;

    const priorityReviewIds = getPriorityReviews(userId);
    const reviews = priorityReviewIds.map(id => {
      const review = list('review', { id }, { limit: 1 })[0];
      return review;
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('[priority-reviews-get] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { userId } = params;
    const body = await request.json();

    addPriorityReview(userId, body.review_id);

    return NextResponse.json({
      success: true,
      message: 'Added to priority reviews'
    });
  } catch (error) {
    console.error('[priority-reviews-post] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
