import { list, get, create, update } from '@/engine';
import { getGmailClient } from '@/adapters/google-auth';
import { GoogleAdapter } from '@/adapters/google-adapter-base';
import { config } from '@/config/env';

const escapeHtml = (t) => (t || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);

const RECIPIENT_RESOLVERS = {
  team: (ctx, spec) => {
    const teamId = ctx.review?.team_id || ctx.engagement?.team_id;
    if (!teamId) return [];
    const team = get('team', teamId);
    if (!team) return [];
    const ids = spec.role === 'partners'
      ? JSON.parse(team.partners || '[]')
      : [...new Set([...JSON.parse(team.partners || '[]'), ...JSON.parse(team.users || '[]')])];
    return ids.map(id => get('user', id)).filter(Boolean);
  },
  collaborator: (ctx) =>
    ctx.collaborator?.email ? [ctx.collaborator] : (ctx.collaborator?.user_id ? [get('user', ctx.collaborator.user_id)].filter(Boolean) : []),
  client: (ctx, spec) => {
    const clientId = ctx.engagement?.client_id || ctx.client?.id;
    if (!clientId) return [];
    const users = list('client_user', { client_id: clientId, status: 'active' });
    return (spec.role ? users.filter(u => u.role === spec.role) : users).map(cu => get('user', cu.user_id)).filter(Boolean);
  },
  single: (ctx, spec) => {
    const val = spec.field.split('.').reduce((obj, key) => obj?.[key], ctx);
    return val ? [val] : [];
  },
  list: (ctx, spec) => list(spec.entity, spec.filter || {}),
  static: (ctx, spec) => spec.emails || [],
};

export const EMAIL_RESOLVERS = {
  team_members: { type: 'team', role: 'all' },
  team_partners: { type: 'team', role: 'partners' },
  client_users: { type: 'client' },
  client_user: { type: 'client' },
  client_admin: { type: 'client', role: 'admin' },
  collaborator: { type: 'collaborator' },
  assigned_users: { type: 'single', field: 'rfi.assigned_to' },
  partners: { type: 'static', emails: [] },
  user: { type: 'single', field: 'user' },
  new_client_user: { type: 'single', field: 'user' },
  partners_and_managers: { type: 'list', entity: 'user', filter: { type: 'auditor', status: 'active' } },
  collaborator_email: { type: 'collaborator' },
};

