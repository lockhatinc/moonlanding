import { sendEmail, sendBulkEmails } from './gmail-send';
import { templates } from './gmail-templates';
import { getGmailClient } from './google-auth';

export { getGmailClient };
export { sendEmail, sendBulkEmails } from './gmail-send';
export { templates } from './gmail-templates';

export async function sendTemplatedEmail(templateName, data, to) {
  const template = templates[templateName];
  if (!template) throw new Error(`Unknown email template: ${templateName}`);

  const { subject, body, html } = template(data);
  return sendEmail({ to, subject, body, html });
}
