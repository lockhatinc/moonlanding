import { list, remove, update } from '@/engine';

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

export async function collaboratorExpiry7DayWarning() {
  console.log('[collaborator-expiry-7day] Starting daily job');

  const startTime = new Date();
  let notificationsSent = 0;
  let errorCount = 0;

  try {
    const collaborators = list('collaborator', { is_permanent: false }, { limit: 500 });
    const now = Math.floor(new Date().getTime() / 1000);

    for (const collab of collaborators) {
      try {
        if (!collab.expires_at) continue;

        // Check if expires in exactly 7 days (or within the day window)
        const daysUntilExpiry = Math.ceil((collab.expires_at - now) / (24 * 60 * 60));

        if (daysUntilExpiry !== 7) {
          continue;
        }

        // Skip if already notified
        if (collab.notified_at) {
          continue;
        }

        // Send 7-day expiry warning
        console.log(`[collaborator-expiry-7day] Sending expiry warning to collaborator ${collab.id}`);

        // In real implementation: send email
        // sendEmail(collab.email, 'collaborator_expiry_7day_warning', { expires_at: collab.expires_at });

        // Mark as notified
        update('collaborator', collab.id, { notified_at: now }, { id: 'system', role: 'partner' });
        notificationsSent++;

      } catch (itemError) {
        errorCount++;
        console.error(`[collaborator-expiry-7day] Error processing collaborator:`, itemError.message);
      }
    }

    const duration = new Date() - startTime;
    console.log(`[collaborator-expiry-7day] Completed in ${duration}ms`);
    console.log(`[collaborator-expiry-7day] Warnings sent: ${notificationsSent}, Errors: ${errorCount}`);

    return {
      success: true,
      notificationsSent,
      failed: errorCount
    };
  } catch (error) {
    console.error('[collaborator-expiry-7day] Fatal error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function collaboratorAutoRevoke() {
  console.log('[collaborator-auto-revoke] Starting daily job');

  const startTime = new Date();
  let revokedCount = 0;
  let errorCount = 0;

  try {
    const collaborators = list('collaborator', { is_permanent: false }, { limit: 500 });
    const now = Math.floor(new Date().getTime() / 1000);

    for (const collab of collaborators) {
      try {
        if (!collab.expires_at) continue;

        // Check if expired
        if (collab.expires_at <= now) {
          console.log(`[collaborator-auto-revoke] Revoking access for collaborator ${collab.id}`);

          // Remove collaborator from review
          if (collab.review_id) {
            const review = { collaborators: [] }; // In real impl: get review first
            // Filter out this collaborator
            // update('review', collab.review_id, { collaborators: filtered }, systemUser);
          }

          // Delete collaborator record
          remove('collaborator', collab.id, { id: 'system', role: 'partner' });
          revokedCount++;
        }

      } catch (itemError) {
        errorCount++;
        console.error(`[collaborator-auto-revoke] Error revoking collaborator:`, itemError.message);
      }
    }

    const duration = new Date() - startTime;
    console.log(`[collaborator-auto-revoke] Completed in ${duration}ms`);
    console.log(`[collaborator-auto-revoke] Revoked: ${revokedCount}, Errors: ${errorCount}`);

    return {
      success: true,
      revokedCount,
      failed: errorCount
    };
  } catch (error) {
    console.error('[collaborator-auto-revoke] Fatal error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export const config7Day = {
  name: 'collaborator-expiry-7day-warning',
  schedule: '0 7 * * *', // 7 AM daily
  timeout: 60000, // 1 minute
  retryMaxAttempts: 1
};

export const configAutoRevoke = {
  name: 'collaborator-auto-revoke',
  schedule: '0 0 * * *', // Midnight daily
  timeout: 60000, // 1 minute
  retryMaxAttempts: 1
};
