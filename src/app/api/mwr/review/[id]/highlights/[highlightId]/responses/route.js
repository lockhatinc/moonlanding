import { NextResponse } from '@/lib/next-polyfills';
import { get, list, create } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction, ACTIVITY_TYPES } from '@/lib/audit-logger';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const { id, highlightId } = params;

    const highlight = get('highlight', highlightId);
    if (!highlight || highlight.review_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found' },
        { status: 404 }
      );
    }

    const responses = list('highlight_response', { highlight_id: highlightId });

    const enriched = responses.map(r => {
      const author = r.user_id ? get('users', r.user_id) : null;
      return {
        ...r,
        author_name: author ? (author.name || author.email) : 'Unknown',
        author_role: author?.role || null
      };
    });

    return NextResponse.json({
      success: true,
      responses: enriched,
      total: enriched.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id, highlightId } = params;
    const body = await request.json();

    const highlight = get('highlight', highlightId);
    if (!highlight || highlight.review_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found' },
        { status: 404 }
      );
    }

    if (!body.text || !body.text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Response text required' },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const responseData = {
      highlight_id: highlightId,
      user_id: user.id,
      text: body.text.trim(),
      created_at: timestamp,
      updated_at: timestamp
    };

    const responseId = create('highlight_response', responseData, user);

    logAction('highlight', highlightId, 'response_added', user.id, null, {
      response_id: responseId,
      review_id: id
    });

    return NextResponse.json({
      success: true,
      responseId,
      message: 'Response added'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };
