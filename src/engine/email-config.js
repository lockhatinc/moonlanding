export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@example.com',
  retryAttempts: 3,
};

const t = (subject, recipients, fields, cta) => ({
  subject,
  recipients,
  render: (ctx) => {
    const items = fields.map(([label, key]) => `<li><strong>${label}:</strong> ${ctx[key] || 'N/A'}</li>`).join('');
    const button = cta ? `<p><a href="${ctx[cta[1]]}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px">${cta[0]}</a></p>` : '';
    return `<h2>${subject.replace(/{{.*?}}/g, '')}</h2><ul>${items}</ul>${button}`;
  },
});

export const emailTemplates = {
  review_created: t('New Review: {{review_name}}', 'team_partners', [['Review', 'review_name'], ['Team', 'team_name'], ['Year', 'financial_year'], ['Created By', 'created_by']], ['View Review', 'review_url']),
  review_status_change: t('Review Status: {{review_name}}', 'team_members', [['Review', 'review_name'], ['From', 'from_status'], ['To', 'to_status']], ['View Review', 'review_url']),
  collaborator_added: t('Collaborator Access: {{review_name}}', 'collaborator', [['Review', 'review_name'], ['Type', 'access_type'], ['Expires', 'expires_at'], ['Added By', 'added_by']], ['View Review', 'review_url']),
  tender_deadline_7days: t('Tender Deadline in 7 Days: {{review_name}}', 'team_partners', [['Review', 'review_name'], ['Deadline', 'deadline'], ['Team', 'team_name']], ['View Review', 'review_url']),
  tender_deadline_today: t('URGENT: Tender Due Today: {{review_name}}', 'team_partners', [['Review', 'review_name'], ['Deadline', 'deadline']], ['View Review', 'review_url']),
  weekly_checklist_pdf: { subject: 'Weekly Checklist Report - {{date}}', recipients: 'partners', attachment: 'checklist_pdf', render: (ctx) => `<h2>Weekly Checklist Report</h2><p>Report Date: ${ctx.date}</p>` },
  engagement_info_gathering: t('New Engagement: {{engagement_name}}', 'client_users', [['Engagement', 'engagement_name'], ['Client', 'client_name'], ['Year', 'year'], ['Type', 'engagement_type']], ['View Engagement', 'engagement_url']),
  engagement_commencement: t('Engagement Commenced: {{engagement_name}}', 'client_users', [['Engagement', 'engagement_name'], ['Client', 'client_name'], ['Date', 'commencement_date']], ['View Engagement', 'engagement_url']),
  engagement_finalization: t('Engagement Complete: {{engagement_name}}', 'client_admin', [['Engagement', 'engagement_name'], ['Client', 'client_name'], ['Year', 'year']], ['Rate Engagement', 'engagement_url']),
  engagement_stage_change: t('Stage Changed: {{engagement_name}}', 'team_members', [['Engagement', 'engagement_name'], ['From', 'from_stage'], ['To', 'to_stage']], ['View Engagement', 'engagement_url']),
  engagement_date_change: t('Date Updated: {{engagement_name}}', 'team_members', [['Engagement', 'engagement_name'], ['Field', 'field'], ['New Date', 'new_date']], ['View Engagement', 'engagement_url']),
  rfi_deadline: t('RFI Deadline: {{engagement_name}}', 'assigned_users', [['Question', 'question'], ['Engagement', 'engagement_name'], ['Deadline', 'deadline'], ['Days Until', 'daysUntil']], ['View RFI', 'rfi_url']),
  rfi_status_change: t('RFI Status: {{engagement_name}}', 'assigned_users', [['Question', 'question'], ['From', 'from_status'], ['To', 'to_status']], ['View RFI', 'rfi_url']),
  rfi_deadline_change: t('RFI Deadline Changed: {{engagement_name}}', 'assigned_users', [['Question', 'question'], ['New Deadline', 'new_deadline']], ['View RFI', 'rfi_url']),
  rfi_response: t('New RFI Response: {{engagement_name}}', 'team_members', [['Question', 'question'], ['Responded By', 'responded_by']], ['View Response', 'rfi_url']),
  rfi_reminder: t('RFI Reminder: {{engagement_name}}', 'client_users', [['Question', 'question'], ['Engagement', 'engagement_name'], ['Days Outstanding', 'days_outstanding']], ['Respond', 'rfi_url']),
  client_signup: { subject: 'Welcome to the Client Portal', recipients: 'new_client_user', render: (ctx) => `<h2>Welcome!</h2><p>Your account: ${ctx.email}</p><p><a href="${ctx.password_reset_url}">Set Password</a></p>` },
  password_reset: { subject: 'Password Reset Request', recipients: 'user', render: (ctx) => `<h2>Password Reset</h2><p><a href="${ctx.reset_url}">Reset Password</a></p>` },
  weekly_client_engagement: t('Weekly Summary: {{client_name}}', 'client_user', [['Client', 'client_name'], ['Engagements', 'engagement_count']], ['View Portal', 'portal_url']),
  weekly_client_master: t('Weekly Master Summary', 'client_admin', [['Total Engagements', 'total_engagements'], ['Outstanding RFIs', 'total_outstanding_rfis']], ['View Portal', 'portal_url']),
  daily_digest: { subject: 'Daily Summary - {{date}}', recipients: 'user', render: (ctx) => `<h2>Daily Summary</h2><p>${ctx.date}</p><p>${(ctx.notifications || []).length} notifications</p>` },
  bug_report: { subject: 'Bug Report: {{summary}}', recipients: 'developers', render: (ctx) => `<h2>Bug Report</h2><pre>${ctx.summary}\n${ctx.details}</pre>` },
};
