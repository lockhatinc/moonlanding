import { list, get, update, create, remove } from '@/engine';
import { queueEmail, sendQueuedEmails } from '@/engine/notification-engine';
import { generateChecklistPdf } from '@/engine/generate-checklist-pdf';
import { recreateEngagement } from '@/engine/recreation';
import { exportDatabase } from '@/engine/backup';
import { safeJsonParse } from '@/lib/safe-json';
import { autoAllocateEmail } from '@/lib/email-parser';
import { getDatabase, genId, now } from '@/lib/database-core';
import { getWorkingDaysDiff } from '@/lib/date-utils';
import { getEngagementStages } from '@/lib/status-helpers';

const DAY = 86400;
const nowSec = () => Math.floor(Date.now() / 1000);

const forEachRecord = async (entity, filter, handler) => {
  for (const record of list(entity, filter)) await handler(record);
};

const activityLog = (entity, entityId, action, msg, user = null, details = null) =>
  create('activity_log', {
    entity_type: entity, entity_id: entityId, action, message: msg,
    details: details ? JSON.stringify(details) : null, user_email: user?.email
  }, user);

const getDaysUntil = (timestamp) => Math.floor((timestamp - nowSec()) / DAY);
const getDeadlineRange = (daysFromNow) => {
  const start = Math.floor((nowSec() + daysFromNow * DAY) / DAY) * DAY;
  return { start, end: start + DAY };
};

const shouldRunNow = (schedule) => {
  const [m, h, dom, mon, dow] = schedule.split(' '), d = new Date();
  const match = (f, v) => f === '*' || parseInt(f) === v;
  return match(m, d.getMinutes()) && match(h, d.getHours()) && match(dom, d.getDate()) && match(mon, d.getMonth() + 1) && match(dow, d.getDay());
};

