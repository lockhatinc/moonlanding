import { getDatabase, now, genId } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (!['partner', 'manager'].includes(user.role)) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only partners and managers can send test emails' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { client_id, email_addresses } = body;

  if (!client_id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'client_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();

  const client = db.prepare('SELECT id, name FROM client WHERE id = ?').get(client_id);
  if (!client) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Client not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let recipients = email_addresses;
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    const clientUsers = db.prepare(
      "SELECT email FROM users WHERE client_id = ? AND status = 'active'"
    ).all(client_id);
    recipients = clientUsers.map(u => u.email).filter(Boolean);
  }

  if (recipients.length === 0) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'No email addresses found for this client' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const results = [];
  const timestamp = now();
  const sender = process.env.EMAIL_FROM || 'noreply@bidwise.app';

  for (const emailAddr of recipients) {
    if (!EMAIL_REGEX.test(emailAddr)) {
      results.push({ email: emailAddr, status: 'invalid', error: 'Invalid email format' });
      continue;
    }

    const emailId = genId();
    db.prepare(`
      INSERT INTO email (id, recipient_email, sender_email, subject, body, html_body, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      emailId,
      emailAddr,
      sender,
      `Test Email - ${client.name}`,
      `This is a test email to verify your email address for ${client.name}.`,
      `<p>This is a test email to verify your email address for <b>${client.name}</b>.</p><p>If you received this email, your address is configured correctly.</p>`,
      'pending',
      timestamp
    );

    results.push({ email: emailAddr, status: 'queued', email_id: emailId });
  }

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        client_id,
        client_name: client.name,
        total: recipients.length,
        queued: results.filter(r => r.status === 'queued').length,
        invalid: results.filter(r => r.status === 'invalid').length,
        details: results
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'test-client-emails');
