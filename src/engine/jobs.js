// Scheduled Jobs - Automated background tasks
// Implements jobs from MWR and Friday systems

import { list, get, update, create, remove } from '../engine';
import { recreateEngagement } from './recreation';
import { queueEmail, sendQueuedEmails, generateChecklistPdf } from './email-templates';
import { checkAutoTransition } from './triggers';
import { exportDatabase } from './backup';

// === JOB DEFINITIONS ===

/**
 * All scheduled jobs with their configurations
 * Schedule format: cron expression (minute hour day month weekday)
 */
export const scheduledJobs = {
  // === DAILY JOBS ===

  /**
   * Daily at 2AM - Backup database
   * From MWR: pubsub_dailyBackup
   * From Friday: daily-backup
   */
  daily_backup: {
    schedule: '0 2 * * *',
    description: 'Export database to backup storage',
    handler: async () => {
      console.log('[JOB] Starting daily backup...');
      await exportDatabase();
      console.log('[JOB] Daily backup completed');
    },
  },

  /**
   * Daily at 3AM - Sync users from Google Workspace
   * From MWR: pubSub_dailyUserSync
   * From Friday: daily-user-sync
   */
  daily_user_sync: {
    schedule: '0 3 * * *',
    description: 'Sync users from Google Workspace directory',
    handler: async () => {
      console.log('[JOB] Starting user sync...');
      await syncUsersFromWorkspace();
      console.log('[JOB] User sync completed');
    },
  },

  /**
   * Daily at 4AM - Process engagement stage transitions
   * From Friday: daily-engagement-check
   * - Auto-transition when commencement_date is reached
   */
  daily_engagement_check: {
    schedule: '0 4 * * *',
    description: 'Auto-transition engagements when commencement_date is reached',
    handler: async () => {
      console.log('[JOB] Starting engagement check...');
      await processEngagementTransitions();
      console.log('[JOB] Engagement check completed');
    },
  },

  /**
   * Daily at 5AM - Send RFI deadline notifications
   * From Friday: daily-rfi-notifications
   */
  daily_rfi_notifications: {
    schedule: '0 5 * * *',
    description: 'Notify about RFIs approaching deadline',
    config: {
      days_before: [7, 3, 1, 0], // Send reminders at these intervals
    },
    handler: async (config) => {
      console.log('[JOB] Starting RFI notifications...');
      await sendRfiDeadlineNotifications(config.days_before);
      console.log('[JOB] RFI notifications completed');
    },
  },

  /**
   * Daily at 6AM - Consolidate and send manager/clerk notifications
   * From Friday: daily-manager-clerk-notifications
   */
  daily_manager_clerk_notifications: {
    schedule: '0 6 * * *',
    description: 'Send daily digest to managers and clerks',
    handler: async () => {
      console.log('[JOB] Starting manager/clerk notifications...');
      await sendConsolidatedNotifications();
      console.log('[JOB] Manager/clerk notifications completed');
    },
  },

  /**
   * Daily at 9AM - Tender deadline notifications
   * From MWR: checkTenderReviewNotificationsDue
   */
  daily_tender_notifications: {
    schedule: '0 9 * * *',
    description: 'Notify 7 days before tender deadline',
    handler: async () => {
      console.log('[JOB] Starting tender notifications...');
      await checkTenderDeadlines();
      console.log('[JOB] Tender notifications completed');
    },
  },

  /**
   * Daily at 10AM - Mark missed tender deadlines
   * From MWR: checkTenderReviewsMissedDeadline
   */
  daily_tender_missed: {
    schedule: '0 10 * * *',
    description: 'Set "Missed" flag for overdue tenders',
    handler: async () => {
      console.log('[JOB] Starting tender missed check...');
      await markMissedTenderDeadlines();
      console.log('[JOB] Tender missed check completed');
    },
  },

  /**
   * Daily at midnight - Remove expired temporary collaborators
   * From MWR: pubSub_temporaryReviewAccessScheduler
   */
  daily_temp_access_cleanup: {
    schedule: '0 0 * * *',
    description: 'Remove temporary collaborators past expiry date',
    handler: async () => {
      console.log('[JOB] Starting temp access cleanup...');
      await removeExpiredCollaborators();
      console.log('[JOB] Temp access cleanup completed');
    },
  },

  // === WEEKLY JOBS ===

  /**
   * Weekly on Monday at 8AM - Send checklist PDF reports
   * From MWR: pubSub_generateChecklistPDFEmails
   */
  weekly_checklist_pdfs: {
    schedule: '0 8 * * 1',
    description: 'Generate and email weekly checklist PDF reports',
    handler: async () => {
      console.log('[JOB] Starting weekly checklist PDFs...');
      await generateWeeklyChecklistPdfs();
      console.log('[JOB] Weekly checklist PDFs completed');
    },
  },

  /**
   * Weekly on Monday at 9AM - Client engagement summary emails
   * From Friday: weekly-client-engagement-emails
   */
  weekly_client_emails: {
    schedule: '0 9 * * 1',
    description: 'Send weekly engagement summaries to clients',
    config: {
      include_individual: true,
      include_admin_master: true,
    },
    handler: async (config) => {
      console.log('[JOB] Starting weekly client emails...');
      await sendWeeklyClientEmails(config);
      console.log('[JOB] Weekly client emails completed');
    },
  },

  // === PERIODIC JOBS ===

  /**
   * Yearly on Jan 1st - Queue yearly engagement recreations
   * From Friday: yearly-engagement-creation
   */
  yearly_engagement_recreation: {
    schedule: '0 0 1 1 *',
    description: 'Create new engagements for yearly repeat_interval',
    handler: async () => {
      console.log('[JOB] Starting yearly engagement recreation...');
      await queueEngagementRecreations('yearly');
      console.log('[JOB] Yearly engagement recreation completed');
    },
  },

  /**
   * Monthly on 1st - Queue monthly engagement recreations
   * From Friday: monthly-engagement-creation
   */
  monthly_engagement_recreation: {
    schedule: '0 0 1 * *',
    description: 'Create new engagements for monthly repeat_interval',
    handler: async () => {
      console.log('[JOB] Starting monthly engagement recreation...');
      await queueEngagementRecreations('monthly');
      console.log('[JOB] Monthly engagement recreation completed');
    },
  },

  /**
   * Every hour - Process email queue
   * From Friday: email-sending
   */
  hourly_email_processing: {
    schedule: '0 * * * *',
    description: 'Process pending email notifications',
    handler: async () => {
      await sendQueuedEmails();
    },
  },
};

