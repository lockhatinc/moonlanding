export const FORM_SECTION_TEMPLATES = {
  general: {
    label: 'General Information',
    description: 'Basic entity information',
    fields: ['name', 'title', 'description', 'status'],
    icon: 'info',
  },
  details: {
    label: 'Details',
    description: 'Detailed information',
    fields: ['type', 'category', 'subcategory', 'priority'],
    icon: 'list',
  },
  timeline: {
    label: 'Timeline',
    description: 'Dates and scheduling',
    fields: ['start_date', 'end_date', 'deadline', 'created_at', 'updated_at'],
    icon: 'calendar',
  },
  workflow: {
    label: 'Workflow',
    description: 'Workflow and stage information',
    fields: ['stage', 'assigned_to', 'progress', 'status'],
    icon: 'flow',
  },
  assignments: {
    label: 'Assignments',
    description: 'User and team assignments',
    fields: ['assigned_to', 'team_id', 'owner_id', 'reviewers'],
    icon: 'users',
  },
  metadata: {
    label: 'Metadata',
    description: 'Additional metadata',
    fields: ['tags', 'labels', 'metadata', 'custom_fields'],
    icon: 'tag',
  },
  attachments: {
    label: 'Attachments',
    description: 'File attachments',
    fields: ['attachments', 'documents', 'files'],
    icon: 'paperclip',
  },
  audit: {
    label: 'Audit Trail',
    description: 'Audit information (read-only)',
    fields: ['created_by', 'created_at', 'updated_at', 'resolved_by', 'resolved_at'],
    icon: 'log',
    readonly: true,
  },
};

export const ENTITY_FORM_SECTIONS = {
  engagement: [
    { ...FORM_SECTION_TEMPLATES.general, fields: ['name', 'client_id', 'status'] },
    { ...FORM_SECTION_TEMPLATES.timeline, fields: ['year', 'month', 'start_date', 'end_date'] },
    { ...FORM_SECTION_TEMPLATES.workflow, fields: ['stage', 'assigned_to', 'progress'] },
    { ...FORM_SECTION_TEMPLATES.details, fields: ['engagement_type', 'description', 'team_id'] },
  ],
  review: [
    { ...FORM_SECTION_TEMPLATES.general, fields: ['title', 'engagement_id', 'status'] },
    { ...FORM_SECTION_TEMPLATES.assignments, fields: ['assigned_to'] },
    { ...FORM_SECTION_TEMPLATES.details, fields: ['description', 'priority'] },
    { ...FORM_SECTION_TEMPLATES.audit },
  ],
  highlight: [
    { ...FORM_SECTION_TEMPLATES.general, fields: ['title', 'status'] },
    { ...FORM_SECTION_TEMPLATES.details, fields: ['description', 'severity', 'category'] },
    { ...FORM_SECTION_TEMPLATES.timeline, fields: ['identified_at', 'resolved_at'] },
    { ...FORM_SECTION_TEMPLATES.audit },
  ],
  rfi: [
    { ...FORM_SECTION_TEMPLATES.general, fields: ['name', 'engagement_id', 'status'] },
    { ...FORM_SECTION_TEMPLATES.details, fields: ['question', 'deadline'] },
    { ...FORM_SECTION_TEMPLATES.assignments, fields: ['assigned_to'] },
    { ...FORM_SECTION_TEMPLATES.audit },
  ],
};

export function getSectionTemplate(name) {
  return FORM_SECTION_TEMPLATES[name];
}

export function getEntityFormSections(entityType) {
  return ENTITY_FORM_SECTIONS[entityType] || [];
}

export function getSectionFields(entityType, sectionLabel) {
  const sections = getEntityFormSections(entityType);
  const section = sections.find(s => s.label === sectionLabel);
  return section?.fields || [];
}
