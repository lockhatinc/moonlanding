// Gmail integration using Domain-Wide Delegation
import { getGmailClient } from './google-auth';

// Default sender email (must be a user in the domain)
const DEFAULT_SENDER = process.env.GMAIL_SENDER_EMAIL;

// Helper to get Gmail client with default sender
const getClient = (email = DEFAULT_SENDER) => getGmailClient(email);

// Re-export for backwards compatibility
export { getGmailClient } from './google-auth';

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @param {string} options.cc - CC recipients (optional)
 * @param {string} options.bcc - BCC recipients (optional)
 * @param {string} options.from - Sender email (optional, uses default)
 * @param {Array} options.attachments - Attachments [{filename, content, mimeType}]
 */
export async function sendEmail({ to, subject, body, html, cc, bcc, from = DEFAULT_SENDER, attachments = [] }) {
  const gmail = await getClient(from);
  if (!gmail) throw new Error('Gmail client not available');

  // Build MIME message
  const boundary = `boundary_${Date.now()}`;
  let message = [];

  // Headers
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

  // Body
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

  // Attachments
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

/**
 * Email templates
 */
const templates = {
  rfiReminder: ({ clientName, engagementName, rfiQuestion, deadline, portalUrl }) => ({
    subject: `RFI Reminder: ${engagementName}`,
    body: `Dear ${clientName},

This is a reminder regarding the following request for information:

Engagement: ${engagementName}
Question: ${rfiQuestion}
Deadline: ${deadline}

Please respond at your earliest convenience via the client portal:
${portalUrl}

Thank you.`,
    html: `
<p>Dear ${clientName},</p>
<p>This is a reminder regarding the following request for information:</p>
<ul>
  <li><strong>Engagement:</strong> ${engagementName}</li>
  <li><strong>Question:</strong> ${rfiQuestion}</li>
  <li><strong>Deadline:</strong> ${deadline}</li>
</ul>
<p>Please respond at your earliest convenience via the <a href="${portalUrl}">client portal</a>.</p>
<p>Thank you.</p>
`,
  }),

  engagementNotification: ({ clientName, engagementName, stage, message, portalUrl }) => ({
    subject: `Engagement Update: ${engagementName}`,
    body: `Dear ${clientName},

${message || `Your engagement "${engagementName}" has moved to the ${stage} stage.`}

Access the client portal for more details:
${portalUrl}

Thank you.`,
    html: `
<p>Dear ${clientName},</p>
<p>${message || `Your engagement "<strong>${engagementName}</strong>" has moved to the <strong>${stage}</strong> stage.`}</p>
<p>Access the <a href="${portalUrl}">client portal</a> for more details.</p>
<p>Thank you.</p>
`,
  }),

  clientWeeklyEngagement: ({ clientName, engagements, portalUrl }) => ({
    subject: 'Weekly Engagement Summary',
    body: `Dear ${clientName},

Here is your weekly engagement summary:

${engagements.map(e => `- ${e.name}: ${e.status} (${e.progress}% complete)`).join('\n')}

Access the client portal for more details:
${portalUrl}

Thank you.`,
    html: `
<p>Dear ${clientName},</p>
<p>Here is your weekly engagement summary:</p>
<ul>
${engagements.map(e => `<li><strong>${e.name}:</strong> ${e.status} (${e.progress}% complete)</li>`).join('\n')}
</ul>
<p>Access the <a href="${portalUrl}">client portal</a> for more details.</p>
<p>Thank you.</p>
`,
  }),

  reviewNotification: ({ userName, reviewName, action, comments, reviewUrl }) => ({
    subject: `Review ${action}: ${reviewName}`,
    body: `Hi ${userName},

A review has been ${action}:

Review: ${reviewName}
${comments ? `Comments: ${comments}` : ''}

View the review:
${reviewUrl}

Thank you.`,
    html: `
<p>Hi ${userName},</p>
<p>A review has been <strong>${action}</strong>:</p>
<ul>
  <li><strong>Review:</strong> ${reviewName}</li>
  ${comments ? `<li><strong>Comments:</strong> ${comments}</li>` : ''}
</ul>
<p><a href="${reviewUrl}">View the review</a></p>
<p>Thank you.</p>
`,
  }),

  tenderDeadlineWarning: ({ userName, reviewName, deadline, daysRemaining, reviewUrl }) => ({
    subject: `Tender Deadline Warning: ${reviewName}`,
    body: `Hi ${userName},

This is a reminder that the tender deadline for "${reviewName}" is approaching.

Deadline: ${deadline}
Days Remaining: ${daysRemaining}

View the review:
${reviewUrl}

Thank you.`,
    html: `
<p>Hi ${userName},</p>
<p>This is a reminder that the tender deadline for "<strong>${reviewName}</strong>" is approaching.</p>
<ul>
  <li><strong>Deadline:</strong> ${deadline}</li>
  <li><strong>Days Remaining:</strong> ${daysRemaining}</li>
</ul>
<p><a href="${reviewUrl}">View the review</a></p>
<p>Thank you.</p>
`,
  }),

  passwordReset: ({ userName, resetUrl }) => ({
    subject: 'Password Reset Request',
    body: `Hi ${userName},

You requested a password reset. Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you did not request this, please ignore this email.

Thank you.`,
    html: `
<p>Hi ${userName},</p>
<p>You requested a password reset. Click the link below to reset your password:</p>
<p><a href="${resetUrl}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you did not request this, please ignore this email.</p>
<p>Thank you.</p>
`,
  }),

  clientSignup: ({ clientName, email, tempPassword, portalUrl }) => ({
    subject: 'Welcome to the Client Portal',
    body: `Dear ${clientName},

Your client portal account has been created.

Email: ${email}
Temporary Password: ${tempPassword}

Please log in and change your password:
${portalUrl}

Thank you.`,
    html: `
<p>Dear ${clientName},</p>
<p>Your client portal account has been created.</p>
<ul>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Temporary Password:</strong> ${tempPassword}</li>
</ul>
<p>Please <a href="${portalUrl}">log in</a> and change your password.</p>
<p>Thank you.</p>
`,
  }),
};

/**
 * Send templated email
 * @param {string} templateName - Template name
 * @param {Object} data - Template data
 * @param {string} to - Recipient email
 */
export async function sendTemplatedEmail(templateName, data, to) {
  const template = templates[templateName];
  if (!template) throw new Error(`Unknown email template: ${templateName}`);

  const { subject, body, html } = template(data);
  return sendEmail({ to, subject, body, html });
}

/**
 * Send bulk emails (with rate limiting)
 * @param {Array} emails - Array of email objects
 * @param {number} delayMs - Delay between emails (default 100ms)
 */
export async function sendBulkEmails(emails, delayMs = 100) {
  const results = [];

  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ success: true, messageId: result.id, to: email.to });
    } catch (error) {
      results.push({ success: false, error: error.message, to: email.to });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return results;
}

export { templates };
