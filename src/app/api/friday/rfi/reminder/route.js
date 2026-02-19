import { getDatabase, now, genId } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { get } from '@/engine';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

const PRIORITY_LABELS = { high: 'URGENT', medium: 'Reminder', low: 'Gentle Reminder' };

function buildReminderEmail(rfi, engagement, client, priority) {
  const label = PRIORITY_LABELS[priority] || 'Reminder';
  const subject = `[${label}] RFI Response Required - ${engagement.name || engagement.id}`;
  const html = `
    <p>Dear Client,</p>
    <p>This is a <b>${label.toLowerCase()}</b> that the following RFI item requires your response:</p>
    <ul>
      <li><b>Engagement:</b> ${engagement.name || engagement.id}</li>
      <li><b>RFI:</b> ${rfi.name || rfi.id}</li>
      <li><b>Deadline:</b> ${rfi.deadline_date ? new Date(rfi.deadline_date * 1000).toLocaleDateString() : 'Not set'}</li>
      <li><b>Status:</b> ${rfi.client_status || 'Pending'}</li>
    </ul>
    <p>Please log in to respond at your earliest convenience.</p>
  `.trim();

  return { subject, html, text: subject };
}

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (user.type === 'client') {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only auditor users can send RFI reminders' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { rfi_id, engagement_id, priority, recipient_emails } = body;

  if (!rfi_id || !engagement_id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'rfi_id and engagement_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const validPriorities = ['high', 'medium', 'low'];
  const emailPriority = validPriorities.includes(priority) ? priority : 'medium';

  const db = getDatabase();
  const rfi = db.prepare('SELECT * FROM rfi WHERE id = ? AND engagement_id = ?').get(rfi_id, engagement_id);

  if (!rfi) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'RFI not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const engagement = get('engagement', engagement_id);
  if (!engagement) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Engagement not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const client = db.prepare('SELECT id, name FROM client WHERE id = ?').get(engagement.client_id);

  let recipients = recipient_emails;
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    const assignedUsers = (rfi.assigned_users || '').split(',').filter(Boolean);
    if (assignedUsers.length > 0) {
      const placeholders = assignedUsers.map(() => '?').join(',');
      recipients = db.prepare(`SELECT email FROM users WHERE id IN (${placeholders}) AND status = 'active'`)
        .all(...assignedUsers).map(u => u.email);
    }

    if (!recipients || recipients.length === 0) {
      recipients = db.prepare(
        "SELECT email FROM users WHERE client_id = ? AND role = 'client_admin' AND status = 'active'"
      ).all(engagement.client_id).map(u => u.email);
    }
  }

  if (recipients.length === 0) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'No recipients found' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const emailContent = buildReminderEmail(rfi, engagement, client, emailPriority);
  const timestamp = now();
  const sender = process.env.EMAIL_FROM || 'noreply@bidwise.app';
  const emailIds = [];

  for (const recipientEmail of recipients) {
    const emailId = genId();
    db.prepare(`
      INSERT INTO email (id, recipient_email, sender_email, subject, body, html_body, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(emailId, recipientEmail, sender, emailContent.subject, emailContent.text, emailContent.html, 'pending', timestamp);
    emailIds.push(emailId);
  }

  logAction('rfi', rfi_id, 'reminder_sent', user.id, null, {
    engagement_id, priority: emailPriority, recipient_count: recipients.length
  });

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        rfi_id,
        engagement_id,
        priority: emailPriority,
        recipients: recipients.length,
        email_ids: emailIds
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'rfi-reminder');
