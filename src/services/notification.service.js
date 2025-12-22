import { getGmailClient } from '@/adapters/google-auth';
import { GoogleAdapter } from '@/adapters/google-adapter-base';
import { EMAIL_DEFAULTS, RECIPIENT_RESOLVERS } from '@/config/email-config';

class NotificationService {
  constructor() {
    const DEFAULT_SENDER = process.env.GMAIL_SENDER_EMAIL;
    this.gmailAdapter = new GoogleAdapter('Gmail', () => getGmailClient(DEFAULT_SENDER));
    this.queue = [];
    this.recipientResolvers = RECIPIENT_RESOLVERS;
  }

  async send(to, subject, body, options = {}) {
    const { html, cc, bcc, from = EMAIL_DEFAULTS.from, attachments = [] } = options;
    return this.gmailAdapter.safeExecute(async (gmail) => {
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
    }, 'send');
  }

  async sendBulk(recipients, subject, body, options = {}) {
    const results = [];
    const { delayMs = 100 } = options;
    for (const to of recipients) {
      try {
        const result = await this.send(to, subject, body, options);
        results.push({ success: true, messageId: result.id, to });
      } catch (err) {
        results.push({ success: false, error: err.message, to });
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return results;
  }

  async sendTemplated(templateName, data, to, options = {}) {
    const template = this.recipientResolvers[templateName];
    if (!template) throw new Error(`Template ${templateName} not found`);
    const content = typeof template === 'function' ? template(data) : template;
    return this.send(to, content.subject, content.body, { ...options, html: content.html });
  }

  queue(to, subject, body, options = {}) {
    this.queue.push({ to, subject, body, options, timestamp: Date.now() });
  }

  async processQueue(limit = 5) {
    const batch = this.queue.splice(0, limit);
    const results = [];
    for (const item of batch) {
      try {
        const result = await this.send(item.to, item.subject, item.body, item.options);
        results.push({ success: true, ...result });
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    }
    return results;
  }

  async resolveRecipients(recipientSpec, context) {
    const resolver = this.recipientResolvers[recipientSpec];
    if (!resolver) return [];
    return typeof resolver === 'function' ? resolver(context) : [];
  }

  getQueueLength() {
    return this.queue.length;
  }

  clearQueue() {
    this.queue = [];
  }
}

export const notificationService = new NotificationService();
