import { list, get, update, create, remove } from '@/engine';
import { queueEmail, sendQueuedEmails, generateChecklistPdf } from '@/engine/email-templates';
import { recreateEngagement } from '@/engine/recreation';
import { exportDatabase } from '@/engine/backup';
import { createJob, forEachRecord, activityLog, getDeadlineRange, getDaysUntil, shouldRunNow, runJob, runDueJobs } from '@/lib/job-framework';

const createRecreationJob = (interval, schedule, desc) => createJob(
  `${interval}_engagement_recreation`, schedule, desc,
  async () => forEachRecord('engagement', { repeat_interval: interval, status: 'active' },
    async (e) => recreateEngagement(e.id).catch(err => create('recreation_log', { engagement_id: e.id, client_id: e.client_id, status: 'failed', error: err.message })))
);

export const SCHEDULED_JOBS = {
  daily_backup: createJob('daily_backup', '0 2 * * *', 'Export database to backup', exportDatabase),

  daily_user_sync: createJob('daily_user_sync', '0 3 * * *', 'Sync users from Google Workspace', async () => {
    const scriptUrl = process.env.USER_SYNC_SCRIPT_URL, syncKey = process.env.USER_SYNC_KEY;
    if (!scriptUrl || !syncKey) return;
    const wsUsers = await (await fetch(`${scriptUrl}?key=${syncKey}`)).json();
    const existing = new Set(list('user', { type: 'auditor' }).map(u => u.email.toLowerCase()));
    for (const u of wsUsers) {
      if (!existing.has(u.email.trim().toLowerCase())) {
        create('user', { email: u.email.trim().toLowerCase(), name: u.name, avatar: u.photo, type: 'auditor', role: 'clerk', auth_provider: 'google', status: 'active' });
      }
    }
    const wsEmails = new Set(wsUsers.map(u => u.email.trim().toLowerCase()));
    for (const u of list('user', { type: 'auditor', status: 'active' })) {
      if (!wsEmails.has(u.email.toLowerCase())) update('user', u.id, { status: 'inactive' });
    }
  }),

  daily_engagement_check: createJob('daily_engagement_check', '0 4 * * *', 'Auto-transition engagements', async () => {
    const now = Math.floor(Date.now() / 1000);
    await forEachRecord('engagement', { stage: 'info_gathering', status: 'active' }, async (e) => {
      if (e.commencement_date && e.commencement_date <= now) {
        update('engagement', e.id, { stage: 'commencement' });
        activityLog('engagement', e.id, 'stage_change', 'Auto-transitioned to commencement');
      }
    });
  }),

  daily_rfi_notifications: createJob('daily_rfi_notifications', '0 5 * * *', 'RFI deadline notifications', async (cfg) => {
    for (const days of cfg.days_before) {
      const { start, end } = getDeadlineRange(days);
      for (const rfi of list('rfi').filter(r => r.deadline >= start && r.deadline < end && r.status !== 1 && r.client_status !== 'completed')) {
        await queueEmail('rfi_deadline', { rfi, daysUntil: days, recipients: 'assigned_users' });
      }
    }
  }, { days_before: [7, 3, 1, 0] }),

  daily_consolidated_notifications: createJob('daily_consolidated_notifications', '0 6 * * *', 'Daily digest to managers/clerks', async () => {
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

  daily_tender_notifications: createJob('daily_tender_notifications', '0 9 * * *', 'Tender deadline notifications', async () => {
    await forEachRecord('review', { is_tender: true, status: 'open' }, async (r) => {
      if (r.deadline) {
        const days = getDaysUntil(r.deadline);
        if (days === 7 || days === 0) await queueEmail(days === 0 ? 'tender_deadline_today' : 'tender_deadline_7days', { review: r, daysUntil: days, recipients: 'team_partners' });
      }
    });
  }),

  daily_tender_missed: createJob('daily_tender_missed', '0 10 * * *', 'Mark missed tender deadlines', async () => {
    const now = Math.floor(Date.now() / 1000);
    await forEachRecord('review', { is_tender: true, status: 'open' }, async (r) => {
      if (r.deadline && r.deadline < now) {
        const flags = JSON.parse(r.tender_flags || '[]');
        if (!flags.includes('missed')) update('review', r.id, { tender_flags: JSON.stringify([...flags, 'missed']) });
      }
    });
  }),

  daily_temp_access_cleanup: createJob('daily_temp_access_cleanup', '0 0 * * *', 'Remove expired collaborators', async () => {
    const now = Math.floor(Date.now() / 1000);
    await forEachRecord('collaborator', { type: 'temporary' }, async (c) => {
      if (c.expires_at && c.expires_at < now) remove('collaborator', c.id);
    });
  }),

  weekly_checklist_pdfs: createJob('weekly_checklist_pdfs', '0 8 * * 1', 'Weekly checklist PDF reports', async () => {
    await forEachRecord('user', { role: 'partner', status: 'active' }, async (p) => {
      try {
        const url = await generateChecklistPdf(p);
        if (url) await queueEmail('weekly_checklist_pdf', { user: p, pdfUrl: url, date: new Date().toISOString().split('T')[0], recipients: 'user' });
      } catch (e) {
        console.error(`[JOB] Checklist PDF error for ${p.email}:`, e.message);
        await create('notification', { type: 'system_error', recipient_id: p.id, subject: 'Checklist PDF Generation Failed', content: `Error: ${e.message}`, status: 'pending' });
      }
    });
  }),

  weekly_client_emails: createJob('weekly_client_emails', '0 9 * * 1', 'Weekly client engagement summaries', async (cfg) => {
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
  }, { include_individual: true, include_admin_master: true }),

  yearly_engagement_recreation: createRecreationJob('yearly', '0 0 1 1 *', 'Yearly engagement recreation'),
  monthly_engagement_recreation: createRecreationJob('monthly', '0 0 1 * *', 'Monthly engagement recreation'),
  hourly_email_processing: createJob('hourly_email_processing', '0 * * * *', 'Process email queue', sendQueuedEmails),
};

export { shouldRunNow };
export const runJobByName = (name) => runJob(SCHEDULED_JOBS, name);
export const runAllDueJobs = () => runDueJobs(SCHEDULED_JOBS);
