// Email Templates and Notification System
// Compact template builder pattern for reduced code size

import { list, get, create, update } from '../engine';

// ========================================
// CONFIG
// ========================================

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@example.com',
  retryAttempts: 3,
};

// ========================================
// TEMPLATE BUILDER
// ========================================

const t = (subject, recipients, fields, cta) => ({
  subject,
  recipients,
  render: (ctx) => {
    const items = fields.map(([label, key]) => `<li><strong>${label}:</strong> ${ctx[key] || 'N/A'}</li>`).join('');
    const button = cta ? `<p><a href="${ctx[cta[1]]}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">${cta[0]}</a></p>` : '';
    return `<h2>${subject.replace(/{{.*?}}/g, '')}</h2><ul>${items}</ul>${button}`;
  },
});

// ========================================
// TEMPLATES
// ========================================

export const emailTemplates = {
  // Review
  review_created: t('New Review: {{review_name}}', 'team_partners', [['Review', 'review_name'], ['Team', 'team_name'], ['Year', 'financial_year'], ['Created By', 'created_by']], ['View Review', 'review_url']),
  review_status_change: t('Review Status: {{review_name}}', 'team_members', [['Review', 'review_name'], ['From', 'from_status'], ['To', 'to_status']], ['View Review', 'review_url']),
  collaborator_added: t('Collaborator Access: {{review_name}}', 'collaborator', [['Review', 'review_name'], ['Type', 'access_type'], ['Expires', 'expires_at'], ['Added By', 'added_by']], ['View Review', 'review_url']),
  tender_deadline_7days: t('Tender Deadline in 7 Days: {{review_name}}', 'team_partners', [['Review', 'review_name'], ['Deadline', 'deadline'], ['Team', 'team_name']], ['View Review', 'review_url']),
  tender_deadline_today: t('URGENT: Tender Due Today: {{review_name}}', 'team_partners', [['Review', 'review_name'], ['Deadline', 'deadline']], ['View Review', 'review_url']),
  weekly_checklist_pdf: { subject: 'Weekly Checklist Report - {{date}}', recipients: 'partners', attachment: 'checklist_pdf', render: (ctx) => `<h2>Weekly Checklist Report</h2><p>Report Date: ${ctx.date}</p>` },

  // Engagement
  engagement_info_gathering: t('New Engagement: {{engagement_name}}', 'client_users', [['Engagement', 'engagement_name'], ['Client', 'client_name'], ['Year', 'year'], ['Type', 'engagement_type']], ['View Engagement', 'engagement_url']),
  engagement_commencement: t('Engagement Commenced: {{engagement_name}}', 'client_users', [['Engagement', 'engagement_name'], ['Client', 'client_name'], ['Date', 'commencement_date']], ['View Engagement', 'engagement_url']),
  engagement_finalization: t('Engagement Complete: {{engagement_name}}', 'client_admin', [['Engagement', 'engagement_name'], ['Client', 'client_name'], ['Year', 'year']], ['Rate Engagement', 'engagement_url']),
  engagement_stage_change: t('Stage Changed: {{engagement_name}}', 'team_members', [['Engagement', 'engagement_name'], ['From', 'from_stage'], ['To', 'to_stage']], ['View Engagement', 'engagement_url']),
  engagement_date_change: t('Date Updated: {{engagement_name}}', 'team_members', [['Engagement', 'engagement_name'], ['Field', 'field'], ['New Date', 'new_date']], ['View Engagement', 'engagement_url']),

  // RFI
  rfi_deadline: t('RFI Deadline: {{engagement_name}}', 'assigned_users', [['Question', 'question'], ['Engagement', 'engagement_name'], ['Deadline', 'deadline'], ['Days Until', 'daysUntil']], ['View RFI', 'rfi_url']),
  rfi_status_change: t('RFI Status: {{engagement_name}}', 'assigned_users', [['Question', 'question'], ['From', 'from_status'], ['To', 'to_status']], ['View RFI', 'rfi_url']),
  rfi_deadline_change: t('RFI Deadline Changed: {{engagement_name}}', 'assigned_users', [['Question', 'question'], ['New Deadline', 'new_deadline']], ['View RFI', 'rfi_url']),
  rfi_response: t('New RFI Response: {{engagement_name}}', 'team_members', [['Question', 'question'], ['Responded By', 'responded_by']], ['View Response', 'rfi_url']),
  rfi_reminder: t('RFI Reminder: {{engagement_name}}', 'client_users', [['Question', 'question'], ['Engagement', 'engagement_name'], ['Days Outstanding', 'days_outstanding']], ['Respond', 'rfi_url']),

  // Client
  client_signup: { subject: 'Welcome to the Client Portal', recipients: 'new_client_user', render: (ctx) => `<h2>Welcome!</h2><p>Your account: ${ctx.email}</p><p><a href="${ctx.password_reset_url}">Set Password</a></p>` },
  password_reset: { subject: 'Password Reset Request', recipients: 'user', render: (ctx) => `<h2>Password Reset</h2><p><a href="${ctx.reset_url}">Reset Password</a></p>` },
  weekly_client_engagement: t('Weekly Summary: {{client_name}}', 'client_user', [['Client', 'client_name'], ['Engagements', 'engagement_count']], ['View Portal', 'portal_url']),
  weekly_client_master: t('Weekly Master Summary', 'client_admin', [['Total Engagements', 'total_engagements'], ['Outstanding RFIs', 'total_outstanding_rfis']], ['View Portal', 'portal_url']),

  // System
  daily_digest: { subject: 'Daily Summary - {{date}}', recipients: 'user', render: (ctx) => `<h2>Daily Summary</h2><p>${ctx.date}</p><p>${(ctx.notifications || []).length} notifications</p>` },
  bug_report: { subject: 'Bug Report: {{summary}}', recipients: 'developers', render: (ctx) => `<h2>Bug Report</h2><pre>${ctx.summary}\n${ctx.details}</pre>` },
};

