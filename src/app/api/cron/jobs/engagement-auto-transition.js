import { list, update } from '@/engine';
import { transitionEngagement, shouldAutoTransition } from '@/lib/engagement-lifecycle-engine';

export async function engagementAutoTransitionJob() {
  console.log('[engagement-auto-transition] Starting daily job');

  const startTime = new Date();
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;

  try {
    const engagements = list('engagement', { status: 'active' }, { limit: 1000 });

    for (const engagement of engagements) {
      processedCount++;

      try {
        // Check if engagement should auto-transition
        if (!shouldAutoTransition(engagement)) {
          continue;
        }

        // Log transition attempt
        console.log(`[engagement-auto-transition] Processing engagement ${engagement.id}`);

        // Check validation gates for commencement stage
        const hasBasicInfo = !!(engagement.client_id && engagement.engagement_name);
        if (!hasBasicInfo) {
          console.warn(`[engagement-auto-transition] Engagement ${engagement.id} missing basic info, skipping`);
          continue;
        }

        // Execute auto-transition from info_gathering to commencement
        const systemUser = { id: 'system', role: 'partner' };

        try {
          transitionEngagement(engagement.id, 'commencement', systemUser, 'auto_transition_commencement_date_reached');
          successCount++;
          console.log(`[engagement-auto-transition] ✓ Transitioned ${engagement.id} to commencement`);
        } catch (transitionError) {
          // Log error but continue processing other engagements
          errorCount++;
          console.error(`[engagement-auto-transition] ✗ Failed to transition ${engagement.id}:`, transitionError.message);

          // Increment transition_attempts
          const attempts = (engagement.transition_attempts || 0) + 1;
          update('engagement', engagement.id, { transition_attempts: attempts }, systemUser);

          // Stop trying after 3 attempts
          if (attempts >= 3) {
            console.warn(`[engagement-auto-transition] Max attempts reached for ${engagement.id}, disabling auto-transition`);
            update('engagement', engagement.id, { auto_transition_enabled: false }, systemUser);
          }
        }
      } catch (itemError) {
        errorCount++;
        console.error(`[engagement-auto-transition] Error processing engagement:`, itemError.message);
      }
    }

    const duration = new Date() - startTime;
    console.log(`[engagement-auto-transition] Job completed in ${duration}ms`);
    console.log(`[engagement-auto-transition] Processed: ${processedCount}, Success: ${successCount}, Errors: ${errorCount}`);

    return {
      success: true,
      processed: processedCount,
      succeeded: successCount,
      failed: errorCount,
      duration
    };
  } catch (error) {
    console.error('[engagement-auto-transition] Fatal job error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export const config = {
  name: 'engagement-auto-transition',
  schedule: '0 4 * * *', // 4 AM daily
  timeout: 300000, // 5 minutes
  retryMaxAttempts: 2,
  retryDelay: 5000
};
