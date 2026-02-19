import { NextResponse } from '@/lib/next-polyfills';
import { get, list, update } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction, ACTIVITY_TYPES } from '@/lib/audit-logger';

export async function GET(request) {
  try {
    const { user } = await withPageAuth('review', 'list');
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    const archived = list('review', { status: 'archived' });
    const offset = (page - 1) * pageSize;
    const paged = archived.slice(offset, offset + pageSize);

    return NextResponse.json({
      success: true,
      reviews: paged,
      pagination: {
        page,
        pageSize,
        total: archived.length,
        totalPages: Math.ceil(archived.length / pageSize)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function POST(request) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const body = await request.json();
    const { review_ids, action } = body;

    if (!Array.isArray(review_ids) || review_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'review_ids array required' },
        { status: 400 }
      );
    }

    const validActions = ['archive', 'unarchive'];
    const archiveAction = action || 'archive';
    if (!validActions.includes(archiveAction)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const succeeded = [];
    const failed = [];

    for (const reviewId of review_ids) {
      try {
        const review = get('review', reviewId);
        if (!review) {
          failed.push({ id: reviewId, error: 'Review not found' });
          continue;
        }

        if (archiveAction === 'archive' && review.status === 'archived') {
          failed.push({ id: reviewId, error: 'Already archived' });
          continue;
        }
        if (archiveAction === 'unarchive' && review.status !== 'archived') {
          failed.push({ id: reviewId, error: 'Not archived' });
          continue;
        }

        const newStatus = archiveAction === 'archive' ? 'archived' : 'active';
        const previousStatus = review.status;

        update('review', reviewId, {
          status: newStatus,
          previous_status: previousStatus,
          archived_at: archiveAction === 'archive' ? timestamp : null,
          archived_by: archiveAction === 'archive' ? user.id : null,
          updated_at: timestamp,
          updated_by: user.id
        }, user);

        logAction('review', reviewId, ACTIVITY_TYPES.REVIEW_ARCHIVE, user.id,
          { status: previousStatus },
          { status: newStatus }
        );

        succeeded.push(reviewId);
      } catch (err) {
        failed.push({ id: reviewId, error: String(err?.message || err) });
      }
    }

    return NextResponse.json({
      success: true,
      action: archiveAction,
      summary: {
        total: review_ids.length,
        succeeded: succeeded.length,
        failed: failed.length
      },
      succeeded,
      failed
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