// ========================================
// RECIPIENT RESOLVERS
// ========================================

const resolvers = {
  team_partners: (ctx) => getTeamUsers(ctx, 'partners'),
  team_members: (ctx) => getTeamUsers(ctx, 'all'),
  collaborator: (ctx) => ctx.collaborator?.email ? [ctx.collaborator] : (ctx.collaborator?.user_id ? [get('user', ctx.collaborator.user_id)].filter(Boolean) : []),
  client_users: (ctx) => getClientUsers(ctx.engagement?.client_id || ctx.client?.id),
  client_admin: (ctx) => getClientUsers(ctx.engagement?.client_id || ctx.client?.id, 'admin'),
  client_user: (ctx) => ctx.user ? [ctx.user] : [],
  assigned_users: (ctx) => JSON.parse(ctx.rfi?.assigned_users || '[]').map(id => get('user', id)).filter(Boolean),
  user: (ctx) => ctx.user ? [ctx.user] : [],
  partners: () => list('user', { role: 'partner', status: 'active' }),
  developers: () => [{ email: process.env.DEVELOPER_EMAIL || 'dev@example.com' }],
  new_client_user: (ctx) => ctx.user ? [ctx.user] : [],
};

function getTeamUsers(ctx, type) {
  const teamId = ctx.review?.team_id || ctx.engagement?.team_id;
  if (!teamId) return [];
  const team = get('team', teamId);
  if (!team) return [];
  const ids = type === 'partners' ? JSON.parse(team.partners || '[]') : [...new Set([...JSON.parse(team.partners || '[]'), ...JSON.parse(team.users || '[]')])];
  return ids.map(id => get('user', id)).filter(Boolean);
}

function getClientUsers(clientId, role) {
  if (!clientId) return [];
  const users = list('client_user', { client_id: clientId, status: 'active' });
  return (role ? users.filter(u => u.role === role) : users).map(cu => get('user', cu.user_id)).filter(Boolean);
}

// ========================================
// EMAIL API
// ========================================

export async function queueEmail(key, context) {
  const template = emailTemplates[key];
  if (!template) return console.error(`Unknown template: ${key}`);

  const recipients = await (resolvers[template.recipients] || (() => []))(context);
  if (!recipients.length) return;

  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const ctx = {
    ...context,
    review_url: context.review ? `${baseUrl}/review/${context.review.id}` : '',
    engagement_url: context.engagement ? `${baseUrl}/engagement/${context.engagement.id}` : '',
    rfi_url: context.rfi ? `${baseUrl}/engagement/${context.rfi.engagement_id}` : '',
    portal_url: baseUrl,
    review_name: context.review?.name || '',
    engagement_name: context.engagement?.name || '',
    client_name: context.client?.name || '',
    team_name: get('team', context.review?.team_id || context.engagement?.team_id)?.name || '',
    date: new Date().toISOString().split('T')[0],
    question: context.rfi?.question || '',
  };

  const subject = template.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => ctx[k] || '');
  const content = template.render ? template.render(ctx) : '';

  for (const r of recipients) {
    if (r.email) create('notification', { type: key, recipient_id: r.id, recipient_email: r.email, subject, content, entity_type: context.review ? 'review' : context.engagement ? 'engagement' : 'rfi', entity_id: context.review?.id || context.engagement?.id || context.rfi?.id, status: 'pending' });
  }
}

export async function sendNotification(key, context) {
  await queueEmail(key, context);
  await sendQueuedEmails();
}

export async function sendQueuedEmails(limit = 50) {
  for (const n of list('notification', { status: 'pending' }).slice(0, limit)) {
    try {
      await sendEmail(n);
      update('notification', n.id, { status: 'sent', sent_at: Math.floor(Date.now() / 1000) });
    } catch (e) {
      const retry = (n.retry_count || 0) + 1;
      update('notification', n.id, { status: retry >= emailConfig.retryAttempts ? 'failed' : 'pending', error: e.message, retry_count: retry });
    }
  }
}

async function sendEmail(n) {
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });
  await transporter.sendMail({
    from: emailConfig.from,
    to: n.recipient_email,
    subject: n.subject,
    html: `<!DOCTYPE html><html><head><style>body{font-family:system-ui;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}h2{color:#293241}a{color:#3b82f6}li{margin:5px 0}</style></head><body>${n.content}<hr style="margin-top:30px;border:none;border-top:1px solid #ddd"><p style="font-size:12px;color:#666">Automated message - do not reply</p></body></html>`,
  });
}

export async function generateChecklistPdf(user) {
  console.log(`[EMAIL] Checklist PDF not implemented for ${user.email}`);
  return null;
}
