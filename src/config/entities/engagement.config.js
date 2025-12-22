import { spec } from '../spec-builder.js';
import { withAuditFields, withComputedCreator, withComputedAssignee } from '../spec-templates.js';
import { STANDARD_STATUS_OPTIONS, ENGAGEMENT_STAGE_OPTIONS } from '../enum-options.js';

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
    assigned_to: { type: 'ref', ref: 'user', display: 'user.name' },
  })
  .options('engagement_status', STANDARD_STATUS_OPTIONS)
  .options('engagement_stage', ENGAGEMENT_STAGE_OPTIONS)
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
    created_by: { view: 'all', edit: [] },
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