const TEMPLATES = {
  engagement_info_gathering: (c) => ({ subject: `New Engagement: ${escapeHtml(c.engagement?.name)}`, html: `<h2>New Engagement: ${escapeHtml(c.engagement?.name)}</h2><ul><li><strong>Client:</strong> ${escapeHtml(c.client?.name)}</li><li><strong>Year:</strong> ${c.year}</li></ul><p><a href="${escapeHtml(c.engagement_url)}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">View Engagement</a></p>` }),
  engagement_commencement: (c) => ({ subject: `Engagement Commenced: ${escapeHtml(c.engagement?.name)}`, html: `<h2>Engagement Commenced: ${escapeHtml(c.engagement?.name)}</h2><p><a href="${escapeHtml(c.engagement_url)}">View Engagement</a></p>` }),
  engagement_finalization: (c) => ({ subject: `Engagement Complete: ${escapeHtml(c.engagement?.name)}`, html: `<h2>Engagement Complete: ${escapeHtml(c.engagement?.name)}</h2><p><a href="${escapeHtml(c.engagement_url)}">Rate Engagement</a></p>` }),
  engagement_stage_change: (c) => ({ subject: `Stage Changed: ${escapeHtml(c.engagement?.name)}`, html: `<h2>Stage Changed</h2><p>${escapeHtml(c.from_stage)} -> ${escapeHtml(c.to_stage)}</p>` }),
  engagement_date_change: (c) => ({ subject: `Date Updated: ${escapeHtml(c.engagement?.name)}`, html: `<h2>Date Updated</h2><p>${escapeHtml(c.field)}: ${c.new_date}</p>` }),
  review_created: (c) => ({ subject: `New Review: ${escapeHtml(c.review?.name)}`, html: `<h2>New Review: ${escapeHtml(c.review?.name)}</h2><p>Team: ${escapeHtml(c.team_name)}</p><p><a href="${escapeHtml(c.review_url)}">View Review</a></p>` }),
  review_status_change: (c) => ({ subject: `Review Status: ${escapeHtml(c.review?.name)}`, html: `<h2>Review Status</h2><p>${escapeHtml(c.from)} -> ${escapeHtml(c.to)}</p>` }),
  rfi_deadline: (c) => ({ subject: `RFI Deadline: ${escapeHtml(c.engagement?.name)}`, html: `<h2>RFI Deadline</h2><p>${escapeHtml(c.question)} - ${c.daysUntil} days</p>` }),
  rfi_status_change: (c) => ({ subject: `RFI Status: ${escapeHtml(c.engagement?.name)}`, html: `<h2>RFI Status</h2><p>${escapeHtml(c.from)} -> ${escapeHtml(c.to)}</p>` }),
  rfi_deadline_change: (c) => ({ subject: `RFI Deadline Changed: ${escapeHtml(c.engagement?.name)}`, html: `<h2>RFI Deadline Changed</h2><p>New: ${c.newDeadline}</p>` }),
  rfi_response: (c) => ({ subject: `New RFI Response: ${escapeHtml(c.engagement?.name)}`, html: `<h2>New Response</h2><p>By: ${escapeHtml(c.responded_by)}</p>` }),
  rfi_reminder: (c) => ({ subject: `RFI Reminder: ${escapeHtml(c.engagement?.name)}`, html: `<h2>RFI Reminder</h2><p>${escapeHtml(c.question)} - ${c.days_outstanding} days</p>` }),
  rfi_escalation: (c) => ({ subject: `ESCALATION: RFI Outstanding ${c.daysOutstanding} Days - ${escapeHtml(c.engagement?.name)}`, html: `<h2 style="color:#dc2626">ESCALATION: ${c.daysOutstanding} Days</h2><p>${escapeHtml(c.rfi?.question)}</p><p><a href="${escapeHtml(c.rfi_url)}" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:4px">View RFI</a></p>` }),
  collaborator_added: (c) => ({ subject: `Collaborator Access: ${escapeHtml(c.review?.name)}`, html: `<h2>Collaborator Access Granted</h2><p>Review: ${escapeHtml(c.review?.name)}</p><p>Expires: ${c.expires_at || c.expiresAt || 'Never'}</p>` }),
  collaborator_removed: (c) => ({ subject: `Collaborator Access Removed: ${escapeHtml(c.review?.name)}`, html: `<h2>Access Removed</h2><p>Review: ${escapeHtml(c.review?.name)}</p>` }),
  collaborator_expiry_7day_warning: (c) => ({ subject: `Access Expiring in 7 Days - ${escapeHtml(c.review_name)}`, html: `<h2 style="color:#f59e0b">Access Expiring Soon</h2><p>Hello ${escapeHtml(c.collaborator_name)},</p><p>Review: <strong>${escapeHtml(c.review_name)}</strong></p><p>Expires: <strong>${escapeHtml(c.expires_date)}</strong></p>` }),
  tender_deadline_7days: (c) => ({ subject: `Tender Deadline in 7 Days: ${escapeHtml(c.review?.name)}`, html: `<h2>Tender Deadline in 7 Days</h2><p>Review: ${escapeHtml(c.review?.name)}</p>` }),
  tender_deadline_today: (c) => ({ subject: `URGENT: Tender Due Today: ${escapeHtml(c.review?.name)}`, html: `<h2>Tender Due Today</h2><p>Review: ${escapeHtml(c.review?.name)}</p>` }),
  weekly_checklist_pdf: (c) => ({ subject: `Weekly Checklist Report - ${c.date}`, html: `<h2>Weekly Checklist Report</h2><p>Date: ${c.date}</p>` }),
  weekly_client_engagement: (c) => ({ subject: `Weekly Summary: ${escapeHtml(c.client?.name)}`, html: `<h2>Weekly Summary</h2><p>${escapeHtml(c.client?.name)}</p>` }),
  weekly_client_master: (c) => ({ subject: 'Weekly Master Summary', html: `<h2>Weekly Master Summary</h2>` }),
  daily_digest: (c) => ({ subject: `Daily Summary - ${c.date}`, html: `<h2>Daily Summary</h2><p>${(c.notifications || []).length} notifications</p>` }),
  client_signup: (c) => ({ subject: 'Welcome to the Client Portal', html: `<h2>Welcome!</h2><p><a href="${escapeHtml(c.password_reset_url)}">Set Password</a></p>` }),
  password_reset: (c) => ({ subject: 'Password Reset Request', html: `<h2>Password Reset</h2><p><a href="${escapeHtml(c.reset_url)}">Reset Password</a></p>` }),
  bug_report: (c) => ({ subject: `Bug Report: ${escapeHtml(c.summary)}`, html: `<h2>Bug Report</h2><pre>${escapeHtml(c.summary)}\n${escapeHtml(c.details)}</pre>` }),
};

