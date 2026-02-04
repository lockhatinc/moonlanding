import { list, update, get } from '@/engine';
import { calculateDaysOutstanding } from '@/lib/rfi-engine';

export async function rfiEscalationNotificationsJob() {
  console.log('[rfi-escalation-notifications] Starting daily job');

  const startTime = new Date();
  let escalationsProcessed = 0;
  let errorCount = 0;

  try {
    const rfis = list('rfi', { status: 0 }, { limit: 1000 });
    const escalationThresholds = [3, 7, 14]; // working days

    for (const rfi of rfis) {
      try {
        // Skip if engagement is in info_gathering
        const engagement = get('engagement', rfi.engagement_id);
        if (!engagement || engagement.stage === 'info_gathering') {
          continue;
        }

        // Calculate days outstanding
        const daysOut = calculateDaysOutstanding(rfi, engagement.stage);

        // Check if escalation threshold met
        if (!escalationThresholds.includes(daysOut)) {
          continue;
        }

        // Skip if already escalated at this threshold
        const escalatedAt = rfi.escalation_notifications_sent || [];
        if (escalatedAt.includes(daysOut)) {
          continue;
        }

        // Determine escalation severity
        const severity = daysOut >= 14 ? 'critical' : daysOut >= 7 ? 'high' : 'medium';

        // Get escalation recipients (managers, partners, RFI assignees)
        const recipients = getEscalationRecipients(engagement, rfi);

        // Send escalation notifications
        for (const recipient of recipients) {
          try {
            sendEscalationNotification(rfi, recipient, daysOut, severity);
            escalationsProcessed++;
          } catch (notificationError) {
            console.error(`[rfi-escalation-notifications] Failed to notify ${recipient}:`, notificationError.message);
            errorCount++;
          }
        }

        // Mark escalation as sent
        const updatedEscalations = [...(escalatedAt || []), daysOut];
        update('rfi', rfi.id, { escalation_notifications_sent: updatedEscalations }, { id: 'system', role: 'partner' });

        console.log(`[rfi-escalation-notifications] Escalated RFI ${rfi.id}, days: ${daysOut}, severity: ${severity}`);

      } catch (itemError) {
        errorCount++;
        console.error(`[rfi-escalation-notifications] Error processing RFI:`, itemError.message);
      }
    }

    const duration = new Date() - startTime;
    console.log(`[rfi-escalation-notifications] Job completed in ${duration}ms`);
    console.log(`[rfi-escalation-notifications] Escalations processed: ${escalationsProcessed}, Errors: ${errorCount}`);

    return {
      success: true,
      escalationsProcessed,
      failed: errorCount,
      duration
    };
  } catch (error) {
    console.error('[rfi-escalation-notifications] Fatal job error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getEscalationRecipients(engagement, rfi) {
  const recipients = [];

  // Add engagement managers/partners
  if (engagement.assigned_users && Array.isArray(engagement.assigned_users)) {
    recipients.push(...engagement.assigned_users);
  }

  // Add RFI assignees
  if (rfi.assigned_users && Array.isArray(rfi.assigned_users)) {
    recipients.push(...rfi.assigned_users);
  }

  return Array.from(new Set(recipients)); // Deduplicate
}

function sendEscalationNotification(rfi, recipientUserId, daysOutstanding, severity) {
  const notificationData = {
    type: 'rfi_escalation',
    rfi_id: rfi.id,
    days_outstanding: daysOutstanding,
    severity,
    timestamp: Math.floor(new Date().getTime() / 1000)
  };

  const templateVars = {
    rfi_name: rfi.name || 'RFI',
    days_outstanding: daysOutstanding,
    severity_label: severity.toUpperCase(),
    rfi_link: `https://app.example.com/rfi/${rfi.id}`
  };

  console.log(`[rfi-escalation-notifications] Notification: ${recipientUserId}, Severity: ${severity}, Days: ${daysOutstanding}`);

  // In real implementation: call notification service
  // notificationService.send(recipientUserId, notificationData, templateVars);
}

export const config = {
  name: 'rfi-escalation-notifications',
  schedule: '0 5 * * *', // 5 AM daily
  timeout: 300000, // 5 minutes
  retryMaxAttempts: 1
};
