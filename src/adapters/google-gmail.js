import { getGmailClient } from './google-auth.js';
import { GoogleAdapter } from './google-adapter-base.js';

const DEFAULT_SENDER = process.env.GMAIL_SENDER_EMAIL;
const gmailAdapter = new GoogleAdapter('Gmail', () => getGmailClient(DEFAULT_SENDER));

const sendEmail = ({ to, subject, body, html, cc, bcc, from = DEFAULT_SENDER, attachments = [] }) =>
  gmailAdapter.safeExecute(async (gmail) => {
    const boundary = `boundary_${Date.now()}`;
    let m = [`From: ${from}`, `To: ${to}`];
    if (cc) m.push(`Cc: ${cc}`);
    if (bcc) m.push(`Bcc: ${bcc}`);
    m.push(`Subject: ${subject}`, 'MIME-Version: 1.0');
    if (attachments.length > 0) m.push(`Content-Type: multipart/mixed; boundary="${boundary}"`, '', `--${boundary}`);
    if (html) {
      if (attachments.length > 0) m.push(`Content-Type: multipart/alternative; boundary="${boundary}_alt"`, '', `--${boundary}_alt`);
      m.push('Content-Type: text/plain; charset=utf-8', '', body || '');
      if (attachments.length > 0) m.push(`--${boundary}_alt`);
      m.push('Content-Type: text/html; charset=utf-8', '', html);
      if (attachments.length > 0) m.push(`--${boundary}_alt--`);
    } else {
      m.push('Content-Type: text/plain; charset=utf-8', '', body || '');
    }
    for (const a of attachments) {
      m.push(`--${boundary}`, `Content-Type: ${a.mimeType || 'application/octet-stream'}`, 'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${a.filename}"`, '');
      m.push(Buffer.isBuffer(a.content) ? a.content.toString('base64') : Buffer.from(a.content).toString('base64'));
    }
    if (attachments.length > 0) m.push(`--${boundary}--`);
    const raw = Buffer.from(m.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return (await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })).data;
  }, 'sendEmail');

const sendBulkEmails = async (emails, delayMs = 100) => {
  const results = [];
  for (const e of emails) {
    try { results.push({ success: true, messageId: (await sendEmail(e)).id, to: e.to }); }
    catch (err) { results.push({ success: false, error: err.message, to: e.to }); }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return results;
};

const templates = {
  rfiReminder: ({ clientName, engagementName, rfiQuestion, deadline, portalUrl }) => ({
    subject: `RFI Reminder: ${engagementName}`,
    body: `Dear ${clientName},\n\nThis is a reminder regarding the following request for information:\n\nEngagement: ${engagementName}\nQuestion: ${rfiQuestion}\nDeadline: ${deadline}\n\nPlease respond at your earliest convenience via the client portal:\n${portalUrl}\n\nThank you.`,
    html: `<p>Dear ${clientName},</p><p>This is a reminder regarding the following request for information:</p><ul><li><strong>Engagement:</strong> ${engagementName}</li><li><strong>Question:</strong> ${rfiQuestion}</li><li><strong>Deadline:</strong> ${deadline}</li></ul><p>Please respond at your earliest convenience via the <a href="${portalUrl}">client portal</a>.</p><p>Thank you.</p>`,
  }),
  engagementNotification: ({ clientName, engagementName, stage, message, portalUrl }) => ({
    subject: `Engagement Update: ${engagementName}`,
    body: `Dear ${clientName},\n\n${message || `Your engagement "${engagementName}" has moved to the ${stage} stage.`}\n\nAccess the client portal for more details:\n${portalUrl}\n\nThank you.`,
    html: `<p>Dear ${clientName},</p><p>${message || `Your engagement "<strong>${engagementName}</strong>" has moved to the <strong>${stage}</strong> stage.`}</p><p>Access the <a href="${portalUrl}">client portal</a> for more details.</p><p>Thank you.</p>`,
  }),
  clientWeeklyEngagement: ({ clientName, engagements, portalUrl }) => ({
    subject: 'Weekly Engagement Summary',
    body: `Dear ${clientName},\n\nHere is your weekly engagement summary:\n\n${engagements.map(e => `- ${e.name}: ${e.status} (${e.progress}% complete)`).join('\n')}\n\nAccess the client portal for more details:\n${portalUrl}\n\nThank you.`,
    html: `<p>Dear ${clientName},</p><p>Here is your weekly engagement summary:</p><ul>${engagements.map(e => `<li><strong>${e.name}:</strong> ${e.status} (${e.progress}% complete)</li>`).join('\n')}</ul><p>Access the <a href="${portalUrl}">client portal</a> for more details.</p><p>Thank you.</p>`,
  }),
  reviewNotification: ({ userName, reviewName, action, comments, reviewUrl }) => ({
    subject: `Review ${action}: ${reviewName}`,
    body: `Hi ${userName},\n\nA review has been ${action}:\n\nReview: ${reviewName}\n${comments ? `Comments: ${comments}` : ''}\n\nView the review:\n${reviewUrl}\n\nThank you.`,
    html: `<p>Hi ${userName},</p><p>A review has been <strong>${action}</strong>:</p><ul><li><strong>Review:</strong> ${reviewName}</li>${comments ? `<li><strong>Comments:</strong> ${comments}</li>` : ''}</ul><p><a href="${reviewUrl}">View the review</a></p><p>Thank you.</p>`,
  }),
  tenderDeadlineWarning: ({ userName, reviewName, deadline, daysRemaining, reviewUrl }) => ({
    subject: `Tender Deadline Warning: ${reviewName}`,
    body: `Hi ${userName},\n\nThis is a reminder that the tender deadline for "${reviewName}" is approaching.\n\nDeadline: ${deadline}\nDays Remaining: ${daysRemaining}\n\nView the review:\n${reviewUrl}\n\nThank you.`,
    html: `<p>Hi ${userName},</p><p>This is a reminder that the tender deadline for "<strong>${reviewName}</strong>" is approaching.</p><ul><li><strong>Deadline:</strong> ${deadline}</li><li><strong>Days Remaining:</strong> ${daysRemaining}</li></ul><p><a href="${reviewUrl}">View the review</a></p><p>Thank you.</p>`,
  }),
  passwordReset: ({ userName, resetUrl }) => ({
    subject: 'Password Reset Request',
    body: `Hi ${userName},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nThank you.`,
    html: `<p>Hi ${userName},</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you did not request this, please ignore this email.</p><p>Thank you.</p>`,
  }),
  clientSignup: ({ clientName, email, tempPassword, portalUrl }) => ({
    subject: 'Welcome to the Client Portal',
    body: `Dear ${clientName},\n\nYour client portal account has been created.\n\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password:\n${portalUrl}\n\nThank you.`,
    html: `<p>Dear ${clientName},</p><p>Your client portal account has been created.</p><ul><li><strong>Email:</strong> ${email}</li><li><strong>Temporary Password:</strong> ${tempPassword}</li></ul><p>Please <a href="${portalUrl}">log in</a> and change your password.</p><p>Thank you.</p>`,
  }),
};

export { getGmailClient, sendEmail, sendBulkEmails, templates };

export const sendTemplatedEmail = async (templateName, data, to) => {
  const t = templates[templateName];
  if (!t) throw new Error(`Unknown email template: ${templateName}`);
  const { subject, body, html } = t(data);
  return sendEmail({ to, subject, body, html });
};
