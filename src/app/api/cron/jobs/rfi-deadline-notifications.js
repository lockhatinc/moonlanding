import { list, update } from '@/engine';
import { calculateDaysOutstanding, checkEscalationTrigger } from '@/lib/rfi-engine';

export async function rfiDeadlineNotificationsJob() {
  console.log('[rfi-deadline-notifications] Starting daily job');

  const startTime = new Date();
  let notificationsSent = 0;
  let errorCount = 0;

  try {
    const rfis = list('rfi', { status: 0 }, { limit: 1000 });
    const notificationThresholds = [7, 3, 1, 0];

    for (const rfi of rfis) {
      try {
        // Skip if no deadline
        if (!rfi.deadline) continue;

        const deadlineDate = new Date(rfi.deadline * 1000);
        const now = new Date();
        const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

        // Check if we should send notification
        if (!notificationThresholds.includes(daysUntilDeadline)) {
          continue;
        }

        // Skip if already notified at this threshold
        const notifiedAt = rfi.deadline_notifications_sent || [];
        if (notifiedAt.includes(daysUntilDeadline)) {
          continue;
        }

        // Determine notification level
        const notificationLevel = daysUntilDeadline <= 0 ? 'critical' : daysUntilDeadline === 1 ? 'urgent' : 'warning';

        // Get recipients
        const recipients = getRFIRecipients(rfi);

        // Send notifications
        for (const recipient of recipients) {
          try {
            sendDeadlineNotification(rfi, recipient, daysUntilDeadline, notificationLevel);
            notificationsSent++;
          } catch (notificationError) {
            console.error(`[rfi-deadline-notifications] Failed to notify ${recipient}:`, notificationError.message);
            errorCount++;
          }
        }

        // Mark notification as sent
        const updatedNotifications = [...(notifiedAt || []), daysUntilDeadline];
        update('rfi', rfi.id, { deadline_notifications_sent: updatedNotifications }, { id: 'system', role: 'partner' });

      } catch (itemError) {
        errorCount++;
        console.error(`[rfi-deadline-notifications] Error processing RFI:`, itemError.message);
      }
    }

    const duration = new Date() - startTime;
    console.log(`[rfi-deadline-notifications] Job completed in ${duration}ms`);
    console.log(`[rfi-deadline-notifications] Notifications sent: ${notificationsSent}, Errors: ${errorCount}`);

    return {
      success: true,
      notificationsSent,
      failed: errorCount,
      duration
    };
  } catch (error) {
    console.error('[rfi-deadline-notifications] Fatal job error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getRFIRecipients(rfi) {
  const recipients = [];

  // Add assigned users
  if (rfi.assigned_users && Array.isArray(rfi.assigned_users)) {
    recipients.push(...rfi.assigned_users);
  }

  if (rfi.engagement_id) {
    try {
      const engagement = get('engagement', rfi.engagement_id);
      if (engagement && engagement.team_id) {
        const team = get('team', engagement.team_id);
        if (team) {
          if (team.managers && Array.isArray(team.managers)) {
            recipients.push(...team.managers);
          }
          if (team.partners && Array.isArray(team.partners)) {
            recipients.push(...team.partners);
          }
        }
      }
    } catch (e) {
      console.error(`[RFI Deadline] Failed to fetch engagement/team managers for RFI ${rfi.id}:`, e.message);
    }
  }

  return Array.from(new Set(recipients));
}

function sendDeadlineNotification(rfi, recipientUserId, daysUntilDeadline, level) {
  const notificationData = {
    type: 'rfi_deadline',
    rfi_id: rfi.id,
    days_until_deadline: daysUntilDeadline,
    notification_level: level,
    deadline_date: rfi.deadline,
    timestamp: Math.floor(new Date().getTime() / 1000)
  };

  // Template variables
  const templateVars = {
    rfi_name: rfi.name || 'RFI',
    days_remaining: Math.max(daysUntilDeadline, 0),
    deadline_date: new Date(rfi.deadline * 1000).toLocaleDateString(),
    rfi_link: `https://app.example.com/rfi/${rfi.id}`
  };

  // Send notification via notification system
  console.log(`[rfi-deadline-notifications] Notification: ${recipientUserId}, Level: ${level}, Days: ${daysUntilDeadline}`);

  // In real implementation: emit event or call notification service
  // notificationService.send(recipientUserId, notificationData, templateVars);
}

export const config = {
  name: 'rfi-deadline-notifications',
  schedule: '0 5 * * *', // 5 AM daily
  timeout: 300000, // 5 minutes
  retryMaxAttempts: 1
};
