import { list, get, create, update } from '../engine';
import { emailConfig, emailTemplates } from './email-config';

export { emailConfig, emailTemplates };

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
  if (!template) throw new Error(`Unknown email template: ${key}`);

  const recipients = await (resolvers[template.recipients] || (() => []))(context);
  if (!recipients.length) {
    console.warn(`[EMAIL] No recipients found for template "${key}" in context:`, { entity: context.review?.name || context.engagement?.name || context.client?.name || 'unknown' });
    return;
  }

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
  try {
    const { google } = await import('googleapis');
    const fs = await import('fs');
    const path = await import('path');

    const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
      path.join(process.cwd(), 'service-account.json');

    if (!fs.existsSync(credentialsPath)) {
      console.error('Service account file not found at:', credentialsPath);
      throw new Error('Email service not configured');
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
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
    console.error('[EMAIL] Failed to send:', error.message);
    throw error;
  }
}

export async function generateChecklistPdf(user) {
  try {
    const { list } = await import('../engine');
    const checklists = list('review_checklist', { created_by: user.id });

    if (!checklists.length) return null;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Checklist Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h1 { color: #293241; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .checklist { margin: 20px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f9fafb; }
          .item { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; }
          .status { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
          .pending { background: #fef3c7; color: #92400e; }
          .in_progress { background: #dbeafe; color: #1e40af; }
          .completed { background: #dcfce7; color: #166534; }
          .date { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Weekly Checklist Report</h1>
        <p>Generated for ${user.name} (${user.email})</p>
        ${checklists.map(c => `
          <div class="checklist">
            <h3>${c.name}</h3>
            <p>Progress: ${c.progress || 0}%</p>
            <div class="status ${c.status || 'pending'}">${(c.status || 'pending').replace('_', ' ').toUpperCase()}</div>
            ${c.items && c.items.length ? `<ul>${c.items.map(i => `<li class="item">${i.question || i.text}</li>`).join('')}</ul>` : '<p>No items</p>'}
          </div>
        `).join('')}
        <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
      </body>
      </html>
    `;

    const Buffer = (await import('buffer')).Buffer;
    return Buffer.from(html, 'utf-8');
  } catch (e) {
    console.error(`[EMAIL] Checklist PDF error for ${user.email}:`, e.message);
    throw e;
  }
}