// === JOB IMPLEMENTATIONS ===

/**
 * Sync users from Google Workspace
 * From MWR/Friday: Calls Google Apps Script to get user list
 */
async function syncUsersFromWorkspace() {
  const scriptUrl = process.env.USER_SYNC_SCRIPT_URL;
  const syncKey = process.env.USER_SYNC_KEY;

  if (!scriptUrl || !syncKey) {
    console.log('[JOB] User sync skipped: Missing configuration');
    return;
  }

  try {
    const response = await fetch(`${scriptUrl}?key=${syncKey}`);
    const workspaceUsers = await response.json();

    const existingUsers = list('user', { type: 'auditor' });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    // Add new users
    for (const wsUser of workspaceUsers) {
      const email = wsUser.email.trim().toLowerCase();
      if (!existingEmails.has(email)) {
        create('user', {
          email,
          name: wsUser.name,
          avatar: wsUser.photo,
          type: 'auditor',
          role: 'clerk', // Default role
          auth_provider: 'google',
          status: 'active',
        });
        console.log(`[JOB] Added new user: ${email}`);
      }
    }

    // Mark removed users as inactive
    const workspaceEmails = new Set(workspaceUsers.map(u => u.email.trim().toLowerCase()));
    for (const user of existingUsers) {
      if (!workspaceEmails.has(user.email.toLowerCase()) && user.status === 'active') {
        update('user', user.id, { status: 'inactive' });
        console.log(`[JOB] Deactivated user: ${user.email}`);
      }
    }
  } catch (error) {
    console.error('[JOB] User sync error:', error.message);
  }
}

/**
 * Process engagement auto-transitions
 * From Friday: Check if engagements should auto-transition based on dates
 */
