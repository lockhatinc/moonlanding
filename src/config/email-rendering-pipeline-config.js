export const PIPELINE_EMAIL_TEMPLATES = {
  engagement_created: {
    subject: 'New Engagement: {{engagement.name}}',
    template: 'engagement_info_gathering',
    recipients: 'client_users',
    priority: 'high',
    async: true,
    retries: 3,
    variables: ['engagement.name', 'engagement.client_id', 'engagement.start_date'],
  },
  engagement_status_changed: {
    subject: 'Engagement Status Update: {{engagement.name}}',
    template: 'engagement_status_notification',
    recipients: 'assigned_team',
    priority: 'medium',
    async: true,
    retries: 2,
    variables: ['engagement.name', 'engagement.status', 'engagement.previous_status'],
  },
  rfi_created: {
    subject: 'New RFI: {{rfi.name}}',
    template: 'rfi_request_notification',
    recipients: 'client_users',
    priority: 'high',
    async: true,
    retries: 3,
    variables: ['rfi.name', 'rfi.question', 'rfi.deadline'],
  },
  rfi_deadline_approaching: {
    subject: 'RFI Deadline Approaching: {{rfi.name}}',
    template: 'rfi_deadline_warning',
    recipients: 'assigned_users',
    priority: 'high',
    async: true,
    retries: 2,
    variables: ['rfi.name', 'rfi.deadline', 'rfi.days_remaining'],
  },
  review_completed: {
    subject: 'Review Complete: {{review.title}}',
    template: 'review_completion_notice',
    recipients: 'engagement_assigned',
    priority: 'medium',
    async: true,
    retries: 2,
    variables: ['review.title', 'review.findings_count', 'review.completed_at'],
  },
  highlight_created: {
    subject: 'New Finding: {{highlight.title}}',
    template: 'highlight_created_notification',
    recipients: 'review_assigned',
    priority: 'high',
    async: false,
    retries: 1,
    variables: ['highlight.title', 'highlight.severity', 'highlight.description'],
  },
  daily_digest: {
    subject: 'Daily Summary',
    template: 'daily_digest',
    recipients: 'user',
    priority: 'low',
    async: true,
    retries: 1,
    variables: ['user.name', 'pending_items', 'overdue_items'],
  },
};

export const EMAIL_RENDERING_STAGES = {
  validation: {
    order: 1,
    description: 'Validate template and variables',
    required: true,
  },
  variable_resolution: {
    order: 2,
    description: 'Resolve variables from context',
    required: true,
  },
  template_rendering: {
    order: 3,
    description: 'Render template with variables',
    required: true,
  },
  personalization: {
    order: 4,
    description: 'Apply user-specific personalization',
    required: false,
  },
  sanitization: {
    order: 5,
    description: 'Sanitize HTML and remove unsafe content',
    required: true,
  },
  attachment_processing: {
    order: 6,
    description: 'Process and attach files',
    required: false,
  },
  preview_generation: {
    order: 7,
    description: 'Generate email preview',
    required: false,
  },
  sending: {
    order: 8,
    description: 'Send email via provider',
    required: true,
  },
};

export const EMAIL_FILTERS = {
  duplicate_detection: {
    enabled: true,
    checkFields: ['to', 'subject'],
    windowMs: 60000,
  },
  rate_limiting: {
    enabled: true,
    maxPerMinute: 10,
    maxPerHour: 100,
  },
  delivery_tracking: {
    enabled: true,
    trackOpens: true,
    trackClicks: true,
  },
  bounce_handling: {
    enabled: true,
    maxBounces: 3,
    disableOnPermanentBounce: true,
  },
};

export function getPipelineEmailTemplate(name) {
  return PIPELINE_EMAIL_TEMPLATES[name];
}

export function getAllPipelineEmailTemplates() {
  return Object.entries(PIPELINE_EMAIL_TEMPLATES).map(([name, config]) => ({ name, ...config }));
}

export function getRenderingStages() {
  return Object.entries(EMAIL_RENDERING_STAGES)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([name, stage]) => ({ name, ...stage }));
}

export function getRequiredStages() {
  return getRenderingStages().filter(s => s.required);
}

export class EmailPipeline {
  constructor(config = {}) {
    this.stages = getRenderingStages();
    this.filters = { ...EMAIL_FILTERS, ...config.filters };
    this.templates = new Map();
  }

  registerTemplate(name, handler) {
    this.templates.set(name, handler);
  }

  async render(templateName, context = {}) {
    const template = getEmailTemplate(templateName);
    if (!template) throw new Error(`Template not found: ${templateName}`);

    for (const stage of this.stages) {
      if (stage.required || this.filters[stage.name]?.enabled) {
        const handler = this.templates.get(stage.name);
        if (handler) {
          context = await handler(context, template);
        }
      }
    }

    return context;
  }
}

export const emailPipeline = new EmailPipeline();
