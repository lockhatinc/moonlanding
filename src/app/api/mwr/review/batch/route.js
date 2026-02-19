import { NextResponse } from '@/lib/next-polyfills';
import { get, update } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction, ACTIVITY_TYPES } from '@/lib/audit-logger';

const VALID_STATUSES = ['active', 'in_progress', 'review', 'completed', 'archived', 'on_hold'];

export async function POST(request) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const body = await request.json();
    const { review_ids, operation } = body;

    if (!Array.isArray(review_ids) || review_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'review_ids array required' },
        { status: 400 }
      );
    }

    if (!operation || !operation.type) {
      return NextResponse.json(
        { success: false, error: 'operation.type required' },
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

        const updates = { updated_at: timestamp, updated_by: user.id };

        switch (operation.type) {
          case 'status_change': {
            if (!operation.status || !VALID_STATUSES.includes(operation.status)) {
              failed.push({ id: reviewId, error: `Invalid status: ${operation.status}` });
              continue;
            }
            updates.status = operation.status;
            updates.previous_status = review.status;
            break;
          }
          case 'assign': {
            if (!operation.assigned_to) {
              failed.push({ id: reviewId, error: 'assigned_to required' });
              continue;
            }
            updates.assigned_to = operation.assigned_to;
            break;
          }
          case 'set_flag': {
            if (!operation.flag) {
              failed.push({ id: reviewId, error: 'flag required' });
              continue;
            }
            const currentFlags = typeof review.flags === 'string'
              ? JSON.parse(review.flags || '[]') : (review.flags || []);
            if (!currentFlags.includes(operation.flag)) {
              currentFlags.push(operation.flag);
            }
            updates.flags = JSON.stringify(currentFlags);
            break;
          }
          case 'remove_flag': {
            if (!operation.flag) {
              failed.push({ id: reviewId, error: 'flag required' });
              continue;
            }
            const flags = typeof review.flags === 'string'
              ? JSON.parse(review.flags || '[]') : (review.flags || []);
            updates.flags = JSON.stringify(flags.filter(f => f !== operation.flag));
            break;
          }
          case 'set_tag': {
            if (!operation.tag) {
              failed.push({ id: reviewId, error: 'tag required' });
              continue;
            }
            const currentTags = typeof review.tags === 'string'
              ? JSON.parse(review.tags || '[]') : (review.tags || []);
            if (!currentTags.includes(operation.tag)) {
              currentTags.push(operation.tag);
            }
            updates.tags = JSON.stringify(currentTags);
            break;
          }
          case 'remove_tag': {
            if (!operation.tag) {
              failed.push({ id: reviewId, error: 'tag required' });
              continue;
            }
            const tags = typeof review.tags === 'string'
              ? JSON.parse(review.tags || '[]') : (review.tags || []);
            updates.tags = JSON.stringify(tags.filter(t => t !== operation.tag));
            break;
          }
          default:
            failed.push({ id: reviewId, error: `Unknown operation: ${operation.type}` });
            continue;
        }

        update('review', reviewId, updates, user);

        logAction('review', reviewId, ACTIVITY_TYPES.REVIEW_UPDATE, user.id,
          { status: review.status },
          { operation: operation.type, ...updates }
        );

        succeeded.push(reviewId);
      } catch (err) {
        failed.push({ id: reviewId, error: String(err?.message || err) });
      }
    }

    return NextResponse.json({
      success: true,
      operation: operation.type,
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
