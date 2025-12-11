// Unified Event System - Triggers, Jobs, and Business Logic
// Consolidates triggers.js and jobs.js into a single event-driven system

import { list, get, update, create, remove, count } from '../engine';
import { queueEmail, sendQueuedEmails, generateChecklistPdf } from './email-templates';
import { exportDatabase } from './backup';

// ========================================
// EVENT HANDLERS REGISTRY
// ========================================

const handlers = {
  // Entity lifecycle events
  entity: {},
  // Scheduled job events
  scheduled: {},
  // Custom action events
  action: {},
};

// ========================================
// ENTITY EVENT HANDLERS
// ========================================

handlers.entity = {
  // === ENGAGEMENT ===
  engagement: {
    afterCreate: async (engagement, user) => {
      // Update client engagement count
      if (engagement.client_id) {
        const engagementCount = count('engagement', { client_id: engagement.client_id });
        update('client', engagement.client_id, { engagement_count: engagementCount });
      }
      // Send emails based on stage
      if (engagement.stage === 'info_gathering') {
        await queueEmail('engagement_info_gathering', { engagement, recipients: 'client_users' });
      }
      // Log activity
      logActivity('engagement', engagement.id, 'create', `Engagement "${engagement.name}" created`, user);
    },

    afterUpdate: async (engagement, changes, prev, user) => {
      // Stage change
      if (changes.stage && changes.stage !== prev.stage) {
        logActivity('engagement', engagement.id, 'stage_change', `Stage: ${prev.stage} → ${changes.stage}`, user, { from: prev.stage, to: changes.stage });

        const stageActions = {
          commencement: () => queueEmail('engagement_commencement', { engagement, recipients: 'client_users' }),
          finalization: () => queueEmail('engagement_finalization', { engagement, recipients: 'client_admin' }),
          close_out: () => {
            if (engagement.letter_auditor_status !== 'accepted' && engagement.progress > 0) {
              throw new Error('Cannot close out: Letter must be accepted or progress must be 0%');
            }
          },
        };
        await stageActions[changes.stage]?.();
      }
      // Status change
      if (changes.status && changes.status !== prev.status) {
        logActivity('engagement', engagement.id, 'status_change', `Status: ${prev.status} → ${changes.status}`, user);
      }
      // Date changes
      if (changes.commencement_date && changes.commencement_date !== prev.commencement_date) {
        await queueEmail('engagement_date_change', { engagement, field: 'commencement_date', recipients: 'team_members' });
      }
    },

    afterDelete: async (engagement) => {
      if (engagement.client_id) {
        const engagementCount = count('engagement', { client_id: engagement.client_id });
        update('client', engagement.client_id, { engagement_count: engagementCount });
      }
    },
  },

  // === CLIENT ===
  client: {
    afterUpdate: async (client, changes, prev, user) => {
      if (changes.status === 'inactive' && prev.status !== 'inactive') {
        const engagements = list('engagement', { client_id: client.id });
        for (const e of engagements) {
          if (e.repeat_interval !== 'once') update('engagement', e.id, { repeat_interval: 'once' });
          if (e.stage === 'info_gathering' && e.progress === 0) remove('engagement', e.id);
        }
        logActivity('client', client.id, 'status_change', `Client inactive. Updated ${engagements.length} engagements.`, user);
      }
    },
  },

  // === RFI ===
  rfi: {
    afterUpdate: async (rfi, changes, prev, user) => {
      if (changes.status !== undefined && changes.status !== prev.status) {
        if (changes.status === 1 && !rfi.date_resolved) {
          update('rfi', rfi.id, { date_resolved: Math.floor(Date.now() / 1000) });
        }
        if (changes.client_status && changes.client_status !== prev.client_status) {
          await queueEmail('rfi_status_change', { rfi, from: prev.client_status, to: changes.client_status, recipients: 'assigned_users' });
        }
        logActivity('rfi', rfi.id, 'status_change', `Status: ${prev.status} → ${changes.status}`, user);
      }
      if (changes.deadline && changes.deadline !== prev.deadline) {
        await queueEmail('rfi_deadline_change', { rfi, newDeadline: changes.deadline, recipients: 'assigned_users' });
        logActivity('rfi', rfi.id, 'update', `Deadline: ${new Date(changes.deadline * 1000).toLocaleDateString()}`, user);
      }
      if (changes.status !== undefined || changes.client_status !== undefined) {
        await updateEngagementProgress(rfi.engagement_id);
      }
    },
  },

  // === TEAM ===
  team: {
    afterUpdate: async (team, changes, prev) => {
      if (changes.users && prev.users) {
        const prevUsers = JSON.parse(prev.users || '[]');
        const newUsers = JSON.parse(changes.users || '[]');
        const removed = prevUsers.filter(u => !newUsers.includes(u));
        if (removed.length > 0) {
          for (const e of list('engagement', { team_id: team.id })) {
            const users = JSON.parse(e.users || '[]').filter(u => !removed.includes(u));
            if (users.length !== JSON.parse(e.users || '[]').length) {
              update('engagement', e.id, { users: JSON.stringify(users) });
            }
          }
        }
      }
    },
  },

  // === REVIEW ===
  review: {
    afterCreate: async (review, user) => {
      await queueEmail('review_created', { review, recipients: 'team_partners' });
      if (review.template_id) {
        const template = get('template', review.template_id);
        for (const id of JSON.parse(template?.default_checklists || '[]')) {
          const checklist = get('checklist', id);
          if (checklist) create('review_checklist', { review_id: review.id, checklist_id: id, items: checklist.section_items || checklist.items, status: 'pending' }, user);
        }
      }
      logActivity('review', review.id, 'create', `Review "${review.name}" created`, user);
    },

    afterUpdate: async (review, changes, prev, user) => {
      if (changes.status && changes.status !== prev.status) {
        await queueEmail('review_status_change', { review, from: prev.status, to: changes.status, recipients: 'team_members' });
        logActivity('review', review.id, 'status_change', `Status: ${prev.status} → ${changes.status}`, user);
      }
      if (changes.collaborators && changes.collaborators !== prev.collaborators) {
        const added = JSON.parse(changes.collaborators || '[]').filter(c => !JSON.parse(prev.collaborators || '[]').find(p => p.id === c.id));
        for (const c of added) await queueEmail('collaborator_added', { review, collaborator: c, recipients: 'collaborator' });
      }
    },
  },

  // === HIGHLIGHT ===
  highlight: {
    beforeDelete: async (highlight, user) => {
      create('removed_highlight', { review_id: highlight.review_id, original_id: highlight.id, highlight_data: JSON.stringify(highlight) }, user);
    },
  },

  // === COLLABORATOR ===
  collaborator: {
    afterCreate: async (collaborator, user) => {
      const review = get('review', collaborator.review_id);
      const collabUser = get('user', collaborator.user_id);
      if (review && collabUser) {
        await queueEmail('collaborator_added', { review, collaborator: collabUser, type: collaborator.type, expiresAt: collaborator.expires_at, recipients: 'collaborator' });
      }
    },
  },
};

