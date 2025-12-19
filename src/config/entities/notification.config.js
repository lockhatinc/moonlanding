import { spec } from '../spec-builder.js';
import { withTimestamps } from '../spec-templates.js';

export const notificationSpec = withTimestamps(
  spec('notification')
    .label('Notification', 'Notifications')
    .icon('Bell')
    .order(40)
)
  .fields({
    recipient_id: { type: 'ref', ref: 'user', required: true, display: 'user.name' },
    type: { type: 'enum', options: 'notification_type', required: true, list: true },
    subject: { type: 'text', required: true, list: true, search: true },
    content: { type: 'textarea' },
    status: { type: 'enum', options: 'notification_status', required: true, list: true, default: 'pending' },
    related_entity: { type: 'text' },
    related_id: { type: 'text' },
    email_sent: { type: 'bool', default: false },
    read_at: { type: 'int' },
    sent_at: { type: 'int' },
  })
  .options('notification_type', {
    engagement: { label: 'Engagement', color: 'blue' },
    rfi: { label: 'RFI', color: 'amber' },
    review: { label: 'Review', color: 'purple' },
    highlight: { label: 'Highlight', color: 'red' },
    flag: { label: 'Flag', color: 'orange' },
    collaborator: { label: 'Collaborator', color: 'green' },
    system: { label: 'System', color: 'gray' },
  })
  .options('notification_status', {
    pending: { label: 'Pending', color: 'yellow' },
    sent: { label: 'Sent', color: 'blue' },
    failed: { label: 'Failed', color: 'red' },
    delivered: { label: 'Delivered', color: 'green' },
  })
  .list({
    groupBy: 'status',
    defaultSort: { field: 'created_at', dir: 'desc' },
    searchFields: ['subject', 'content'],
    displayRules: {
      subject: { truncate: 80 },
      type: { renderAs: 'badge', colorMapping: 'notification_type' },
      status: { renderAs: 'badge', colorMapping: 'notification_status' },
    },
  })
  .fieldPermissions({
    status: { view: 'all', edit: [] },
    read_at: { view: 'all', edit: [] },
    sent_at: { view: 'all', edit: [] },
  })
  .rowAccess({
    scope: 'recipient_only'
  })
  .validate({
    recipient_id: [
      { type: 'required', message: 'Recipient is required' },
    ],
    subject: [
      { type: 'required', message: 'Subject is required' },
    ],
  })
  .build();
