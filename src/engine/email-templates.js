import { list, get, create, update } from '../engine';
import { EMAIL_DEFAULTS, EMAIL_TEMPLATES, EMAIL_RESOLVERS, LOG_PREFIXES } from '../config';
import { generateChecklistPdf } from './generate-checklist-pdf';
import { GOOGLE_SCOPES } from '@/config/constants';
import { config } from '@/config/env';

export { generateChecklistPdf };
export const emailConfig = EMAIL_DEFAULTS;
export const emailTemplates = EMAIL_TEMPLATES;

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

  json: (ctx, spec) => {
    const arr = JSON.parse(spec.field.split('.').reduce((obj, key) => obj?.[key], ctx) || '[]');
    return arr.map(id => get('user', id)).filter(Boolean);
  },

  list: (ctx, spec) => list(spec.entity, spec.filter || {}),

  static: (ctx, spec) => spec.emails || [],
};

function resolveRecipients(spec, ctx) {
  if (!spec) return [];
  const resolver = RECIPIENT_RESOLVERS[spec.type];
  return resolver ? resolver(ctx, spec) : [];
}

export async function queueEmail(key, context) {
  const template = emailTemplates[key];
  if (!template) throw new Error(`Unknown email template: ${key}`);

  const resolverSpec = EMAIL_RESOLVERS[template.recipients];
  const recipients = resolveRecipients(resolverSpec, context);
  if (!recipients.length) {
    console.warn(`${LOG_PREFIXES.email} No recipients found for template "${key}" in context:`, { entity: context.review?.name || context.engagement?.name || context.client?.name || 'unknown' });
    return;
  }

  const baseUrl = config.app.url;
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
  try {
    const { google } = await import('googleapis');
    const fs = await import('fs');
    const { config } = await import('@/config/env');

    const credentialsPath = config.auth.google.credentialsPath;

    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`[API Error] Service account file not found at: ${credentialsPath}`);
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: GOOGLE_SCOPES.gmail,
    });

    const gmail = google.gmail({ version: 'v1', auth });

    const htmlContent = `<!DOCTYPE html><html><head><style>body{font-family:system-ui;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}h2{color:#293241}a{color:#3b82f6}li{margin:5px 0}</style></head><body>${n.content}<hr style="margin-top:30px;border:none;border-top:1px solid #ddd"><p style="font-size:12px;color:#666">Automated message - do not reply</p></body></html>`;

    const message = [
      `From: ${emailConfig.from}`,
      `To: ${n.recipient_email}`,
      'Content-Type: text/html; charset="UTF-8"',
      'MIME-Version: 1.0',
      `Subject: ${n.subject}`,
      '',
      htmlContent,
    ].join('\n');

    const encodedMessage = Buffer.from(message).toString('base64');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });
  } catch (error) {
    throw new Error(`[API Error] ${'[EMAIL] Failed to send:', error.message}`);
    throw error;
  }
}