export const EMAIL_TEMPLATES = TEMPLATES;

function resolveRecipients(spec, ctx) {
  if (!spec) return [];
  const resolver = RECIPIENT_RESOLVERS[spec.type];
  return resolver ? resolver(ctx, spec) : [];
}

export async function queueEmail(key, context) {
  const templateFn = TEMPLATES[key];
  if (!templateFn) { console.warn(`[Notification] Unknown template: ${key}`); return; }

  const resolverSpec = EMAIL_RESOLVERS[context.recipients];
  const recipients = resolveRecipients(resolverSpec, context);
  if (!recipients.length) return;

  const baseUrl = config.app?.url || process.env.APP_URL || 'http://localhost:3004';
  const ctx = {
    ...context,
    review_url: context.review ? `${baseUrl}/review/${context.review.id}` : '',
    engagement_url: context.engagement ? `${baseUrl}/engagement/${context.engagement.id}` : '',
    rfi_url: context.rfi ? `${baseUrl}/engagement/${context.rfi.engagement_id}` : '',
    portal_url: baseUrl,
    review_name: context.review?.name || '',
    team_name: get('team', context.review?.team_id || context.engagement?.team_id)?.name || '',
    date: new Date().toISOString().split('T')[0],
    question: context.rfi?.question || '',
  };

  const rendered = templateFn(ctx);

  for (const r of recipients) {
    if (r.email) {
      try {
        create('notification', { type: key, recipient_id: r.id, recipient_email: r.email, subject: rendered.subject, content: rendered.html, entity_type: context.review ? 'review' : context.engagement ? 'engagement' : 'rfi', entity_id: context.review?.id || context.engagement?.id || context.rfi?.id, status: 'pending' });
      } catch (e) { console.error(`[Notification] Queue error:`, e.message); }
    }
  }
}

export async function sendNotification(key, context) {
  await queueEmail(key, context);
  await sendQueuedEmails();
}

const EMAIL_DEFAULTS = {
  from: process.env.EMAIL_FROM || process.env.GMAIL_SENDER_EMAIL || 'noreply@example.com',
  retryAttempts: 3,
};

export { EMAIL_DEFAULTS };

export async function sendQueuedEmails(limit = 50) {
  const pending = list('notification', { status: 'pending' });
  for (const n of pending.slice(0, limit)) {
    try {
      await sendEmailViaGmail(n);
      update('notification', n.id, { status: 'sent', sent_at: Math.floor(Date.now() / 1000) });
    } catch (e) {
      const retry = (n.retry_count || 0) + 1;
      update('notification', n.id, { status: retry >= EMAIL_DEFAULTS.retryAttempts ? 'failed' : 'pending', error: e.message, retry_count: retry });
    }
  }
}

async function sendEmailViaGmail(n) {
  const DEFAULT_SENDER = process.env.GMAIL_SENDER_EMAIL;
  const adapter = new GoogleAdapter('Gmail', () => getGmailClient(DEFAULT_SENDER));
  await adapter.safeExecute(async (gmail) => {
    const htmlContent = `<!DOCTYPE html><html><head><style>body{font-family:system-ui;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}h2{color:#293241}a{color:#3b82f6}li{margin:5px 0}</style></head><body>${n.content}<hr style="margin-top:30px;border:none;border-top:1px solid #ddd"><p style="font-size:12px;color:#666">Automated message - do not reply</p></body></html>`;
    const message = [`From: ${EMAIL_DEFAULTS.from}`, `To: ${n.recipient_email}`, 'Content-Type: text/html; charset="UTF-8"', 'MIME-Version: 1.0', `Subject: ${n.subject}`, '', htmlContent].join('\n');
    const raw = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  }, 'send');
}

export function getEmailTemplate(templateName, context) {
  const fn = TEMPLATES[templateName];
  if (!fn) throw new Error(`Unknown template: ${templateName}`);
  return fn(context);
}

export function resolveRecipientsForTemplate(resolver, context) {
  if (typeof resolver === 'string' && EMAIL_RESOLVERS[resolver]) {
    const spec = EMAIL_RESOLVERS[resolver];
    return resolveRecipients(spec, context);
  }
  return Array.isArray(resolver) ? resolver : [];
}

export { generateChecklistPdf } from '@/engine/generate-checklist-pdf';
export const emailConfig = EMAIL_DEFAULTS;
export const emailTemplates = TEMPLATES;
