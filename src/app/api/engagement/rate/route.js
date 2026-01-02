import { NextResponse } from '@/lib/next-polyfills';
import { getDatabase, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { ERROR_MESSAGES } from '@/config';
import { HTTP } from '@/config/api-constants';

function logActivity(db, engagementId, action, userId, metadata = {}) {
  try {
    db.prepare(`
      INSERT INTO activity_log (id, entity_type, entity_id, action, user_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID?.() || `${Date.now()}_${Math.random()}`,
      'engagement',
      engagementId,
      action,
      userId,
      JSON.stringify(metadata),
      now()
    );
  } catch (e) {
    console.error('[ENGAGEMENT_RATING] Failed to log activity:', e.message);
  }
}

export async function POST(request) {
  setCurrentRequest(request);
  const db = getDatabase();

  try {
    const user = await requireAuth();

    if (user.role !== 'client_admin') {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.permission.denied,
          message: 'Only client administrators can rate engagements'
        },
        { status: HTTP.FORBIDDEN }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format'
        },
        { status: HTTP.BAD_REQUEST }
      );
    }

    const { engagement_id, rating } = body;

    if (!engagement_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Engagement ID is required'
        },
        { status: HTTP.BAD_REQUEST }
      );
    }

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rating is required'
        },
        { status: HTTP.BAD_REQUEST }
      );
    }

    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rating must be a number between 0 and 5'
        },
        { status: HTTP.BAD_REQUEST }
      );
    }

    const engagement = db.prepare('SELECT * FROM engagement WHERE id = ?').get(engagement_id);

    if (!engagement) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.operation.notFound('Engagement')
        },
        { status: HTTP.NOT_FOUND }
      );
    }

    if (engagement.stage !== 'finalization') {
      return NextResponse.json(
        {
          success: false,
          error: 'Engagement must be in Finalization stage to submit ratings',
          stage: engagement.stage
        },
        { status: HTTP.BAD_REQUEST }
      );
    }

    if (user.client_id !== engagement.client_id) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.permission.denied,
          message: 'You can only rate engagements for your own client'
        },
        { status: HTTP.FORBIDDEN }
      );
    }

    db.prepare(`
      UPDATE engagement
      SET client_rating = ?,
          updated_by = ?,
          updated_at = ?
      WHERE id = ?
    `).run(rating, user.id, now(), engagement_id);

    logActivity(db, engagement_id, 'engagement_rated', user.id, {
      rating,
      previous_rating: engagement.client_rating,
      stage: engagement.stage
    });

    console.log('[ENGAGEMENT_RATING] Rating submitted:', {
      engagement_id,
      rating,
      user_id: user.id,
      client_id: user.client_id
    });

    return NextResponse.json({
      success: true,
      engagement_id,
      rating,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('[ENGAGEMENT_RATING] Error:', error);

    if (error.statusCode === HTTP.UNAUTHORIZED) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.auth.unauthorized
        },
        { status: HTTP.UNAUTHORIZED }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.system.error,
        details: error.message
      },
      { status: HTTP.INTERNAL_ERROR }
    );
  }
}

export async function GET(request) {
  setCurrentRequest(request);
  const db = getDatabase();

  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const engagement_id = searchParams.get('engagement_id');

    if (!engagement_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Engagement ID is required'
        },
        { status: HTTP.BAD_REQUEST }
      );
    }

    const engagement = db.prepare('SELECT id, client_rating, stage FROM engagement WHERE id = ?').get(engagement_id);

    if (!engagement) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.operation.notFound('Engagement')
        },
        { status: HTTP.NOT_FOUND }
      );
    }

    return NextResponse.json({
      success: true,
      engagement_id: engagement.id,
      rating: engagement.client_rating || 0,
      stage: engagement.stage
    });

  } catch (error) {
    console.error('[ENGAGEMENT_RATING] GET Error:', error);

    if (error.statusCode === HTTP.UNAUTHORIZED) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.auth.unauthorized
        },
        { status: HTTP.UNAUTHORIZED }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.system.error,
        details: error.message
      },
      { status: HTTP.INTERNAL_ERROR }
    );
  }
}