async function processEngagementTransitions() {
  const engagements = list('engagement', {
    stage: 'info_gathering',
    status: 'active',
  });

  const now = Math.floor(Date.now() / 1000);

  for (const engagement of engagements) {
    if (engagement.commencement_date && engagement.commencement_date <= now) {
      try {
        update('engagement', engagement.id, { stage: 'commencement' });
        console.log(`[JOB] Auto-transitioned engagement ${engagement.id} to commencement`);

        create('activity_log', {
          entity_type: 'engagement',
          entity_id: engagement.id,
          action: 'stage_change',
          message: 'Auto-transitioned to commencement (date reached)',
        });
      } catch (error) {
        console.error(`[JOB] Failed to transition engagement ${engagement.id}:`, error.message);
      }
    }
  }
}

/**
 * Send RFI deadline notifications
 * From Friday: Notify about RFIs approaching deadline
 */
async function sendRfiDeadlineNotifications(daysBefore = [7, 3, 1, 0]) {
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;

  for (const days of daysBefore) {
    const targetDate = now + (days * day);
    const startOfDay = Math.floor(targetDate / day) * day;
    const endOfDay = startOfDay + day;

    // Find RFIs with deadline in this range that aren't completed
    const allRfis = list('rfi');
    const matchingRfis = allRfis.filter(rfi =>
      rfi.deadline &&
      rfi.deadline >= startOfDay &&
      rfi.deadline < endOfDay &&
      rfi.status !== 1 &&
      rfi.client_status !== 'completed'
    );

    for (const rfi of matchingRfis) {
      await queueEmail('rfi_deadline', {
        rfi,
        daysUntil: days,
        recipients: 'assigned_users',
      });
    }
  }
}

/**
 * Send consolidated notifications to managers/clerks
 * From Friday: daily-manager-clerk-notifications
 */
async function sendConsolidatedNotifications() {
  // Get pending notifications that need to be consolidated
  const pendingNotifications = list('notification', {
    status: 'pending',
  });

  if (pendingNotifications.length === 0) return;

  // Group by recipient
  const byRecipient = {};
  for (const notif of pendingNotifications) {
    if (!byRecipient[notif.recipient_id]) {
      byRecipient[notif.recipient_id] = [];
    }
    byRecipient[notif.recipient_id].push(notif);
  }

  // Send consolidated email to each recipient
  for (const [userId, notifications] of Object.entries(byRecipient)) {
    const user = get('user', userId);
    if (!user || user.status !== 'active') continue;

    await queueEmail('daily_digest', {
      user,
      notifications,
      recipients: 'user',
    });

    // Mark notifications as sent
    for (const notif of notifications) {
      update('notification', notif.id, {
        status: 'sent',
        sent_at: Math.floor(Date.now() / 1000),
      });
    }
  }
}

/**
 * Check tender deadlines and send notifications
 * From MWR: checkTenderReviewNotificationsDue
 */
async function checkTenderDeadlines() {
  const now = Math.floor(Date.now() / 1000);
  const sevenDays = 7 * 24 * 60 * 60;
  const targetDate = now + sevenDays;

  const reviews = list('review', { is_tender: true, status: 'open' });

  for (const review of reviews) {
    if (review.deadline) {
      const deadline = review.deadline;
      const daysUntil = Math.floor((deadline - now) / (24 * 60 * 60));

      if (daysUntil === 7 || daysUntil === 0) {
        await queueEmail(daysUntil === 0 ? 'tender_deadline_today' : 'tender_deadline_7days', {
          review,
          daysUntil,
          recipients: 'team_partners',
        });
      }
    }
  }
}

/**
 * Mark missed tender deadlines
 * From MWR: checkTenderReviewsMissedDeadline
 */
async function markMissedTenderDeadlines() {
  const now = Math.floor(Date.now() / 1000);
  const reviews = list('review', { is_tender: true, status: 'open' });

  for (const review of reviews) {
    if (review.deadline && review.deadline < now) {
      // Get current flags
      const flags = JSON.parse(review.tender_flags || '[]');

      // Add "Missed" flag if not already present
      if (!flags.includes('missed')) {
        flags.push('missed');
        update('review', review.id, { tender_flags: JSON.stringify(flags) });
        console.log(`[JOB] Marked tender ${review.id} as missed`);
      }
    }
  }
}

/**
 * Remove expired temporary collaborators
 * From MWR: pubSub_temporaryReviewAccessScheduler
 */
async function removeExpiredCollaborators() {
  const now = Math.floor(Date.now() / 1000);
  const collaborators = list('collaborator', { type: 'temporary' });

  for (const collab of collaborators) {
    if (collab.expires_at && collab.expires_at < now) {
      remove('collaborator', collab.id);
      console.log(`[JOB] Removed expired collaborator ${collab.id}`);
    }
  }
}

