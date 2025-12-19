import { list, get, update, create, remove } from '@/engine';
import { queueEmail, sendQueuedEmails, generateChecklistPdf } from '@/engine/email-templates';
import { recreateEngagement } from '@/engine/recreation';
import { exportDatabase } from '@/engine/backup';
import { createJob, forEachRecord, activityLog, getDeadlineRange, getDaysUntil, shouldRunNow, runJob, runDueJobs } from '@/lib/job-framework';
import { ROLES, USER_TYPES, ENGAGEMENT_STAGE, REVIEW_STATUS, RFI_STATUS, RFI_CLIENT_STATUS } from '@/config/constants';
import { JOBS_CONFIG } from '@/config/jobs-config';

const defineJob = (config, handler) => createJob(config.name, config.schedule, config.description, handler, config.config);

const createRecreationJob = (interval) => {
  const config = interval === 'yearly' ? JOBS_CONFIG.yearlyEngagementRecreation : JOBS_CONFIG.monthlyEngagementRecreation;
  return defineJob(config, async () => forEachRecord('engagement', { repeat_interval: interval, status: 'active' },
    async (e) => {
      try {
        const newEngagementId = await recreateEngagement(e.id);
        // Lock original engagement to prevent infinite loops
        await update('engagement', e.id, { repeat_interval: 'once' });
        // Reset RFI dates on new engagement
        const rfis = list('rfi', { engagement_id: newEngagementId });
        for (const rfi of rfis) {
          await update('rfi', rfi.id, {
            date_requested: null,
            date_resolved: null,
            status: 'waiting',
            client_status: 'pending',
            auditor_status: 'requested'
          });
        }
        await create('recreation_log', { engagement_id: e.id, new_engagement_id: newEngagementId, client_id: e.client_id, status: 'success' });
      } catch (err) {
        console.error(`[JOB] Recreation error for engagement ${e.id}:`, err.message);
        await create('recreation_log', { engagement_id: e.id, client_id: e.client_id, status: 'failed', error: err.message });
      }
    })
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
    await forEachRecord('engagement', { stage: ENGAGEMENT_STAGE.INFO_GATHERING, status: 'active' }, async (e) => {
      if (e.commencement_date && e.commencement_date <= now) {
        update('engagement', e.id, { stage: ENGAGEMENT_STAGE.COMMENCEMENT });
        activityLog('engagement', e.id, 'stage_change', 'Auto-transitioned to commencement');
      }
    });
  }),

  daily_rfi_notifications: defineJob(JOBS_CONFIG.dailyRfiNotifications, async (cfg) => {
    for (const days of cfg.days_before) {
      const { start, end } = getDeadlineRange(days);
      for (const rfi of list('rfi').filter(r => r.due_date >= start && r.due_date < end && r.client_status !== RFI_CLIENT_STATUS.COMPLETED)) {
        await queueEmail('rfi_deadline', { rfi, daysUntil: days, recipients: 'assigned_users' });
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
        const flags = JSON.parse(r.tender_flags || '[]');
        if (!flags.includes('missed')) update('review', r.id, { tender_flags: JSON.stringify([...flags, 'missed']) });
      }
    });
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
        console.error(`[JOB] Checklist PDF error for ${p.email}:`, e.message);
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
  hourly_email_processing: defineJob(JOBS_CONFIG.hourlyEmailProcessing, sendQueuedEmails),

  review_checklist_inheritance: defineJob(JOBS_CONFIG.reviewChecklistInheritance, async (review) => {
    if (!review.template_id) return;
    const template = get('template', review.template_id);
    if (!template) return;
    try {
      const defaultChecklists = typeof template.default_checklists === 'string'
        ? JSON.parse(template.default_checklists)
        : template.default_checklists || [];
      const sections = typeof template.sections === 'string'
        ? JSON.parse(template.sections)
        : template.sections || [];
      if (defaultChecklists.length > 0) {
        for (const checklist of defaultChecklists) {
          await create('checklist', { review_id: review.id, ...checklist });
        }
      }
      if (sections.length > 0) {
        await update('review', review.id, { sections: JSON.stringify(sections) });
      }
    } catch (err) {
      console.error(`[JOB] Checklist inheritance error for review ${review.id}:`, err.message);
    }
  }),

  rfi_info_gathering_zero_out: (rfi, engagement) => {
    if (engagement?.stage === ENGAGEMENT_STAGE.INFO_GATHERING) {
      return { ...rfi, days_outstanding: 0 };
    }
    return rfi;
  },

  client_access_filter: (rfis, user) => {
    if (user.role === ROLES.CLIENT && user.client_access) {
      const allowedClientIds = JSON.parse(typeof user.client_access === 'string' ? user.client_access : JSON.stringify(user.client_access || []));
      return rfis.filter(rfi => {
        const rfiClientIds = JSON.parse(typeof rfi.client_ids === 'string' ? rfi.client_ids : JSON.stringify(rfi.client_ids || []));
        return rfiClientIds.some(cid => allowedClientIds.includes(cid));
      });
    }
    return rfis;
  },
};

export { shouldRunNow };
export const runJobByName = (name) => runJob(SCHEDULED_JOBS, name);
export const runAllDueJobs = () => runDueJobs(SCHEDULED_JOBS);
