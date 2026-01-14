import { NextResponse } from '@/lib/next-polyfills';
import { create, list } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const { id } = params;

    const highlights = list('highlight', { review_id: id });

    return NextResponse.json({
      success: true,
      highlights
    });
  } catch (error) {
    console.error('[highlights-get] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { id } = params;
    const body = await request.json();

    const highlight = {
      review_id: id,
      comment: body.comment || '',
      color: body.color || '#B0B0B0',
      status: body.status || 'open',
      created_by: user.id,
      created_at: Math.floor(new Date().getTime() / 1000)
    };

    const highlightId = create('highlight', highlight, user);

    return NextResponse.json({
      success: true,
      highlightId,
      message: 'Highlight created'
    });
  } catch (error) {
    console.error('[highlights-post] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