const HANDLERS = {
  async export_database() { await exportDatabase(); },

  async sync_users_from_google_workspace() {
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
  },

  async auto_transition_engagement_stages(cfg) {
    const stages = getEngagementStages();
    const n = nowSec();
    const results = { total: 0, transitioned: 0, failed: 0, skipped: 0 };
    for (const e of list('engagement').filter(e => e.status === 'active' && e.stage === stages.INFO_GATHERING)) {
      results.total++;
      if ((e.transition_attempts || 0) >= (cfg?.max_attempts || 3)) { results.skipped++; continue; }
      if (e.commencement_date && e.commencement_date <= n) {
        try {
          const { transition } = await import('@/lib/workflow-engine');
          transition('engagement', e.id, 'engagement_lifecycle', 'commencement', { id: 'system', role: 'partner' }, 'auto_transition_commencement_date_reached');
          results.transitioned++;
        } catch (err) {
          results.failed++;
          update('engagement', e.id, { transition_attempts: (e.transition_attempts || 0) + 1 });
        }
      }
    }
    return results;
  },

  async send_rfi_deadline_notifications(cfg) {
    const days = cfg?.days_before || [7, 3, 1, 0];
    for (const d of days) {
      const { start, end } = getDeadlineRange(d);
      for (const rfi of list('rfi').filter(r => r.due_date >= start && r.due_date < end && r.client_status !== 'completed')) {
        await queueEmail('rfi_deadline', { rfi, daysUntil: d, recipients: 'assigned_users' });
      }
    }
  },

  async send_rfi_escalation_notifications(cfg) {
    const thresholds = cfg?.escalation_thresholds || [3, 7, 14];
    const n = nowSec();
    const stages = getEngagementStages();
    for (const rfi of list('rfi').filter(r => r.client_status !== 'completed' && r.status !== 'completed')) {
      const engagement = get('engagement', rfi.engagement_id);
      if (!engagement || engagement.stage === stages.INFO_GATHERING) continue;
      const daysOut = getWorkingDaysDiff(rfi.date_requested || rfi.created_at, n);
      for (const threshold of thresholds) {
        if (daysOut >= threshold) {
          const sent = safeJsonParse(rfi.escalation_notifications_sent, []);
          if (!sent.includes(threshold)) {
            const client = get('client', engagement.client_id);
            await queueEmail('rfi_escalation', { rfi, engagement, client, daysOutstanding: threshold, rfi_url: `${process.env.APP_URL || 'http://localhost:3004'}/engagements/${engagement.id}/rfis/${rfi.id}`, recipients: 'partners_and_managers' });
            sent.push(threshold);
            update('rfi', rfi.id, { escalation_notifications_sent: JSON.stringify(sent) });
            activityLog('rfi', rfi.id, 'escalation_sent', `Escalation: ${threshold} days outstanding`);
          }
        }
      }
    }
  },

  async send_consolidated_notifications() {
    const pending = list('notification', { status: 'pending' });
    const byUser = pending.reduce((acc, n) => ((acc[n.recipient_id] = acc[n.recipient_id] || []).push(n), acc), {});
    for (const [userId, notifs] of Object.entries(byUser)) {
      const user = get('user', userId);
      if (user?.status === 'active') {
        await queueEmail('daily_digest', { user, notifications: notifs, recipients: 'user' });
        for (const n of notifs) update('notification', n.id, { status: 'sent', sent_at: nowSec() });
      }
    }
  },

  async send_tender_deadline_warnings() {
    await forEachRecord('tender', { tender_status: 'open' }, async (t) => {
      if (t.deadline) {
        const days = getDaysUntil(t.deadline);
        if (days === 7 || days === 1 || days === 0) {
          const review = get('review', t.review_id);
          if (review) await queueEmail(days === 0 ? 'tender_deadline_today' : 'tender_deadline_7days', { review, daysUntil: days, recipients: 'team_partners' });
        }
      }
    });
  },

  async send_critical_tender_alerts() {
    await forEachRecord('tender', { tender_status: 'open', priority_level: 'critical' }, async (t) => {
      const review = get('review', t.review_id);
      if (review) await queueEmail('tender_deadline_today', { review, recipients: 'team_partners' });
    });
  },

  async auto_close_expired_tenders() {
    const n = nowSec();
    await forEachRecord('tender', { tender_status: 'open' }, async (t) => {
      if (t.deadline && t.deadline < n) update('tender', t.id, { tender_status: 'closed' });
    });
  },

  async send_collaborator_expiry_notifications() {
    const n = nowSec();
    const sevenDaysFromNow = n + (7 * DAY);
    const startOfDay = Math.floor(sevenDaysFromNow / DAY) * DAY;
    const endOfDay = startOfDay + DAY;
    const collaborators = list('collaborator').filter(c => c.expires_at && !c.notified_at && c.expires_at >= startOfDay && c.expires_at < endOfDay);
    let notified = 0;
    for (const c of collaborators) {
      try {
        const review = get('review', c.review_id);
        if (!review) continue;
        const expiresDate = new Date(c.expires_at * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        await queueEmail('collaborator_expiry_7day_warning', { collaborator: c, review, collaborator_name: c.name || c.email, review_name: review.name, expires_date: expiresDate, recipients: 'collaborator_email' });
        update('collaborator', c.id, { notified_at: n });
        notified++;
      } catch (e) { console.error(`[Job] Collaborator notify error:`, e.message); }
    }
    return { notified, total_found: collaborators.length };
  },

  async revoke_expired_collaborators() {
    const n = nowSec();
    await forEachRecord('collaborator', {}, async (c) => {
      if (c.expires_at && c.expires_at < n && !c.is_permanent) remove('collaborator', c.id);
    });
  },

  async generate_weekly_checklist_pdfs() {
    await forEachRecord('user', { role: 'partner', status: 'active' }, async (p) => {
      try {
        const url = await generateChecklistPdf(p);
        if (url) await queueEmail('weekly_checklist_pdf', { user: p, pdfUrl: url, date: new Date().toISOString().split('T')[0], recipients: 'user' });
      } catch (e) { console.error(`[Job] Checklist PDF error:`, e.message); }
    });
  },

  async send_weekly_client_summaries(cfg) {
    await forEachRecord('client', { status: 'active' }, async (client) => {
      const engagements = list('engagement', { client_id: client.id, status: 'active' });
      if (!engagements.length) return;
      for (const cu of list('client_user', { client_id: client.id, status: 'active' })) {
        const user = get('user', cu.user_id);
        if (!user) continue;
        if (cfg?.include_individual) await queueEmail('weekly_client_engagement', { client, user, engagements, recipients: 'client_user' });
        if (cfg?.include_admin_master && cu.role === 'admin') await queueEmail('weekly_client_master', { client, user, engagements, recipients: 'client_admin' });
      }
    });
  },

  async recreate_engagement(cfg) {
    const interval = cfg?.interval;
    if (!interval) return;
    await forEachRecord('engagement', { repeat_interval: interval, status: 'active' }, async (e) => {
      try { await recreateEngagement(e.id); } catch (err) {
        create('recreation_log', { engagement_id: e.id, client_id: e.client_id, status: 'failed', error: err.message });
      }
    });
  },

  async send_queued_emails() { await sendQueuedEmails(); },

  async auto_allocate_emails(cfg) {
    const db = getDatabase();
    const { min_confidence = 70, batch_size = 50 } = cfg || {};
    const unallocated = db.prepare(`SELECT * FROM email WHERE allocated = 0 AND status = 'pending' ORDER BY received_at DESC LIMIT ?`).all(batch_size);
    let allocated = 0, failed = 0, skipped = 0;
    for (const email of unallocated) {
      try {
        const result = await autoAllocateEmail(email);
        if (result.success && result.confidence >= min_confidence) {
          db.prepare(`INSERT INTO activity_log (id, entity_type, entity_id, action, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
            genId(), 'email', email.id, 'auto_allocated', `Email auto-allocated`, JSON.stringify({ engagement_id: result.engagement_id, rfi_id: result.rfi_id, confidence: result.confidence }), now()
          );
          allocated++;
        } else if (result.success) { skipped++; }
        else { failed++; }
      } catch (err) {
        failed++;
        db.prepare(`UPDATE email SET processing_error = ?, updated_at = ? WHERE id = ?`).run(err.message, now(), email.id);
      }
    }
    return { allocated, skipped, failed, total: unallocated.length };
  },
};

const SCHEDULE_MAP = {
  daily_backup: { schedule: '0 2 * * *', handler: 'export_database' },
  user_sync: { schedule: '0 2 * * *', handler: 'sync_users_from_google_workspace' },
  daily_engagement_auto_transitions: { schedule: '0 4 * * *', handler: 'auto_transition_engagement_stages', config: { max_attempts: 3 } },
  rfi_notifications: { schedule: '0 5 * * *', handler: 'send_rfi_deadline_notifications', config: { days_before: [7, 3, 1, 0] } },
  rfi_escalation: { schedule: '0 5 * * *', handler: 'send_rfi_escalation_notifications', config: { escalation_thresholds: [3, 7, 14] } },
  consolidated_notifications: { schedule: '0 6 * * *', handler: 'send_consolidated_notifications' },
  tender_notifications: { schedule: '0 9 * * *', handler: 'send_tender_deadline_warnings' },
  tender_critical_check: { schedule: '0 * * * *', handler: 'send_critical_tender_alerts' },
  tender_auto_close: { schedule: '0 10 * * *', handler: 'auto_close_expired_tenders' },
  daily_collaborator_expiry_notifications: { schedule: '0 7 * * *', handler: 'send_collaborator_expiry_notifications' },
  temp_access_cleanup: { schedule: '0 0 * * *', handler: 'revoke_expired_collaborators' },
  weekly_checklist_pdfs: { schedule: '0 8 * * 1', handler: 'generate_weekly_checklist_pdfs' },
  weekly_client_emails: { schedule: '0 9 * * 1', handler: 'send_weekly_client_summaries', config: { include_individual: true, include_admin_master: true } },
  engagement_recreation_yearly: { schedule: '0 0 1 1 *', handler: 'recreate_engagement', config: { interval: 'yearly' } },
  engagement_recreation_monthly: { schedule: '0 0 1 * *', handler: 'recreate_engagement', config: { interval: 'monthly' } },
  email_queue_processing: { schedule: '0 * * * *', handler: 'send_queued_emails' },
  email_auto_allocation: { schedule: '15 * * * *', handler: 'auto_allocate_emails', config: { min_confidence: 70, batch_size: 50 } },
};

export async function runJob(name) {
  const job = SCHEDULE_MAP[name];
  if (!job) throw new Error(`Unknown job: ${name}`);
  const handler = HANDLERS[job.handler];
  if (!handler) throw new Error(`Unknown handler: ${job.handler}`);
  return handler(job.config);
}

export const runJobByName = runJob;

export async function runDueJobs() {
  const results = { total: 0, executed: 0, failed: 0, details: [], errors: [] };
  for (const [name, job] of Object.entries(SCHEDULE_MAP)) {
    results.total++;
    if (shouldRunNow(job.schedule)) {
      try {
        await runJob(name);
        results.executed++;
        results.details.push({ name, status: 'success' });
      } catch (e) {
        results.failed++;
        results.details.push({ name, status: 'failed', error: e.message });
        results.errors.push({ job: name, error: e.message });
      }
    }
  }
  return results;
}

export const runAllDueJobs = runDueJobs;
export { shouldRunNow, activityLog, forEachRecord, getDaysUntil, getDeadlineRange };
