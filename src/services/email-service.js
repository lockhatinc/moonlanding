import nodemailer from 'nodemailer';
import { config } from '@/config';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  initialize() {
    if (this.transporter) return;

    const emailConfig = config.email || {};
    const smtpHost = process.env.SMTP_HOST || emailConfig.smtp_host || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || emailConfig.smtp_port || '587');
    const smtpUser = process.env.SMTP_USER || emailConfig.smtp_user || '';
    const smtpPass = process.env.SMTP_PASS || emailConfig.smtp_pass || '';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? {
        user: smtpUser,
        pass: smtpPass
      } : undefined
    });
  }

  async send(to, subject, html, text, options = {}) {
    this.initialize();

    const mailOptions = {
      from: options.from || process.env.EMAIL_FROM || config.email?.default_sender || 'noreply@bidwise.app',
      to,
      subject,
      html,
      text,
      ...options
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('[Email] Sent:', { to, subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId, response: info.response };
    } catch (err) {
      console.error('[Email] Send error:', err.message);
      throw err;
    }
  }

  async sendBulk(recipients, subject, html, text, options = {}) {
    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await this.send(recipient, subject, html, text, options);
        results.push({ recipient, success: true, ...result });
      } catch (err) {
        results.push({ recipient, success: false, error: err.message });
      }
    }
    return results;
  }

  renderWeeklyChecklistEmail(user, checklists) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1c7ed6; border-bottom: 2px solid #1c7ed6; padding-bottom: 10px; }
    .checklist { margin: 16px 0; padding: 12px; background: #f8f9fa; border-radius: 4px; }
    .checklist-title { font-weight: bold; color: #1c7ed6; }
    .item { margin: 8px 0; padding-left: 24px; }
    .progress { color: #666; font-size: 12px; margin-top: 8px; }
    .cta { margin-top: 24px; }
    .button { background: #1c7ed6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Your Weekly Checklists</h1>
    <p>Hi ${user.name || 'Team'},</p>
    <p>Here's a summary of your active checklists for this week:</p>
    
    ${checklists.map(checklist => `
      <div class="checklist">
        <div class="checklist-title">${checklist.name}</div>
        ${checklist.items ? checklist.items.slice(0, 5).map(item => `
          <div class="item">
            <input type="checkbox" ${item.is_done ? 'checked' : ''} disabled>
            ${item.name}
          </div>
        `).join('') : ''}
        ${checklist.items && checklist.items.length > 5 ? `<div class="item">+${checklist.items.length - 5} more items</div>` : ''}
        <div class="progress">
          ${checklist.items ? `${checklist.items.filter(i => i.is_done).length}/${checklist.items.length} completed` : 'No items'}
        </div>
      </div>
    `).join('')}

    <div class="cta">
      <a href="${process.env.APP_URL || 'https://bidwise.app'}/checklists" class="button">View All Checklists</a>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 24px;">
      This is an automated email. Please do not reply directly.
    </p>
  </div>
</body>
</html>`;

    const text = `Your Weekly Checklists\n\nHi ${user.name || 'Team'},\n\nHere's a summary of your active checklists:\n\n${checklists.map(c => `${c.name}: ${c.items ? c.items.filter(i => i.is_done).length + '/' + c.items.length : '0'} completed`).join('\n')}`;

    return { html, text };
  }

  renderEngagementNotification(engagement, notification) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1c7ed6; }
    .alert { padding: 12px; background: #fff3bf; border-left: 4px solid #ffc107; margin: 16px 0; }
    .metadata { background: #f8f9fa; padding: 12px; margin: 16px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${notification.title || 'Engagement Update'}</h1>
    ${notification.alert ? `<div class="alert">${notification.alert}</div>` : ''}
    <p>${notification.message || ''}</p>
    
    <div class="metadata">
      <strong>Engagement:</strong> ${engagement.name}<br>
      <strong>Client:</strong> ${engagement.client?.name || 'N/A'}<br>
      <strong>Stage:</strong> ${engagement.stage || 'N/A'}<br>
      <strong>Status:</strong> ${engagement.status || 'N/A'}
    </div>
  </div>
</body>
</html>`;

    const text = `${notification.title || 'Engagement Update'}\n\n${notification.message || ''}\n\nEngagement: ${engagement.name}\nClient: ${engagement.client?.name || 'N/A'}`;

    return { html, text };
  }
}

export const emailService = new EmailService();
