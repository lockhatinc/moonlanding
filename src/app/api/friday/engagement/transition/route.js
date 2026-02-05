import { NextResponse } from '@/lib/next-polyfills';
import { get } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { transition, getAvailableTransitions, validateTransition } from '@/lib/workflow-engine';

export async function GET(request) {
  try {
    const { user } = await withPageAuth('engagement', 'view');

    const searchParams = new URL(request.url).searchParams;
    const engagementId = searchParams.get('engagement_id');

    if (!engagementId) {
      return NextResponse.json(
        { success: false, error: 'engagement_id required' },
        { status: 400 }
      );
    }

    const engagement = get('engagement', engagementId);
    if (!engagement) {
      return NextResponse.json(
        { success: false, error: 'Engagement not found' },
        { status: 404 }
      );
    }

    const availableTransitions = getAvailableTransitions('engagement_lifecycle', engagement.stage, user, engagement);

    return NextResponse.json({
      success: true,
      currentStage: engagement.stage,
      availableTransitions,
      lastTransitionAt: engagement.last_transition_at,
      transitionAttempts: engagement.transition_attempts || 0
    });
  } catch (error) {
    console.error('[engagement-transition-get] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(request) {
  try {
    const { user } = await withPageAuth('engagement', 'edit');

    const body = await request.json();
    const { engagementId, toStage, reason } = body;

    if (!engagementId || !toStage) {
      return NextResponse.json(
        { success: false, error: 'engagementId and toStage required' },
        { status: 400 }
      );
    }

    const engagement = get('engagement', engagementId);
    if (!engagement) {
      return NextResponse.json(
        { success: false, error: 'Engagement not found' },
        { status: 404 }
      );
    }

    try {
      validateTransition('engagement_lifecycle', engagement.stage, toStage, user);

      const result = transition('engagement', engagementId, 'engagement_lifecycle', toStage, user, reason || '');

      return NextResponse.json({
        success: true,
        transition: result,
        message: `Successfully transitioned from ${result.from} to ${result.to}`
      });
    } catch (validationError) {
      return NextResponse.json(
        { success: false, error: validationError.message },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error('[engagement-transition-post] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
