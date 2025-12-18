import { spec } from '../spec-builder.js';

export const rfiSpec = spec('rfi')
  .label('Request For Information', 'RFIs')
  .icon('HelpCircle')
  .order(8)
  .parent('engagement')
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    title: { type: 'text', required: true, list: true, search: true },
    description: { type: 'textarea' },
    client_status: { type: 'enum', options: 'rfi_client_status', required: true, list: true, default: 'pending' },
    auditor_status: { type: 'enum', options: 'rfi_auditor_status', required: true, list: true, default: 'requested' },
    due_date: { type: 'date' },
    created_at: { type: 'int', auto: 'now', hidden: true },
    updated_at: { type: 'int', auto: 'update', hidden: true },
    created_by: { type: 'ref', ref: 'user', display: 'user.name', auto: 'user', hidden: true },
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
  .children({
    messages: {
      entity: 'message',
      label: 'Messages',
      fk: 'rfi_id',
    },
  })
  .build();
