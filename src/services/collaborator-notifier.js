import { list, get, update, create } from '@/engine';
import { queueEmail } from '@/engine/email-templates';
import { LOG_PREFIXES } from '@/config';

const DAY_SECONDS = 86400;
const NOTIFICATION_WINDOW_DAYS = 7;

export const notifyExpiringCollaborators = async () => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const sevenDaysFromNow = nowSeconds + (NOTIFICATION_WINDOW_DAYS * DAY_SECONDS);

  const startOfDay = Math.floor(sevenDaysFromNow / DAY_SECONDS) * DAY_SECONDS;
  const endOfDay = startOfDay + DAY_SECONDS;

  const collaborators = list('collaborator').filter(c => {
    if (!c.expires_at || c.notified_at) {
      return false;
    }

    return c.expires_at >= startOfDay && c.expires_at < endOfDay;
  });

  const results = {
    total_found: collaborators.length,
    notified: 0,
    failed: 0,
    errors: []
  };

  for (const collaborator of collaborators) {
    try {
      const review = get('review', collaborator.review_id);

      if (!review) {
        console.warn(`${LOG_PREFIXES.job} Review not found for collaborator ${collaborator.id}`);
        results.failed++;
        results.errors.push({
          collaborator_id: collaborator.id,
          reason: 'Review not found'
        });
        continue;
      }

      const expiresDate = new Date(collaborator.expires_at * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await queueEmail('collaborator_expiry_7day_warning', {
        collaborator,
        review,
        collaborator_name: collaborator.name || collaborator.email,
        review_name: review.name || review.title,
        expires_date: expiresDate,
        review_url: `${process.env.APP_URL || 'http://localhost:3000'}/reviews/${review.id}`,
        recipients: 'collaborator_email'
      });

      update('collaborator', collaborator.id, {
        notified_at: nowSeconds
      });

      create('activity_log', {
        entity_type: 'collaborator',
        entity_id: collaborator.id,
        action: 'expiry_notification_sent',
        message: `7-day expiry warning sent to ${collaborator.email}`,
        details: JSON.stringify({
          review_id: review.id,
          review_name: review.name,
          expires_at: collaborator.expires_at,
          expires_date: expiresDate,
          notification_type: '7_day_warning'
        })
      });

      results.notified++;

      console.log(`${LOG_PREFIXES.job} Expiry notification sent: Collaborator ${collaborator.id} (${collaborator.email}) for review ${review.id}`);
    } catch (error) {
      console.error(`${LOG_PREFIXES.job} Failed to notify collaborator ${collaborator.id}:`, error.message);
      results.failed++;
      results.errors.push({
        collaborator_id: collaborator.id,
        error: error.message
      });
    }
  }

  console.log(`${LOG_PREFIXES.job} Collaborator expiry notifications complete: ${results.notified} notified, ${results.failed} failed out of ${results.total_found} found`);

  return results;
};
