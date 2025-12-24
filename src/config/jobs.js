import { list, get, update, create, remove } from '@/engine';
import { queueEmail, sendQueuedEmails, generateChecklistPdf } from '@/engine/email-templates';
import { recreateEngagement } from '@/engine/recreation';
import { exportDatabase } from '@/engine/backup';
import { createJob, forEachRecord, activityLog, getDeadlineRange, getDaysUntil, shouldRunNow, runJob, runDueJobs } from '@/lib/job-framework';
import { ROLES, USER_TYPES, REVIEW_STATUS, LOG_PREFIXES } from '@/config/constants';
import { JOBS_CONFIG } from '@/config/jobs-config';
import { safeJsonParse } from '@/lib/safe-json';
import { autoAllocateEmail } from '@/lib/email-parser';
import { getDatabase, genId, now } from '@/lib/database-core';
import { notifyExpiringCollaborators } from '@/services/collaborator-notifier';
import { getWorkingDaysDiff, dateToSeconds } from '@/lib/date-utils';
import { getEngagementStages, getRfiStates } from '@/lib/status-helpers';

const defineJob = (config, handler) => createJob(config.name, config.schedule, config.description, handler, config.config);

const createRecreationJob = (interval) => {
  const config = interval === 'yearly' ? JOBS_CONFIG.yearlyEngagementRecreation : JOBS_CONFIG.monthlyEngagementRecreation;
  return defineJob(config, async () => forEachRecord('engagement', { repeat_interval: interval, status: 'active' },
    async (e) => recreateEngagement(e.id).catch(err => create('recreation_log', { engagement_id: e.id, client_id: e.client_id, status: 'failed', error: err.message })))
  );
};

