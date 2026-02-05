import { NextResponse } from '@/lib/next-polyfills';
import { get } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { getTransitionStatus } from '@/lib/workflow-engine';

export async function GET(request, { params }) {
  try {
    await withPageAuth('engagement', 'view');

    const { engagementId } = params;
    if (!engagementId) {
      return NextResponse.json(
        { error: 'engagementId required' },
        { status: 400 }
      );
    }

    const engagement = get('engagement', engagementId);
    if (!engagement) {
      return NextResponse.json(
        { error: 'Engagement not found' },
        { status: 404 }
      );
    }

    const status = getTransitionStatus(engagement);

    return NextResponse.json({
      inLockout: status.inLockout,
      minutesRemaining: status.minutesRemaining,
      failedGates: status.failedGates
    });
  } catch (error) {
    console.error('[engagement-transition-status-get] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};
