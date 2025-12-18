import { spec } from '../spec-builder.js';

export const engagementSpec = spec('engagement')
  .label('Engagement', 'Engagements')
  .icon('Briefcase')
  .order(2)
  .computedField('created_by_display', '(SELECT name FROM user WHERE user.id = engagement.created_by LIMIT 1)')
  .computedField('assigned_to_display', '(SELECT name FROM user WHERE user.id = engagement.assigned_to LIMIT 1)')
  .fields({
    client_id: { type: 'ref', ref: 'client', display: 'client.name', required: true, list: true },
    year: { type: 'int', required: true, list: true },
    status: { type: 'enum', options: 'engagement_status', required: true, list: true, default: 'pending' },
    stage: { type: 'enum', options: 'engagement_stage', required: true, list: true, default: 'info_gathering' },
    title: { type: 'text', required: true, list: true, search: true },
    description: { type: 'textarea' },
    start_date: { type: 'date' },
    end_date: { type: 'date' },
    assigned_to: { type: 'ref', ref: 'user', display: 'user.name' },
    created_at: { type: 'int', auto: 'now', hidden: true },
    updated_at: { type: 'int', auto: 'update', hidden: true },
    created_by: { type: 'ref', ref: 'user', display: 'user.name', auto: 'user', hidden: true },
  })
  .options('engagement_status', {
    pending: { label: 'Pending', color: 'yellow' },
    active: { label: 'Active', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
    archived: { label: 'Archived', color: 'gray' },
  })
  .options('engagement_stage', {
    info_gathering: { label: 'Info Gathering', color: 'blue' },
    commencement: { label: 'Commencement', color: 'blue' },
    team_execution: { label: 'Team Execution', color: 'amber' },
    partner_review: { label: 'Partner Review', color: 'amber' },
    finalization: { label: 'Finalization', color: 'green' },
    close_out: { label: 'Close Out', color: 'green' },
  })
  .children({
    reviews: {
      entity: 'review',
      label: 'Reviews',
      fk: 'engagement_id',
    },
    rfis: {
      entity: 'rfi',
      label: 'RFIs',
      fk: 'engagement_id',
    },
  })
  .list({ groupBy: 'status', defaultSort: { field: 'created_at', dir: 'desc' } })
  .transitions({
    pending: ['active', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: [],
  })
  .fieldPermissions({
    assigned_to: { view: 'all', edit: ['partner', 'manager'] },
    created_by: { view: 'all', edit: [] },
  })
  .validate({
    title: [
      { type: 'required', message: 'Title is required' },
      { type: 'minLength', value: 3, message: 'Title must be at least 3 characters' },
      { type: 'maxLength', value: 255, message: 'Title must not exceed 255 characters' },
    ],
    year: [
      { type: 'required', message: 'Year is required' },
      { type: 'range', min: 2020, max: 2099, message: 'Year must be between 2020 and 2099' },
    ],
    client_id: [
      { type: 'required', message: 'Client is required' },
    ],
    status: [
      { type: 'required', message: 'Status is required' },
    ],
    stage: [
      { type: 'required', message: 'Stage is required' },
    ],
    start_date: [
      { type: 'custom', validator: 'validateDateRange', message: 'Start date must be before end date' },
    ],
  })
  .onLifecycle({
    onCreate: { action: 'notify', template: 'engagement_created', recipients: 'assigned_to' },
    onStatusChange: { action: 'notify', template: 'engagement_status_changed', recipients: 'assigned_to' },
    onStageChange: { action: 'log', level: 'info', message: 'Engagement stage transitioned' },
  })
  .formSections({
    general: {
      label: 'General Information',
      fields: ['client_id', 'title', 'year'],
    },
    timeline: {
      label: 'Timeline',
      fields: ['start_date', 'end_date'],
    },
    workflow: {
      label: 'Workflow',
      fields: ['status', 'stage', 'assigned_to'],
    },
    details: {
      label: 'Details',
      fields: ['description'],
    },
  })
  .build();
