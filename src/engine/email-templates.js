// Email Templates and Notification System
// From MWR and Friday email systems

import { list, get, create, update } from '../engine';

// === EMAIL CONFIGURATION ===

export const emailConfig = {
  provider: 'nodemailer',
  from: process.env.EMAIL_FROM || 'noreply@example.com',
  dailyLimit: 500,
  rateLimit: '10/minute',
  retryAttempts: 3,
};

// === EMAIL TEMPLATES ===

/**
 * All email templates with their configurations
 * From MWR and Friday email systems
 */
export const emailTemplates = {
  // === REVIEW NOTIFICATIONS (MWR) ===

  review_created: {
    subject: 'New Review Created: {{review_name}}',
    recipients: 'team_partners',
    template: `
      <h2>New Review Created</h2>
      <p>A new review has been created and requires your attention.</p>
      <ul>
        <li><strong>Review:</strong> {{review_name}}</li>
        <li><strong>Team:</strong> {{team_name}}</li>
        <li><strong>Financial Year:</strong> {{financial_year}}</li>
        <li><strong>Created By:</strong> {{created_by}}</li>
      </ul>
      <p><a href="{{review_url}}">View Review</a></p>
    `,
  },

  review_status_change: {
    subject: 'Review Status Updated: {{review_name}}',
    recipients: 'team_members',
    template: `
      <h2>Review Status Changed</h2>
      <p>The status of a review has been updated.</p>
      <ul>
        <li><strong>Review:</strong> {{review_name}}</li>
        <li><strong>Previous Status:</strong> {{from_status}}</li>
        <li><strong>New Status:</strong> {{to_status}}</li>
        <li><strong>Updated By:</strong> {{updated_by}}</li>
      </ul>
      <p><a href="{{review_url}}">View Review</a></p>
    `,
  },

  collaborator_added: {
    subject: 'You have been added as a collaborator on {{review_name}}',
    recipients: 'collaborator',
    template: `
      <h2>Collaborator Access Granted</h2>
      <p>You have been added as a collaborator on a review.</p>
      <ul>
        <li><strong>Review:</strong> {{review_name}}</li>
        <li><strong>Access Type:</strong> {{access_type}}</li>
        {{#if expires_at}}<li><strong>Expires:</strong> {{expires_at}}</li>{{/if}}
        <li><strong>Added By:</strong> {{added_by}}</li>
      </ul>
      <p><a href="{{review_url}}">View Review</a></p>
    `,
  },

  tender_deadline_7days: {
    subject: 'Tender Deadline in 7 Days: {{review_name}}',
    recipients: 'team_partners',
    template: `
      <h2>Tender Deadline Approaching</h2>
      <p>A tender deadline is approaching in 7 days.</p>
      <ul>
        <li><strong>Review:</strong> {{review_name}}</li>
        <li><strong>Deadline:</strong> {{deadline}}</li>
        <li><strong>Team:</strong> {{team_name}}</li>
      </ul>
      <p><a href="{{review_url}}">View Review</a></p>
    `,
  },

  tender_deadline_today: {
    subject: 'Tender Deadline Today: {{review_name}}',
    recipients: 'team_partners',
    template: `
      <h2>Tender Deadline Today!</h2>
      <p><strong>URGENT:</strong> A tender deadline is due today.</p>
      <ul>
        <li><strong>Review:</strong> {{review_name}}</li>
        <li><strong>Deadline:</strong> {{deadline}}</li>
        <li><strong>Team:</strong> {{team_name}}</li>
      </ul>
      <p><a href="{{review_url}}">View Review</a></p>
    `,
  },

  weekly_checklist_pdf: {
    subject: 'Weekly Checklist Report - {{date}}',
    recipients: 'partners',
    attachment: 'checklist_pdf',
    template: `
      <h2>Weekly Checklist Report</h2>
      <p>Please find attached your weekly checklist report.</p>
      <p><strong>Report Date:</strong> {{date}}</p>
    `,
  },

  // === ENGAGEMENT NOTIFICATIONS (Friday) ===

  engagement_info_gathering: {
    subject: 'New Engagement - Info Gathering: {{engagement_name}}',
    recipients: 'client_users',
    template: `
      <h2>New Engagement Created</h2>
      <p>A new engagement has been created and is in the Info Gathering stage.</p>
      <ul>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
        <li><strong>Client:</strong> {{client_name}}</li>
        <li><strong>Year:</strong> {{year}}</li>
        <li><strong>Type:</strong> {{engagement_type}}</li>
      </ul>
      <p>Please prepare the requested information.</p>
      <p><a href="{{engagement_url}}">View Engagement</a></p>
    `,
  },

  engagement_commencement: {
    subject: 'Engagement Commenced: {{engagement_name}}',
    recipients: 'client_users',
    template: `
      <h2>Engagement Commenced</h2>
      <p>The engagement has moved to the Commencement stage.</p>
      <ul>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
        <li><strong>Client:</strong> {{client_name}}</li>
        <li><strong>Commencement Date:</strong> {{commencement_date}}</li>
      </ul>
      <p><a href="{{engagement_url}}">View Engagement</a></p>
    `,
  },

  engagement_finalization: {
    subject: 'Engagement Complete: {{engagement_name}}',
    recipients: 'client_admin',
    template: `
      <h2>Engagement Finalized</h2>
      <p>The engagement has been finalized.</p>
      <ul>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
        <li><strong>Client:</strong> {{client_name}}</li>
        <li><strong>Year:</strong> {{year}}</li>
      </ul>
      <p>You can now provide feedback on the engagement.</p>
      <p><a href="{{engagement_url}}">Rate Engagement</a></p>
    `,
  },

  engagement_stage_change: {
    subject: 'Engagement Stage Updated: {{engagement_name}}',
    recipients: 'team_members',
    template: `
      <h2>Engagement Stage Changed</h2>
      <ul>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
        <li><strong>Previous Stage:</strong> {{from_stage}}</li>
        <li><strong>New Stage:</strong> {{to_stage}}</li>
        <li><strong>Updated By:</strong> {{updated_by}}</li>
      </ul>
      <p><a href="{{engagement_url}}">View Engagement</a></p>
    `,
  },

  engagement_date_change: {
    subject: 'Engagement Date Updated: {{engagement_name}}',
    recipients: 'team_members',
    template: `
      <h2>Engagement Date Changed</h2>
      <ul>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
        <li><strong>Field:</strong> {{field}}</li>
        <li><strong>New Date:</strong> {{new_date}}</li>
      </ul>
      <p><a href="{{engagement_url}}">View Engagement</a></p>
    `,
  },

  // === RFI NOTIFICATIONS ===

  rfi_deadline: {
    subject: 'RFI Deadline {{#if days_until}}in {{days_until}} days{{else}}Today{{/if}}: {{engagement_name}}',
    recipients: 'assigned_users',
    template: `
      <h2>RFI Deadline {{#if days_until}}Approaching{{else}}Today{{/if}}</h2>
      <p>{{#if days_until}}An RFI deadline is approaching in {{days_until}} days.{{else}}<strong>URGENT:</strong> An RFI deadline is due today.{{/if}}</p>
      <ul>
        <li><strong>Question:</strong> {{question}}</li>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
        <li><strong>Deadline:</strong> {{deadline}}</li>
      </ul>
      <p><a href="{{rfi_url}}">View RFI</a></p>
    `,
  },

  rfi_status_change: {
    subject: 'RFI Status Updated: {{engagement_name}}',
    recipients: 'assigned_users',
    template: `
      <h2>RFI Status Changed</h2>
      <ul>
        <li><strong>Question:</strong> {{question}}</li>
        <li><strong>Previous Status:</strong> {{from_status}}</li>
        <li><strong>New Status:</strong> {{to_status}}</li>
      </ul>
      <p><a href="{{rfi_url}}">View RFI</a></p>
    `,
  },

  rfi_deadline_change: {
    subject: 'RFI Deadline Changed: {{engagement_name}}',
    recipients: 'assigned_users',
    template: `
      <h2>RFI Deadline Updated</h2>
      <ul>
        <li><strong>Question:</strong> {{question}}</li>
        <li><strong>New Deadline:</strong> {{new_deadline}}</li>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
      </ul>
      <p><a href="{{rfi_url}}">View RFI</a></p>
    `,
  },

  rfi_response: {
    subject: 'New RFI Response: {{engagement_name}}',
    recipients: 'team_members',
    template: `
      <h2>New RFI Response</h2>
      <p>A response has been added to an RFI.</p>
      <ul>
        <li><strong>Question:</strong> {{question}}</li>
        <li><strong>Responded By:</strong> {{responded_by}}</li>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
      </ul>
      <p><a href="{{rfi_url}}">View Response</a></p>
    `,
  },

  rfi_reminder: {
    subject: 'RFI Reminder: {{engagement_name}}',
    recipients: 'client_users',
    template: `
      <h2>RFI Reminder</h2>
      <p>This is a reminder about outstanding RFIs.</p>
      <ul>
        <li><strong>Question:</strong> {{question}}</li>
        <li><strong>Engagement:</strong> {{engagement_name}}</li>
        <li><strong>Days Outstanding:</strong> {{days_outstanding}}</li>
      </ul>
      <p><a href="{{rfi_url}}">Respond to RFI</a></p>
    `,
  },

  // === CLIENT NOTIFICATIONS ===

  client_signup: {
    subject: 'Welcome to the Client Portal',
    recipients: 'new_client_user',
    template: `
      <h2>Welcome!</h2>
      <p>Your client portal account has been created.</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p>Please use the following link to set your password:</p>
      <p><a href="{{password_reset_url}}">Set Password</a></p>
    `,
  },

  password_reset: {
    subject: 'Password Reset Request',
    recipients: 'user',
    template: `
      <h2>Password Reset</h2>
      <p>A password reset has been requested for your account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="{{reset_url}}">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  },

  weekly_client_engagement: {
    subject: 'Weekly Engagement Summary - {{client_name}}',
    recipients: 'client_user',
    template: `
      <h2>Weekly Engagement Summary</h2>
      <p>Here is your weekly summary for {{client_name}}.</p>
      <h3>Active Engagements</h3>
      {{#each engagements}}
      <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd;">
        <strong>{{name}}</strong>
        <p>Stage: {{stage}} | Progress: {{progress}}%</p>
        <p>Outstanding RFIs: {{outstanding_rfis}}</p>
      </div>
      {{/each}}
      <p><a href="{{portal_url}}">View in Portal</a></p>
    `,
  },

  weekly_client_master: {
    subject: 'Weekly Engagement Summary - All Clients',
    recipients: 'client_admin',
    template: `
      <h2>Weekly Master Summary</h2>
      <p>Here is your weekly summary across all clients.</p>
      <p><strong>Total Engagements:</strong> {{total_engagements}}</p>
      <p><strong>Outstanding RFIs:</strong> {{total_outstanding_rfis}}</p>
      {{#each clients}}
      <h3>{{name}}</h3>
      <ul>
        {{#each engagements}}
        <li>{{name}} - {{stage}} ({{progress}}%)</li>
        {{/each}}
      </ul>
      {{/each}}
      <p><a href="{{portal_url}}">View in Portal</a></p>
    `,
  },

  // === DAILY DIGEST ===

  daily_digest: {
    subject: 'Daily Summary - {{date}}',
    recipients: 'user',
    template: `
      <h2>Daily Summary</h2>
      <p>Here is your daily summary for {{date}}.</p>
      <h3>Notifications</h3>
      {{#each notifications}}
      <div style="margin-bottom: 10px;">
        <strong>{{type}}</strong>: {{message}}
      </div>
      {{/each}}
    `,
  },

  // === SYSTEM NOTIFICATIONS ===

  bug_report: {
    subject: 'Bug Report: {{summary}}',
    recipients: 'developers',
    template: `
      <h2>Bug Report</h2>
      <p><strong>Summary:</strong> {{summary}}</p>
      <p><strong>Reported By:</strong> {{reported_by}}</p>
      <p><strong>Details:</strong></p>
      <pre>{{details}}</pre>
      <p><strong>Stack Trace:</strong></p>
      <pre>{{stack_trace}}</pre>
    `,
  },
};

// === RECIPIENT RESOLVERS ===

/**
 * Resolve recipients based on type
 */
async function resolveRecipients(recipientType, context) {
  switch (recipientType) {
    case 'team_partners':
      return getTeamPartners(context.review?.team_id || context.engagement?.team_id);

    case 'team_members':
      return getTeamMembers(context.review?.team_id || context.engagement?.team_id);

    case 'collaborator':
      if (context.collaborator?.email) return [context.collaborator];
      if (context.collaborator?.user_id) {
        const user = get('user', context.collaborator.user_id);
        return user ? [user] : [];
      }
      return [];

    case 'client_users':
      return getClientUsers(context.engagement?.client_id);

    case 'client_admin':
      return getClientAdmins(context.engagement?.client_id || context.client?.id);

    case 'assigned_users':
      return getAssignedUsers(context.rfi);

    case 'user':
      return context.user ? [context.user] : [];

    case 'client_user':
      return context.user ? [context.user] : [];

    case 'partners':
      return list('user', { role: 'partner', status: 'active' });

    case 'developers':
      // Return configured developer emails
      const devEmail = process.env.DEVELOPER_EMAIL || 'dev@example.com';
      return [{ email: devEmail }];

    default:
      return [];
  }
}

function getTeamPartners(teamId) {
  if (!teamId) return [];
  const team = get('team', teamId);
  if (!team) return [];

  const partnerIds = JSON.parse(team.partners || '[]');
  return partnerIds.map(id => get('user', id)).filter(Boolean);
}

function getTeamMembers(teamId) {
  if (!teamId) return [];
  const team = get('team', teamId);
  if (!team) return [];

  const userIds = [
    ...JSON.parse(team.partners || '[]'),
    ...JSON.parse(team.users || '[]'),
  ];
  return [...new Set(userIds)].map(id => get('user', id)).filter(Boolean);
}

function getClientUsers(clientId) {
  if (!clientId) return [];
  const clientUsers = list('client_user', { client_id: clientId, status: 'active' });
  return clientUsers.map(cu => get('user', cu.user_id)).filter(Boolean);
}

function getClientAdmins(clientId) {
  if (!clientId) return [];
  const clientUsers = list('client_user', { client_id: clientId, status: 'active' });
  const admins = clientUsers.filter(cu => cu.role === 'admin');
  return admins.map(cu => get('user', cu.user_id)).filter(Boolean);
}

function getAssignedUsers(rfi) {
  if (!rfi) return [];
  const assignedIds = JSON.parse(rfi.assigned_users || '[]');
  return assignedIds.map(id => get('user', id)).filter(Boolean);
}

// === TEMPLATE RENDERING ===

/**
 * Simple template rendering (Handlebars-like syntax)
 */
function renderTemplate(template, data) {
  let result = template;

  // Replace simple variables {{var}}
  result = result.replace(/\{\{([^#\/}]+)\}\}/g, (match, key) => {
    const keys = key.trim().split('.');
    let value = data;
    for (const k of keys) {
      value = value?.[k];
    }
    return value ?? '';
  });

  // Handle {{#if var}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] ? content : '';
  });

  // Handle {{#each items}}...{{/each}}
  result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, itemTemplate) => {
    const items = data[key] || [];
    return items.map(item => renderTemplate(itemTemplate, { ...data, ...item })).join('');
  });

  return result;
}

// === EMAIL QUEUEING ===

/**
 * Queue an email notification
 */
export async function queueEmail(templateKey, context) {
  const template = emailTemplates[templateKey];
  if (!template) {
    console.error(`Unknown email template: ${templateKey}`);
    return;
  }

  const recipients = await resolveRecipients(template.recipients, context);
  if (recipients.length === 0) {
    console.log(`No recipients for email: ${templateKey}`);
    return;
  }

  const baseUrl = process.env.APP_URL || 'http://localhost:3000';

  // Build context with URLs
  const fullContext = {
    ...context,
    review_url: context.review ? `${baseUrl}/review/${context.review.id}` : '',
    engagement_url: context.engagement ? `${baseUrl}/engagement/${context.engagement.id}` : '',
    rfi_url: context.rfi ? `${baseUrl}/engagement/${context.rfi.engagement_id}` : '',
    portal_url: baseUrl,
    review_name: context.review?.name || '',
    engagement_name: context.engagement?.name || '',
    client_name: context.client?.name || '',
    team_name: context.team?.name || '',
    date: new Date().toISOString().split('T')[0],
  };

  const subject = renderTemplate(template.subject, fullContext);
  const content = renderTemplate(template.template, fullContext);

  for (const recipient of recipients) {
    if (!recipient.email) continue;

    create('notification', {
      type: templateKey,
      recipient_id: recipient.id,
      recipient_email: recipient.email,
      subject,
      content,
      entity_type: context.review ? 'review' : context.engagement ? 'engagement' : context.rfi ? 'rfi' : null,
      entity_id: context.review?.id || context.engagement?.id || context.rfi?.id,
      status: 'pending',
    });
  }
}

/**
 * Send a notification directly (not queued)
 */
export async function sendNotification(templateKey, context) {
  await queueEmail(templateKey, context);
  await sendQueuedEmails();
}

/**
 * Process and send queued emails
 */
export async function sendQueuedEmails(limit = 50) {
  const pending = list('notification', { status: 'pending' }).slice(0, limit);

  for (const notification of pending) {
    try {
      await sendEmail(notification);
      update('notification', notification.id, {
        status: 'sent',
        sent_at: Math.floor(Date.now() / 1000),
      });
    } catch (error) {
      const retryCount = (notification.retry_count || 0) + 1;
      update('notification', notification.id, {
        status: retryCount >= emailConfig.retryAttempts ? 'failed' : 'pending',
        error: error.message,
        retry_count: retryCount,
      });
    }
  }
}

/**
 * Send a single email
 */
async function sendEmail(notification) {
  // Import nodemailer dynamically to avoid issues if not installed
  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: emailConfig.from,
    to: notification.recipient_email,
    subject: notification.subject,
    html: wrapEmailHtml(notification.content),
  });
}

/**
 * Wrap email content in HTML template
 */
function wrapEmailHtml(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h2 { color: #293241; border-bottom: 2px solid #293241; padding-bottom: 10px; }
        a { color: #3b82f6; }
        ul { padding-left: 20px; }
        li { margin-bottom: 5px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
      </style>
    </head>
    <body>
      ${content}
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply directly to this email.</p>
    </body>
    </html>
  `;
}

/**
 * Generate checklist PDF (placeholder - needs PDF library)
 */
export async function generateChecklistPdf(user) {
  // This would use a PDF library like pdfkit or puppeteer
  // For now, return null to indicate PDF generation not implemented
  console.log(`[EMAIL] Checklist PDF generation not implemented for ${user.email}`);
  return null;
}