// ========================================
// SCHEDULED JOB HANDLERS
// ========================================

handlers.scheduled = {
  daily_backup: {
    schedule: '0 2 * * *',
    description: 'Export database to backup',
    run: async () => { await exportDatabase(); },
  },

  daily_user_sync: {
    schedule: '0 3 * * *',
    description: 'Sync users from Google Workspace',
    run: async () => {
      const scriptUrl = process.env.USER_SYNC_SCRIPT_URL;
      const syncKey = process.env.USER_SYNC_KEY;
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
      } catch (e) { console.error('[JOB] User sync error:', e.message); }
    },
  },

  daily_engagement_check: {
    schedule: '0 4 * * *',
    description: 'Auto-transition engagements',
    run: async () => {
      const now = Math.floor(Date.now() / 1000);
      for (const e of list('engagement', { stage: 'info_gathering', status: 'active' })) {
        if (e.commencement_date && e.commencement_date <= now) {
          update('engagement', e.id, { stage: 'commencement' });
          logActivity('engagement', e.id, 'stage_change', 'Auto-transitioned to commencement');
        }
      }
    },
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
    },
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
    },
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
    },
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
    },
  },

  daily_temp_access_cleanup: {
    schedule: '0 0 * * *',
    description: 'Remove expired collaborators',
    run: async () => {
      const now = Math.floor(Date.now() / 1000);
      for (const c of list('collaborator', { type: 'temporary' })) {
        if (c.expires_at && c.expires_at < now) remove('collaborator', c.id);
      }
    },
  },

  weekly_checklist_pdfs: {
    schedule: '0 8 * * 1',
    description: 'Weekly checklist PDF reports',
    run: async () => {
      for (const p of list('user', { role: 'partner', status: 'active' })) {
        try {
          const url = await generateChecklistPdf(p);
          if (url) await queueEmail('weekly_checklist_pdf', { user: p, pdfUrl: url, date: new Date().toISOString().split('T')[0], recipients: 'user' });
        } catch (e) { console.error(`[JOB] Checklist PDF error for ${p.email}:`, e.message); }
      }
    },
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
    },
  },

  yearly_engagement_recreation: {
    schedule: '0 0 1 1 *',
    description: 'Yearly engagement recreation',
    run: async () => { await recreateEngagements('yearly'); },
  },

  monthly_engagement_recreation: {
    schedule: '0 0 1 * *',
    description: 'Monthly engagement recreation',
    run: async () => { await recreateEngagements('monthly'); },
  },

  hourly_email_processing: {
    schedule: '0 * * * *',
    description: 'Process email queue',
    run: async () => { await sendQueuedEmails(); },
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function logActivity(entityType, entityId, action, message, user, details) {
  create('activity_log', { entity_type: entityType, entity_id: entityId, action, message, details: details ? JSON.stringify(details) : null, user_email: user?.email }, user);
}

async function updateEngagementProgress(engagementId) {
  const rfis = list('rfi', { engagement_id: engagementId });
  if (rfis.length === 0) return;
  const completed = rfis.filter(r => r.status === 1 || r.client_status === 'completed');
  update('engagement', engagementId, { progress: Math.round((completed.length / rfis.length) * 100) });
}

async function recreateEngagements(interval) {
  const { recreateEngagement } = await import('./recreation');
  for (const e of list('engagement', { repeat_interval: interval, status: 'active' })) {
    try {
      await recreateEngagement(e.id);
    } catch (error) {
      create('recreation_log', { engagement_id: e.id, client_id: e.client_id, status: 'failed', error: error.message });
    }
  }
}

// ========================================
// VALIDATION FUNCTIONS
// ========================================

export function validateStageTransition(engagement, newStage, user) {
  const stages = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'];
  const curr = stages.indexOf(engagement.stage), next = stages.indexOf(newStage);

  if (!['partner', 'manager'].includes(user.role)) throw new Error('Only partners and managers can change stage');
  if (engagement.status === 'pending') throw new Error('Cannot change stage while pending');
  if (newStage === 'close_out' && user.role !== 'partner') throw new Error('Only partners can close out');
  if (newStage === 'close_out' && engagement.letter_auditor_status !== 'accepted' && engagement.progress > 0) {
    throw new Error('Cannot close out: Letter must be accepted or progress must be 0%');
  }
  if (next < curr && !{ team_execution: ['commencement'], partner_review: ['team_execution'] }[engagement.stage]?.includes(newStage)) {
    throw new Error(`Cannot go backward from ${engagement.stage} to ${newStage}`);
  }
  return true;
}

export function validateRfiStatusChange(rfi, newStatus, user) {
  if (user.type !== 'auditor' || user.role === 'clerk') {
    const e = get('engagement', rfi.engagement_id);
    if (!e?.clerks_can_approve) throw new Error('Only auditors (not clerks) can change RFI status');
  }
  if (newStatus === 1) {
    const hasFiles = rfi.files_count > 0 || JSON.parse(rfi.files || '[]').length > 0;
    const hasResponses = rfi.response_count > 0 || JSON.parse(rfi.responses || '[]').length > 0;
    if (!hasFiles && !hasResponses) throw new Error('RFI must have files or responses before completing');
  }
  return true;
}

export function calculateWorkingDays(start, end) {
  if (!start) return 0;
  let count = 0;
  const curr = new Date(start * 1000), endDate = end ? new Date(end * 1000) : new Date();
  while (curr <= endDate) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) count++;
    curr.setDate(curr.getDate() + 1);
  }
  return count;
}

