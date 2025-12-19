import { spec } from '../spec-builder.js';
import { withAuditFields, withComputedCreator, withComputedAssignee } from '../spec-templates.js';

export const engagementSpec = withComputedAssignee(
  withComputedCreator(
    withAuditFields(
      spec('engagement')
        .label('Engagement', 'Engagements')
        .icon('Briefcase')
        .order(2)
    )
  )
)
  .fields({
    client_id: { type: 'ref', ref: 'client', display: 'client.name', required: true, list: true },
    year: { type: 'int', required: true, list: true, min: 2020, max: 2099 },
    status: { type: 'enum', options: 'engagement_status', required: true, list: true, default: 'pending' },
    stage: { type: 'enum', options: 'engagement_stage', required: true, list: true, default: 'info_gathering' },
    title: { type: 'text', required: true, list: true, search: true, minLength: 3, maxLength: 255 },
    description: { type: 'textarea' },
    start_date: { type: 'date' },
    end_date: { type: 'date' },
    commencement_date: { type: 'int', hidden: true },
    assigned_to: { type: 'ref', ref: 'user', display: 'user.name' },
    partner_id: { type: 'ref', ref: 'user', display: 'user.name' },
    manager_id: { type: 'ref', ref: 'user', display: 'user.name' },
    team_id: { type: 'ref', ref: 'team' },
    engagement_letter_id: { type: 'ref', ref: 'engagement_letter' },
    repeat_interval: { type: 'enum', options: 'repeat_interval', default: 'once' },
    recreate_with_attachments: { type: 'bool', default: false, hidden: true },
    progress: { type: 'int', min: 0, max: 100, default: 0 },
    review_link: { type: 'text', hidden: true },
    clerksCanApprove: { type: 'bool', default: false, hidden: true },
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
  .options('repeat_interval', {
    once: { label: 'Once', color: 'gray' },
    monthly: { label: 'Monthly', color: 'blue' },
    yearly: { label: 'Yearly', color: 'green' },
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
    letters: {
      entity: 'engagement_letter',
      label: 'Engagement Letters',
      fk: 'engagement_id',
    },
  })
  .list({
    groupBy: 'status',
    defaultSort: { field: 'created_at', dir: 'desc' },
    searchFields: ['title', 'description'],
    displayRules: {
      title: { truncate: 50 },
      description: { truncate: 100 },
      status: { renderAs: 'badge', colorMapping: 'engagement_status' },
      stage: { renderAs: 'badge', colorMapping: 'engagement_stage' },
      year: { format: 'number' },
      start_date: { format: 'date' },
      end_date: { format: 'date' },
    },
  })
  .transitions({
    pending: ['active', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: [],
  })
  .fieldPermissions({
    assigned_to: { view: 'all', edit: ['partner', 'manager'] },
    partner_id: { view: 'all', edit: ['partner'] },
    manager_id: { view: 'all', edit: ['partner', 'manager'] },
    team_id: { view: 'all', edit: ['partner', 'manager'] },
    engagement_letter_id: { view: 'all', edit: ['partner', 'manager'] },
    created_by: { view: 'all', edit: [] },
    progress: { view: 'all', edit: ['partner', 'manager', 'clerk'] },
    repeat_interval: { view: ['partner', 'manager'], edit: ['partner'] },
    recreate_with_attachments: { view: ['partner'], edit: ['partner'] },
  })
  .rowAccess({
    scope: 'assigned_or_team'
  })
  .validate({
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
      fields: ['start_date', 'end_date', 'commencement_date'],
    },
    team: {
      label: 'Team Assignment',
      fields: ['partner_id', 'manager_id', 'team_id', 'assigned_to'],
    },
    workflow: {
      label: 'Workflow',
      fields: ['status', 'stage', 'engagement_letter_id', 'progress', 'clerksCanApprove'],
    },
    automation: {
      label: 'Automation & Recreation',
      fields: ['repeat_interval', 'recreate_with_attachments'],
    },
    details: {
      label: 'Details',
      fields: ['description'],
    },
  })
  .build();
