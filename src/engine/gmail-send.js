import { getGmailClient } from './google-auth';

const DEFAULT_SENDER = process.env.GMAIL_SENDER_EMAIL;
const getClient = (email = DEFAULT_SENDER) => getGmailClient(email);

export async function sendEmail({ to, subject, body, html, cc, bcc, from = DEFAULT_SENDER, attachments = [] }) {
  const gmail = await getClient(from);
  if (!gmail) throw new Error('Gmail client not available');

  const boundary = `boundary_${Date.now()}`;
  let message = [];

  message.push(`From: ${from}`);
  message.push(`To: ${to}`);
  if (cc) message.push(`Cc: ${cc}`);
  if (bcc) message.push(`Bcc: ${bcc}`);
  message.push(`Subject: ${subject}`);
  message.push('MIME-Version: 1.0');

  if (attachments.length > 0) {
    message.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    message.push('');
    message.push(`--${boundary}`);
  }

  if (html) {
    if (attachments.length > 0) {
      message.push(`Content-Type: multipart/alternative; boundary="${boundary}_alt"`);
      message.push('');
      message.push(`--${boundary}_alt`);
    }
    message.push('Content-Type: text/plain; charset=utf-8');
    message.push('');
    message.push(body || '');
    if (attachments.length > 0) {
      message.push(`--${boundary}_alt`);
    }
    message.push('Content-Type: text/html; charset=utf-8');
    message.push('');
    message.push(html);
    if (attachments.length > 0) {
      message.push(`--${boundary}_alt--`);
    }
  } else {
    message.push('Content-Type: text/plain; charset=utf-8');
    message.push('');
    message.push(body || '');
  }

  for (const attachment of attachments) {
    message.push(`--${boundary}`);
    message.push(`Content-Type: ${attachment.mimeType || 'application/octet-stream'}`);
    message.push('Content-Transfer-Encoding: base64');
    message.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
    message.push('');
    const content = Buffer.isBuffer(attachment.content)
      ? attachment.content.toString('base64')
      : Buffer.from(attachment.content).toString('base64');
    message.push(content);
  }

  if (attachments.length > 0) {
    message.push(`--${boundary}--`);
  }

  const raw = Buffer.from(message.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return response.data;
}

export async function sendBulkEmails(emails, delayMs = 100) {
  const results = [];

  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ success: true, messageId: result.id, to: email.to });
    } catch (error) {
      results.push({ success: false, error: error.message, to: email.to });
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return results;
}
