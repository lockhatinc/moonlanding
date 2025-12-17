import { list, get, update, create } from '@/engine';
import { queueEmail, sendQueuedEmails, generateChecklistPdf } from '@/engine/email-templates';
import { recreateEngagement } from '@/engine/recreation';
import { exportDatabase } from '@/engine/backup';

const createActivityLog = (entity, entityId, action, msg, user, details) =>
  create('activity_log', { entity_type: entity, entity_id: entityId, action, message: msg, details: details ? JSON.stringify(details) : null, user_email: user?.email }, user);

export const SCHEDULED_JOBS = {
  daily_backup: {
    schedule: '0 2 * * *',
    description: 'Export database to backup',
    run: async () => { await exportDatabase(); }
  },
  daily_user_sync: {
    schedule: '0 3 * * *',
    description: 'Sync users from Google Workspace',
    run: async () => {
      const scriptUrl = process.env.USER_SYNC_SCRIPT_URL, syncKey = process.env.USER_SYNC_KEY;
      if (!scriptUrl || !syncKey) return;
      try {
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
      } catch (e) {
        console.error('[JOB] User sync error:', e.message);
        throw new Error(`User sync failed: ${e.message}`);
      }
    }
  },
  daily_engagement_check: {
    schedule: '0 4 * * *',
    description: 'Auto-transition engagements',
    run: async () => {
      const now = Math.floor(Date.now() / 1000);
      for (const e of list('engagement', { stage: 'info_gathering', status: 'active' })) {
        if (e.commencement_date && e.commencement_date <= now) {
          update('engagement', e.id, { stage: 'commencement' });
          createActivityLog('engagement', e.id, 'stage_change', 'Auto-transitioned to commencement');
        }
      }
    }
  },
  daily_rfi_notifications: {
    schedule: '0 5 * * *',
    description: 'RFI deadline notifications',
    config: { days_before: [7, 3, 1, 0] },
    run: async (cfg) => {
      const now = Math.floor(Date.now() / 1000), day = 86400;
      for (const days of cfg.days_before) {
        const start = Math.floor((now + days * day) / day) * day, end = start + day;
        for (const rfi of list('rfi').filter(r => r.deadline >= start && r.deadline < end && r.status !== 1 && r.client_status !== 'completed')) {
          await queueEmail('rfi_deadline', { rfi, daysUntil: days, recipients: 'assigned_users' });
        }
      }
    }
  },
  daily_consolidated_notifications: {
    schedule: '0 6 * * *',
    description: 'Daily digest to managers/clerks',
    run: async () => {
      const pending = list('notification', { status: 'pending' });
      const byUser = pending.reduce((acc, n) => ((acc[n.recipient_id] = acc[n.recipient_id] || []).push(n), acc), {});
      for (const [userId, notifs] of Object.entries(byUser)) {
        const user = get('user', userId);
        if (user?.status === 'active') {
          await queueEmail('daily_digest', { user, notifications: notifs, recipients: 'user' });
          for (const n of notifs) update('notification', n.id, { status: 'sent', sent_at: Math.floor(Date.now() / 1000) });
        }
      }
    }
  },
  daily_tender_notifications: {
    schedule: '0 9 * * *',
    description: 'Tender deadline notifications',
    run: async () => {
      const now = Math.floor(Date.now() / 1000);
      for (const r of list('review', { is_tender: true, status: 'open' })) {
        if (r.deadline) {
          const days = Math.floor((r.deadline - now) / 86400);
          if (days === 7 || days === 0) await queueEmail(days === 0 ? 'tender_deadline_today' : 'tender_deadline_7days', { review: r, daysUntil: days, recipients: 'team_partners' });
        }
      }
    }
  },
  daily_tender_missed: {
    schedule: '0 10 * * *',
    description: 'Mark missed tender deadlines',
    run: async () => {
      const now = Math.floor(Date.now() / 1000);
      for (const r of list('review', { is_tender: true, status: 'open' })) {
        if (r.deadline && r.deadline < now) {
          const flags = JSON.parse(r.tender_flags || '[]');
          if (!flags.includes('missed')) update('review', r.id, { tender_flags: JSON.stringify([...flags, 'missed']) });
        }
      }
    }
  },
  daily_temp_access_cleanup: {
    schedule: '0 0 * * *',
    description: 'Remove expired collaborators',
    run: async () => {
      const now = Math.floor(Date.now() / 1000);
      for (const c of list('collaborator', { type: 'temporary' })) {
        if (c.expires_at && c.expires_at < now) {
          const { remove: removeEntity } = await import('@/engine');
          removeEntity('collaborator', c.id);
        }
      }
    }
  },
  weekly_checklist_pdfs: {
    schedule: '0 8 * * 1',
    description: 'Weekly checklist PDF reports',
    run: async () => {
      for (const p of list('user', { role: 'partner', status: 'active' })) {
        try {
          const url = await generateChecklistPdf(p);
          if (url) await queueEmail('weekly_checklist_pdf', { user: p, pdfUrl: url, date: new Date().toISOString().split('T')[0], recipients: 'user' });
        } catch (e) {
          console.error(`[JOB] Checklist PDF error for ${p.email}:`, e.message);
          await create('notification', { type: 'system_error', recipient_id: p.id, subject: 'Checklist PDF Generation Failed', content: `Error: ${e.message}`, status: 'pending' });
        }
      }
    }
  },
  weekly_client_emails: {
    schedule: '0 9 * * 1',
    description: 'Weekly client engagement summaries',
    config: { include_individual: true, include_admin_master: true },
    run: async (cfg) => {
      for (const client of list('client', { status: 'active' })) {
        const engagements = list('engagement', { client_id: client.id, status: 'active' });
        if (engagements.length === 0) continue;
        for (const cu of list('client_user', { client_id: client.id, status: 'active' })) {
          const user = get('user', cu.user_id);
          if (!user) continue;
          if (cfg.include_individual) await queueEmail('weekly_client_engagement', { client, user, engagements, recipients: 'client_user' });
          if (cfg.include_admin_master && cu.role === 'admin') await queueEmail('weekly_client_master', { client, user, engagements, recipients: 'client_admin' });
        }
      }
    }
  },
  yearly_engagement_recreation: {
    schedule: '0 0 1 1 *',
    description: 'Yearly engagement recreation',
    run: async () => { for (const e of list('engagement', { repeat_interval: 'yearly', status: 'active' })) await recreateEngagement(e.id).catch(err => create('recreation_log', { engagement_id: e.id, client_id: e.client_id, status: 'failed', error: err.message })); }
  },
  monthly_engagement_recreation: {
    schedule: '0 0 1 * *',
    description: 'Monthly engagement recreation',
    run: async () => { for (const e of list('engagement', { repeat_interval: 'monthly', status: 'active' })) await recreateEngagement(e.id).catch(err => create('recreation_log', { engagement_id: e.id, client_id: e.client_id, status: 'failed', error: err.message })); }
  },
  hourly_email_processing: {
    schedule: '0 * * * *',
    description: 'Process email queue',
    run: async () => { await sendQueuedEmails(); }
  },
};

export const shouldRunNow = (schedule) => {
  const [m, h, dom, mon, dow] = schedule.split(' '), now = new Date();
  const match = (f, v) => f === '*' || parseInt(f) === v;
  return match(m, now.getMinutes()) && match(h, now.getHours()) && match(dom, now.getDate()) && match(mon, now.getMonth() + 1) && match(dow, now.getDay());
};

export const runJob = async (name) => {
  const job = SCHEDULED_JOBS[name];
  if (!job) throw new Error(`Unknown job: ${name}`);
  try {
    await job.run(job.config);
  } catch (e) {
    console.error(`[JOB] ${name} failed:`, e.message);
    throw e;
  }
};

export const runDueJobs = async () => {
  for (const [name, job] of Object.entries(SCHEDULED_JOBS)) {
    if (shouldRunNow(job.schedule)) {
      try {
        await runJob(name);
      } catch (e) {
        console.error(`[JOB] ${name}:`, e.message);
      }
    }
  }
};