export const SCHEDULED_JOBS = {
  daily_backup: defineJob(JOBS_CONFIG.dailyBackup, exportDatabase),

  daily_user_sync: defineJob(JOBS_CONFIG.dailyUserSync, async () => {
    const scriptUrl = process.env.USER_SYNC_SCRIPT_URL, syncKey = process.env.USER_SYNC_KEY;
    if (!scriptUrl || !syncKey) return;
    const wsUsers = await (await fetch(`${scriptUrl}?key=${syncKey}`)).json();
    const existing = new Set(list('user', { type: USER_TYPES.AUDITOR }).map(u => u.email.toLowerCase()));
    for (const u of wsUsers) {
      if (!existing.has(u.email.trim().toLowerCase())) {
        create('user', { email: u.email.trim().toLowerCase(), name: u.name, avatar: u.photo, type: USER_TYPES.AUDITOR, role: ROLES.CLERK, auth_provider: 'google', status: 'active' });
      }
    }
    const wsEmails = new Set(wsUsers.map(u => u.email.trim().toLowerCase()));
    for (const u of list('user', { type: USER_TYPES.AUDITOR, status: 'active' })) {
      if (!wsEmails.has(u.email.toLowerCase())) update('user', u.id, { status: 'inactive' });
    }
  }),

  daily_engagement_check: defineJob(JOBS_CONFIG.dailyEngagementCheck, async () => {
    const now = Math.floor(Date.now() / 1000);
    const stages = getEngagementStages();
    await forEachRecord('engagement', { stage: stages.INFO_GATHERING, status: 'active' }, async (e) => {
      if (e.commencement_date && e.commencement_date <= now) {
        update('engagement', e.id, { stage: stages.COMMENCEMENT });
        activityLog('engagement', e.id, 'stage_change', 'Auto-transitioned to commencement');
      }
    });
  }),

  daily_engagement_auto_transitions: defineJob({
    name: 'daily_engagement_auto_transitions',
    schedule: '0 4 * * *',
    description: 'Auto-transition engagements through lifecycle stages based on conditions',
    config: {
      max_attempts: 3
    }
  }, async (cfg) => {
    const { checkAndTransitionEngagements } = await import('@/lib/lifecycle-engine');

    const candidateEngagements = list('engagement').filter(e =>
      e.status === 'active' && (e.stage === 'info_gathering' || e.stage === 'commencement')
    );

    if (candidateEngagements.length === 0) {
      console.log(`${LOG_PREFIXES.job} No engagements require auto-transition check`);
      return { total: 0, transitioned: 0, failed: 0, skipped: 0 };
    }

    const results = await checkAndTransitionEngagements(candidateEngagements, cfg);

    console.log(`${LOG_PREFIXES.job} Auto-transition complete: ${results.transitioned}/${results.total} transitioned, ${results.failed} failed, ${results.skipped} skipped`);

    if (results.errors.length > 0) {
      console.error(`${LOG_PREFIXES.job} Errors during auto-transition:`, results.errors);
    }

    return results;
  }),

  daily_rfi_notifications: defineJob(JOBS_CONFIG.dailyRfiNotifications, async (cfg) => {
    const rfiStates = getRfiStates('display_states');
    for (const days of cfg.days_before) {
      const { start, end } = getDeadlineRange(days);
      for (const rfi of list('rfi').filter(r => r.due_date >= start && r.due_date < end && r.client_status !== 'completed')) {
        await queueEmail('rfi_deadline', { rfi, daysUntil: days, recipients: 'assigned_users' });
      }
    }
  }),

  daily_rfi_escalation: defineJob(JOBS_CONFIG.dailyRfiEscalation, async (cfg) => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const stages = getEngagementStages();

    for (const rfi of list('rfi').filter(r => r.client_status !== 'completed' && r.status !== 'completed')) {
      const engagement = get('engagement', rfi.engagement_id);
      if (!engagement || engagement.stage === stages.INFO_GATHERING) continue;

      const daysOutstanding = getWorkingDaysDiff(rfi.date_requested || rfi.created_at, nowSeconds);

      for (const threshold of cfg.escalation_thresholds) {
        if (daysOutstanding >= threshold) {
          const escalationsSent = safeJsonParse(rfi.escalation_notifications_sent, []);

          if (!escalationsSent.includes(threshold)) {
            const client = get('client', engagement.client_id);

            await queueEmail('rfi_escalation', {
              rfi,
              engagement,
              client,
              daysOutstanding: threshold,
              rfi_url: `${process.env.APP_URL || 'http://localhost:3000'}/engagements/${engagement.id}/rfis/${rfi.id}`,
              recipients: 'partners_and_managers'
            });

            escalationsSent.push(threshold);
            update('rfi', rfi.id, {
              escalation_notifications_sent: JSON.stringify(escalationsSent)
            });

            activityLog('rfi', rfi.id, 'escalation_sent', `Escalation notification sent for ${threshold} days outstanding`);

            console.log(`[JOB] RFI escalation sent: RFI ${rfi.id} (${threshold} days outstanding)`);
          }
        }
      }
    }
  }),

  daily_rfi_expiry: defineJob({ name: 'daily_rfi_expiry', schedule: '0 2 * * *', description: 'RFI hard expiry at 90 days' }, async (cfg) => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const maxDays = cfg.max_days_outstanding || 90;

    for (const rfi of list('rfi').filter(r => r.status !== 'completed' && r.status !== 'expired')) {
      const daysOutstanding = getWorkingDaysDiff(rfi.date_requested || rfi.created_at, nowSeconds);
      if (daysOutstanding >= maxDays) {
        update('rfi', rfi.id, {
          status: 'expired',
          expired_at: nowSeconds,
          expiry_reason: 'max_days_outstanding exceeded'
        });
        activityLog('rfi', rfi.id, 'expired', `RFI auto-expired after ${daysOutstanding} days outstanding`);
        console.log(`[JOB] RFI expired: RFI ${rfi.id} (${daysOutstanding} days outstanding)`);
      }
    }
  }),

  daily_consolidated_notifications: defineJob(JOBS_CONFIG.dailyConsolidatedNotifications, async () => {
    const pending = list('notification', { status: 'pending' });
    const byUser = pending.reduce((acc, n) => ((acc[n.recipient_id] = acc[n.recipient_id] || []).push(n), acc), {});
    for (const [userId, notifs] of Object.entries(byUser)) {
      const user = get('user', userId);
      if (user?.status === 'active') {
        await queueEmail('daily_digest', { user, notifications: notifs, recipients: 'user' });
        for (const n of notifs) update('notification', n.id, { status: 'sent', sent_at: Math.floor(Date.now() / 1000) });
      }
    }
  }),

  daily_tender_notifications: defineJob(JOBS_CONFIG.dailyTenderNotifications, async () => {
    await forEachRecord('review', { is_tender: true, status: REVIEW_STATUS.OPEN }, async (r) => {
      if (r.deadline) {
        const days = getDaysUntil(r.deadline);
        if (days === 7 || days === 0) await queueEmail(days === 0 ? 'tender_deadline_today' : 'tender_deadline_7days', { review: r, daysUntil: days, recipients: 'team_partners' });
      }
    });
  }),

  daily_tender_missed: defineJob(JOBS_CONFIG.dailyTenderMissed, async () => {
    const now = Math.floor(Date.now() / 1000);
    await forEachRecord('review', { is_tender: true, status: REVIEW_STATUS.OPEN }, async (r) => {
      if (r.deadline && r.deadline < now) {
        const flags = safeJsonParse(r.tender_flags, []);
        if (!flags.includes('missed')) update('review', r.id, { tender_flags: JSON.stringify([...flags, 'missed']) });
      }
    });
  }),

  daily_collaborator_expiry_notifications: defineJob(JOBS_CONFIG.dailyCollaboratorExpiryNotifications, async () => {
    try {
      const result = await notifyExpiringCollaborators();
      console.log(`${LOG_PREFIXES.job} Collaborator expiry notifications: ${result.notified} sent, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error(`${LOG_PREFIXES.job} Collaborator expiry notifications error:`, error.message);
      throw error;
    }
  }),

  daily_temp_access_cleanup: defineJob(JOBS_CONFIG.dailyTempAccessCleanup, async () => {
    const now = Math.floor(Date.now() / 1000);
    await forEachRecord('collaborator', { type: 'temporary' }, async (c) => {
      if (c.expires_at && c.expires_at < now) remove('collaborator', c.id);
    });
  }),

  weekly_checklist_pdfs: defineJob(JOBS_CONFIG.weeklyChecklistPdfs, async () => {
    await forEachRecord('user', { role: ROLES.PARTNER, status: 'active' }, async (p) => {
      try {
        const url = await generateChecklistPdf(p);
        if (url) await queueEmail('weekly_checklist_pdf', { user: p, pdfUrl: url, date: new Date().toISOString().split('T')[0], recipients: 'user' });
      } catch (e) {
        console.error(`${LOG_PREFIXES.job} Checklist PDF error for ${p.email}:`, e.message);
        await create('notification', { type: 'system_error', recipient_id: p.id, subject: 'Checklist PDF Generation Failed', content: `Error: ${e.message}`, status: 'pending' });
      }
    });
  }),

  weekly_client_emails: defineJob(JOBS_CONFIG.weeklyClientEmails, async (cfg) => {
    await forEachRecord('client', { status: 'active' }, async (client) => {
      const engagements = list('engagement', { client_id: client.id, status: 'active' });
      if (!engagements.length) return;
      for (const cu of list('client_user', { client_id: client.id, status: 'active' })) {
        const user = get('user', cu.user_id);
        if (!user) continue;
        if (cfg.include_individual) await queueEmail('weekly_client_engagement', { client, user, engagements, recipients: 'client_user' });
        if (cfg.include_admin_master && cu.role === 'admin') await queueEmail('weekly_client_master', { client, user, engagements, recipients: 'client_admin' });
      }
    });
  }),

  yearly_engagement_recreation: createRecreationJob('yearly'),
  monthly_engagement_recreation: createRecreationJob('monthly'),
  hourly_email_processing: defineJob(JOBS_CONFIG.hourlyEmailProcessing, async () => {
    try {
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Email processing failed: ${error}`);
      }

      const result = await response.json();
      console.log(`${LOG_PREFIXES.job} Email queue processed:`, result);
      return result;
    } catch (error) {
      console.error(`${LOG_PREFIXES.job} Email queue processing error:`, error.message);
      throw error;
    }
  }),

  hourly_email_allocation: defineJob(JOBS_CONFIG.hourlyEmailAllocation, async (cfg) => {
    const db = getDatabase();
    const { min_confidence = 70, batch_size = 50 } = cfg;

    const unallocatedEmails = db.prepare(`
      SELECT * FROM email
      WHERE allocated = 0 AND status = 'pending'
      ORDER BY received_at DESC
      LIMIT ?
    `).all(batch_size);

    let allocated = 0;
    let failed = 0;
    let skipped = 0;

    for (const email of unallocatedEmails) {
      try {
        const result = await autoAllocateEmail(email);

        if (result.success && result.confidence >= min_confidence) {
          const logId = genId();
          const timestamp = now();

          db.prepare(`
            INSERT INTO activity_log (
              id, entity_type, entity_id, action, message, details, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            logId,
            'email',
            email.id,
            'auto_allocated',
            `Email auto-allocated to ${result.engagement_id ? 'engagement' : 'RFI'}`,
            JSON.stringify({
              engagement_id: result.engagement_id || null,
              rfi_id: result.rfi_id || null,
              confidence: result.confidence,
              method: 'automatic',
            }),
            timestamp
          );

          allocated++;

          console.log(`${LOG_PREFIXES.job} Email ${email.id} allocated (confidence: ${result.confidence}%)`);
        } else if (result.success && result.confidence < min_confidence) {
          skipped++;
          console.log(`${LOG_PREFIXES.job} Email ${email.id} skipped (confidence: ${result.confidence}% < ${min_confidence}%)`);
        } else {
          failed++;
          console.log(`${LOG_PREFIXES.job} Email ${email.id} failed: ${result.reason}`);
        }
      } catch (error) {
        failed++;
        console.error(`${LOG_PREFIXES.job} Email ${email.id} allocation error:`, error.message);

        db.prepare(`
          UPDATE email
          SET processing_error = ?,
              updated_at = ?
          WHERE id = ?
        `).run(error.message, now(), email.id);
      }
    }

    console.log(`${LOG_PREFIXES.job} Email allocation complete: ${allocated} allocated, ${skipped} skipped, ${failed} failed`);

    return { allocated, skipped, failed, total: unallocatedEmails.length };
  }),
};

export { shouldRunNow };
export const runJobByName = (name) => runJob(SCHEDULED_JOBS, name);
export const runAllDueJobs = () => runDueJobs(SCHEDULED_JOBS);
