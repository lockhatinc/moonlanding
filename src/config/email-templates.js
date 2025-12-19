export const EMAIL_TEMPLATES = {
  // Engagement Workflows
  engagement_created: {
    name: 'Engagement Created',
    subject: 'New Engagement: {engagement.title}',
    template: 'engagement-created',
    recipients: 'engagement.assigned_to',
    schedule: 'immediate',
  },
  engagement_status_changed: {
    name: 'Engagement Status Changed',
    subject: 'Engagement Status: {engagement.title} - {engagement.status}',
    template: 'engagement-status-changed',
    recipients: 'engagement.assigned_to',
    schedule: 'immediate',
  },

  // Engagement Letter
  letter_status_changed: {
    name: 'Engagement Letter Status Changed',
    subject: 'Letter Status: {letter.status} - {engagement.title}',
    template: 'letter-status-changed',
    recipients: 'engagement.partner_id',
    schedule: 'immediate',
  },

  // RFI Notifications
  rfi_deadline: {
    name: 'RFI Deadline Approaching',
    subject: '{rfi.title} - Due in {daysUntil} days',
    template: 'rfi-deadline',
    recipients: 'rfi.assigned_users',
    schedule: 'daily',
    config: {
      notifyAt: [7, 3, 1, 0], // days before deadline
    },
  },

  // Review Workflows
  review_created: {
    name: 'Review Created',
    subject: 'New Review: {review.title}',
    template: 'review-created',
    recipients: 'review.reviewer_id',
    schedule: 'immediate',
  },
  review_status_changed: {
    name: 'Review Status Changed',
    subject: 'Review Status: {review.title} - {review.status}',
    template: 'review-status-changed',
    recipients: 'review.reviewer_id',
    schedule: 'immediate',
  },

  // Tender Notifications
  tender_deadline_7days: {
    name: 'Tender Deadline - 7 Days',
    subject: 'TENDER ALERT: {review.title} - 7 days until deadline',
    template: 'tender-deadline-7days',
    recipients: 'review.assigned_to',
    schedule: 'weekly',
    config: {
      dayOfWeek: 'monday',
      time: '8:00',
    },
  },
  tender_deadline_today: {
    name: 'Tender Deadline - Today',
    subject: 'URGENT: {review.title} - Deadline TODAY',
    template: 'tender-deadline-today',
    recipients: 'review.assigned_to',
    schedule: 'daily',
  },

  // Checklist Reports
  weekly_checklist_pdf: {
    name: 'Weekly Checklist Report',
    subject: 'Weekly Checklist Report - {date}',
    template: 'weekly-checklist-pdf',
    recipients: 'user',
    schedule: 'weekly',
    config: {
      dayOfWeek: 'monday',
      time: '8:00',
      includeAttachment: 'checklist_pdf',
    },
  },

  // Client Communications
  daily_digest: {
    name: 'Daily Digest',
    subject: 'Daily Summary - {date}',
    template: 'daily-digest',
    recipients: 'user',
    schedule: 'daily',
    config: {
      time: '8:00',
      groupBy: 'engagement_id',
    },
  },
  weekly_client_email: {
    name: 'Weekly Client Summary',
    subject: 'Weekly Engagement Summary - {date}',
    template: 'weekly-client-email',
    recipients: 'client_admin',
    schedule: 'weekly',
    config: {
      dayOfWeek: 'monday',
      time: '9:00',
      include: ['engagement_status', 'rfi_updates', 'upcoming_meetings'],
    },
  },

  // Collaborator Management
  collaborator_added: {
    name: 'Added as Collaborator',
    subject: 'You\'ve been added to review: {review.title}',
    template: 'collaborator-added',
    recipients: 'collaborator.user_id',
    schedule: 'immediate',
  },
  collaborator_removed: {
    name: 'Removed as Collaborator',
    subject: 'Your access to review has expired: {review.title}',
    template: 'collaborator-removed',
    recipients: 'collaborator.user_id',
    schedule: 'immediate',
  },

  // Flags & Issues
  flag_created: {
    name: 'Flag Created',
    subject: 'New {flag.flag_type}: {flag.title}',
    template: 'flag-created',
    recipients: 'flag.assigned_to',
    schedule: 'immediate',
  },
  flag_status_changed: {
    name: 'Flag Status Changed',
    subject: 'Flag Update: {flag.title} - {flag.status}',
    template: 'flag-status-changed',
    recipients: 'flag.assigned_to',
    schedule: 'immediate',
  },

  // Highlight Responses
  highlight_response_added: {
    name: 'Response Added to Highlight',
    subject: 'New Response: {highlight.text}',
    template: 'highlight-response-added',
    recipients: 'highlight.created_by',
    schedule: 'immediate',
  },

  // User Management
  user_created: {
    name: 'New User Created',
    subject: 'Welcome to the platform',
    template: 'user-welcome',
    recipients: 'user.email',
    schedule: 'immediate',
  },

  // System Notifications
  recreation_success: {
    name: 'Engagement Recreation Success',
    subject: 'Engagement {engagement.title} has been recreated',
    template: 'recreation-success',
    recipients: 'engagement.partner_id',
    schedule: 'on_event',
  },
  recreation_failure: {
    name: 'Engagement Recreation Failed',
    subject: 'Failed to recreate engagement: {engagement.title}',
    template: 'recreation-failure',
    recipients: 'engagement.partner_id',
    schedule: 'on_event',
  },
};

export const CLIENT_EMAIL_TEMPLATES = {
  master_weekly_email: {
    name: 'Master Weekly Email (Client Admin)',
    subject: 'Weekly Engagement Summary',
    template: 'master-weekly-email',
    recipients: 'client_admin_only',
    schedule: 'weekly',
    config: {
      dayOfWeek: 'monday',
      time: '9:00',
      includeAllEngagements: true,
    },
  },
  client_individual_email: {
    name: 'Individual User Notification',
    subject: 'RFI Assigned to You: {rfi.title}',
    template: 'client-individual-notification',
    recipients: 'rfi.assigned_users',
    schedule: 'immediate',
  },
};
