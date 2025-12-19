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
    due_date: { type: 'date' },
    date_requested: { type: 'int' },
    date_resolved: { type: 'int' },
    assigned_users: { type: 'json', default: '[]' },
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
  .build();
