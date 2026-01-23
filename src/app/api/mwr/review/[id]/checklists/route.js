import { NextResponse } from '@/lib/next-polyfills';
import { list, create, get } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';

export async function GET(request, context) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const reviewId = context.params?.id;

    if (!reviewId) {
      return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 });
    }

    const review = get('review', reviewId);
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const checklists = list('checklist', { review_id: reviewId });

    return NextResponse.json({ success: true, checklists });
  } catch (error) {
    console.error('[mwr-checklists-get] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request, context) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const reviewId = context.params?.id;

    if (!reviewId) {
      return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 });
    }

    const review = get('review', reviewId);
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const body = request.body || {};
    const checklistData = {
      review_id: reviewId,
      name: body.name || 'Untitled Checklist',
      section_items: JSON.stringify(body.items || []),
      email_checklist: body.email_checklist ? 1 : 0
    };

    const checklist = create('checklist', checklistData, user);
    return NextResponse.json({ success: true, checklist, message: 'Checklist created' });
  } catch (error) {
    console.error('[mwr-checklists] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
