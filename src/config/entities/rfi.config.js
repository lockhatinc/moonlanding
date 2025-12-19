import { spec } from '../spec-builder.js';
import { withAuditFields } from '../spec-templates.js';

export const rfiSpec = withAuditFields(
  spec('rfi')
    .label('Request For Information', 'RFIs')
    .icon('HelpCircle')
    .order(8)
    .parent('engagement')
    .computedField('days_outstanding', "(julianday('now') - julianday(datetime(due_date, 'unixepoch')))")
)
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    title: { type: 'text', required: true, list: true, search: true },
    question: { type: 'textarea', required: true },
    name: { type: 'text', list: true },
    description: { type: 'textarea' },
    section_id: { type: 'ref', ref: 'rfi_section' },
    status: { type: 'enum', options: 'rfi_status', required: true, default: 'waiting' },
    lifecycle_status: { type: 'enum', options: 'rfi_lifecycle_status', required: true, default: 'pending' },
    client_status: { type: 'enum', options: 'rfi_client_status', required: true, list: true, default: 'pending' },
    auditor_status: { type: 'enum', options: 'rfi_auditor_status', required: true, list: true, default: 'requested' },
    post_rfi_status: { type: 'enum', options: 'post_rfi_status', list: true },
    is_post_rfi: { type: 'bool', default: false, list: true },
    due_date: { type: 'date' },
    date_requested: { type: 'int' },
    date_resolved: { type: 'int' },
    assigned_users: { type: 'json', default: '[]' },
    client_ids: { type: 'json', default: '[]', hidden: true },
  })
  .options('rfi_client_status', {
    pending: { label: 'Pending', color: 'yellow' },
    sent: { label: 'Sent', color: 'blue' },
    responded: { label: 'Responded', color: 'amber' },
    completed: { label: 'Completed', color: 'green' },
  })
  .options('rfi_auditor_status', {
    requested: { label: 'Requested', color: 'red' },
    reviewing: { label: 'Reviewing', color: 'blue' },
    queries: { label: 'Queries', color: 'amber' },
    received: { label: 'Received', color: 'green' },
  })
  .options('rfi_status', {
    waiting: { label: 'Waiting', color: 'yellow' },
    completed: { label: 'Completed', color: 'green' },
  })
  .options('rfi_lifecycle_status', {
    pending: { label: 'Pending', color: 'yellow' },
    active: { label: 'Active', color: 'blue' },
    inactive: { label: 'Inactive', color: 'gray' },
  })
  .options('post_rfi_status', {
    pending: { label: 'Pending', color: 'yellow' },
    sent: { label: 'Sent', color: 'blue' },
    queries: { label: 'Queries', color: 'amber' },
    accepted: { label: 'Accepted', color: 'green' },
  })
  .children({
    messages: {
      entity: 'message',
      label: 'Messages',
      fk: 'rfi_id',
    },
    files: {
      entity: 'file',
      label: 'Files',
      fk: 'rfi_id',
    },
  })
  .list({
    groupBy: 'auditor_status',
    defaultSort: { field: 'due_date', dir: 'asc' },
    searchFields: ['title', 'question', 'description'],
    displayRules: {
      title: { truncate: 60 },
      client_status: { renderAs: 'badge', colorMapping: 'rfi_client_status' },
      auditor_status: { renderAs: 'badge', colorMapping: 'rfi_auditor_status' },
      due_date: { format: 'date' },
      is_post_rfi: { renderAs: 'badge', renderValue: 'Post-RFI' },
    },
  })
  .fieldPermissions({
    status: { view: 'all', edit: ['partner', 'manager', 'clerk'] },
    auditor_status: { view: 'all', edit: ['partner', 'manager'] },
    client_status: { view: 'all', edit: ['partner', 'manager'] },
    due_date: { view: 'all', edit: ['partner', 'manager'] },
    assigned_users: { view: 'all', edit: ['partner', 'manager'] },
    post_rfi_status: { view: 'all', edit: ['partner', 'manager'] },
  })
  .validate({
    title: [
      { type: 'required', message: 'RFI title is required' },
    ],
    question: [
      { type: 'required', message: 'Question is required' },
    ],
  })
  .build();