/**
 * Generate weekly checklist PDFs
 * From MWR: pubSub_generateChecklistPDFEmails
 */
async function generateWeeklyChecklistPdfs() {
  const partners = list('user', { role: 'partner', status: 'active' });

  for (const partner of partners) {
    try {
      const pdfUrl = await generateChecklistPdf(partner);
      if (pdfUrl) {
        await queueEmail('weekly_checklist_pdf', {
          user: partner,
          pdfUrl,
          date: new Date().toISOString().split('T')[0],
          recipients: 'user',
        });
      }
    } catch (error) {
      console.error(`[JOB] Failed to generate checklist PDF for ${partner.email}:`, error.message);
    }
  }
}

/**
 * Send weekly client engagement emails
 * From Friday: weekly-client-engagement-emails
 */
async function sendWeeklyClientEmails(config) {
  const clients = list('client', { status: 'active' });

  for (const client of clients) {
    const engagements = list('engagement', { client_id: client.id, status: 'active' });
    if (engagements.length === 0) continue;

    // Get client users
    const clientUsers = list('client_user', { client_id: client.id, status: 'active' });

    for (const clientUser of clientUsers) {
      const user = get('user', clientUser.user_id);
      if (!user) continue;

      // Individual email for regular users
      if (config.include_individual) {
        await queueEmail('weekly_client_engagement', {
          client,
          user,
          engagements,
          recipients: 'client_user',
        });
      }

      // Master email for admin users
      if (config.include_admin_master && clientUser.role === 'admin') {
        await queueEmail('weekly_client_master', {
          client,
          user,
          engagements,
          recipients: 'client_admin',
        });
      }
    }
  }
}

/**
 * Queue engagement recreations
 * From Friday: yearly/monthly-engagement-creation
 */
async function queueEngagementRecreations(interval) {
  const engagements = list('engagement', {
    repeat_interval: interval,
    status: 'active',
  });

  const batchSize = 20;
  const batches = [];

  for (let i = 0; i < engagements.length; i += batchSize) {
    batches.push(engagements.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    for (const engagement of batch) {
      try {
        await recreateEngagement(engagement.id);
        console.log(`[JOB] Recreated engagement ${engagement.id}`);
      } catch (error) {
        console.error(`[JOB] Failed to recreate engagement ${engagement.id}:`, error.message);

        create('recreation_log', {
          engagement_id: engagement.id,
          client_id: engagement.client_id,
          status: 'failed',
          error: error.message,
        });
      }
    }
  }
}

// === JOB RUNNER ===

/**
 * Run a specific job by name
 */
export async function runJob(jobName) {
  const job = scheduledJobs[jobName];
  if (!job) {
    throw new Error(`Unknown job: ${jobName}`);
  }

  console.log(`[JOB] Running ${jobName}...`);
  const startTime = Date.now();

  try {
    await job.handler(job.config);
    console.log(`[JOB] ${jobName} completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error(`[JOB] ${jobName} failed:`, error.message);
    throw error;
  }
}

/**
 * Get all job definitions
 */
export function getJobDefinitions() {
  return Object.entries(scheduledJobs).map(([name, job]) => ({
    name,
    schedule: job.schedule,
    description: job.description,
  }));
}

/**
 * Parse cron expression to check if job should run now
 */
export function shouldRunNow(schedule) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = schedule.split(' ');
  const now = new Date();

  const matches = (field, value) => {
    if (field === '*') return true;
    return parseInt(field, 10) === value;
  };

  return (
    matches(minute, now.getMinutes()) &&
    matches(hour, now.getHours()) &&
    matches(dayOfMonth, now.getDate()) &&
    matches(month, now.getMonth() + 1) &&
    matches(dayOfWeek, now.getDay())
  );
}

/**
 * Run all jobs that should run now (called by cron/scheduler)
 */
export async function runDueJobs() {
  for (const [name, job] of Object.entries(scheduledJobs)) {
    if (shouldRunNow(job.schedule)) {
      try {
        await runJob(name);
      } catch (error) {
        // Log error but continue with other jobs
        console.error(`[JOB] Error running ${name}:`, error.message);
      }
    }
  }
}
