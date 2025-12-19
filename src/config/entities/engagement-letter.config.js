import { spec } from '../spec-builder.js';
import { withAuditFields } from '../spec-templates.js';

export const engagementLetterSpec = withAuditFields(
  spec('engagement_letter')
    .label('Engagement Letter', 'Engagement Letters')
    .icon('FileText')
    .order(10)
    .parent('engagement')
)
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    status: { type: 'enum', options: 'letter_status', required: true, list: true, default: 'requested' },
    document_url: { type: 'text' },
    sent_date: { type: 'int' },
    accepted_date: { type: 'int' },
    rejected_date: { type: 'int' },
    rejection_reason: { type: 'textarea' },
    auditor_notes: { type: 'textarea' },
  })
  .options('letter_status', {
    requested: { label: 'Requested', color: 'blue' },
    reviewing: { label: 'Reviewing', color: 'amber' },
    accepted: { label: 'Accepted', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
  })
  .transitions({
    requested: ['reviewing', 'rejected'],
    reviewing: ['accepted', 'rejected'],
    accepted: [],
    rejected: ['requested'],
  })
  .fieldPermissions({
    document_url: { view: 'all', edit: ['partner', 'manager'] },
    status: { view: 'all', edit: ['partner', 'manager'] },
    accepted_date: { view: 'all', edit: [] },
    rejected_date: { view: 'all', edit: [] },
  })
  .rowAccess({
    scope: 'engagement_team'
  })
  .validate({
    engagement_id: [
      { type: 'required', message: 'Engagement is required' },
    ],
  })
  .onLifecycle({
    onStatusChange: { action: 'notify', template: 'letter_status_changed', recipients: 'engagement.assigned_to' },
  })
  .build();
