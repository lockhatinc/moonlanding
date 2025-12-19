import { spec } from '../spec-builder.js';
import { withAuditFields, withComputedCreator } from '../spec-templates.js';

export const flagSpec = withComputedCreator(
  withAuditFields(
    spec('flag')
      .label('Flag', 'Flags')
      .icon('Flag')
      .order(12)
  )
)
  .fields({
    review_id: { type: 'ref', ref: 'review', required: true },
    flag_type: { type: 'enum', options: 'flag_type', required: true, list: true },
    severity: { type: 'enum', options: 'flag_severity', required: true, list: true, default: 'medium' },
    title: { type: 'text', required: true, list: true, search: true },
    description: { type: 'textarea' },
    assigned_to: { type: 'ref', ref: 'user', display: 'user.name' },
    status: { type: 'enum', options: 'flag_status', required: true, list: true, default: 'open' },
    resolved_at: { type: 'int' },
  })
  .options('flag_type', {
    query: { label: 'Query', color: 'blue' },
    issue: { label: 'Issue', color: 'red' },
    missed_deadline: { label: 'Missed Deadline', color: 'orange' },
    high_priority: { label: 'High Priority', color: 'red' },
    note: { label: 'Note', color: 'gray' },
  })
  .options('flag_severity', {
    low: { label: 'Low', color: 'green' },
    medium: { label: 'Medium', color: 'yellow' },
    high: { label: 'High', color: 'red' },
  })
  .options('flag_status', {
    open: { label: 'Open', color: 'red' },
    in_progress: { label: 'In Progress', color: 'blue' },
    resolved: { label: 'Resolved', color: 'green' },
  })
  .list({
    groupBy: 'status',
    defaultSort: { field: 'created_at', dir: 'desc' },
    searchFields: ['title', 'description', 'flag_type'],
    displayRules: {
      title: { truncate: 60 },
      flag_type: { renderAs: 'badge', colorMapping: 'flag_type' },
      severity: { renderAs: 'badge', colorMapping: 'flag_severity' },
      status: { renderAs: 'badge', colorMapping: 'flag_status' },
    },
  })
  .transitions({
    open: ['in_progress', 'resolved'],
    in_progress: ['resolved', 'open'],
    resolved: [],
  })
  .fieldPermissions({
    flag_type: { view: 'all', edit: ['partner', 'manager'] },
    severity: { view: 'all', edit: ['partner'] },
    assigned_to: { view: 'all', edit: ['partner', 'manager'] },
    status: { view: 'all', edit: ['partner', 'manager', 'clerk'] },
  })
  .rowAccess({
    scope: 'review_team'
  })
  .validate({
    title: [
      { type: 'required', message: 'Flag title is required' },
    ],
    flag_type: [
      { type: 'required', message: 'Flag type is required' },
    ],
  })
  .onLifecycle({
    onCreate: { action: 'notify', template: 'flag_created', recipients: 'assigned_to' },
    onStatusChange: { action: 'notify', template: 'flag_status_changed', recipients: 'assigned_to' },
  })
  .formSections({
    general: {
      label: 'General Information',
      fields: ['flag_type', 'title', 'description'],
    },
    assignment: {
      label: 'Assignment',
      fields: ['assigned_to', 'severity'],
    },
    status: {
      label: 'Status',
      fields: ['status'],
    },
  })
  .build();