// ========================================
// EVENT EXECUTION API
// ========================================

export async function emit(entityName, event, ...args) {
  const handler = handlers.entity[entityName]?.[event];
  if (!handler) return;
  try {
    await handler(...args);
  } catch (error) {
    console.error(`[EVENT] ${entityName}.${event} error:`, error.message);
    if (error.message.includes('Cannot') || error.message.includes('Only')) throw error;
  }
}

export async function runJob(name) {
  const job = handlers.scheduled[name];
  if (!job) throw new Error(`Unknown job: ${name}`);
  console.log(`[JOB] Running ${name}...`);
  const start = Date.now();
  try {
    await job.run(job.config);
    console.log(`[JOB] ${name} completed in ${Date.now() - start}ms`);
  } catch (e) {
    console.error(`[JOB] ${name} failed:`, e.message);
    throw e;
  }
}

export function getJobs() {
  return Object.entries(handlers.scheduled).map(([name, job]) => ({ name, schedule: job.schedule, description: job.description }));
}

export function shouldRunNow(schedule) {
  const [m, h, dom, mon, dow] = schedule.split(' '), now = new Date();
  const match = (f, v) => f === '*' || parseInt(f) === v;
  return match(m, now.getMinutes()) && match(h, now.getHours()) && match(dom, now.getDate()) && match(mon, now.getMonth() + 1) && match(dow, now.getDay());
}

export async function runDueJobs() {
  for (const [name, job] of Object.entries(handlers.scheduled)) {
    if (shouldRunNow(job.schedule)) {
      try { await runJob(name); } catch (e) { console.error(`[JOB] ${name}:`, e.message); }
    }
  }
}

// Backwards compatibility exports
export const triggers = handlers.entity;
export const scheduledJobs = handlers.scheduled;
export const executeTrigger = emit;
