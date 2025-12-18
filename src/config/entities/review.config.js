import { spec } from '../spec-builder.js';

export const reviewSpec = spec('review')
  .label('Review', 'Reviews')
  .icon('FileText')
  .order(4)
  .parent('engagement')
  .computedField('reviewer_display', '(SELECT name FROM user WHERE user.id = review.reviewer_id LIMIT 1)')
  .computedField('created_by_display', '(SELECT name FROM user WHERE user.id = review.created_by LIMIT 1)')
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    title: { type: 'text', required: true, list: true, search: true },
    document_url: { type: 'text' },
    status: { type: 'enum', options: 'review_status', required: true, list: true, default: 'open' },
    reviewer_id: { type: 'ref', ref: 'user', display: 'user.name' },
    assigned_to: { type: 'ref', ref: 'user', display: 'user.name' },
    created_at: { type: 'int', auto: 'now', hidden: true },
    updated_at: { type: 'int', auto: 'update', hidden: true },
    created_by: { type: 'ref', ref: 'user', display: 'user.name', auto: 'user', hidden: true },
  })
  .options('review_status', {
    open: { label: 'Open', color: 'yellow' },
    closed: { label: 'Closed', color: 'green' },
  })
  .children({
    highlights: {
      entity: 'highlight',
      label: 'Highlights',
      fk: 'review_id',
    },
    checklists: {
      entity: 'checklist',
      label: 'Checklists',
      fk: 'review_id',
    },
  })
  .form({
    sections: [
      { label: 'Basic Info', fields: ['title', 'document_url', 'reviewer_id'] },
      { label: 'Review', fields: ['status'] },
    ],
  })
  .transitions({
    open: ['closed', 'archived'],
    closed: ['archived'],
    archived: [],
  })
  .validate({
    title: [
      { type: 'required', message: 'Title is required' },
      { type: 'minLength', value: 3, message: 'Title must be at least 3 characters' },
    ],
    engagement_id: [
      { type: 'required', message: 'Engagement is required' },
    ],
    status: [
      { type: 'required', message: 'Status is required' },
    ],
  })
  .onLifecycle({
    onCreate: { action: 'notify', template: 'review_created', recipients: 'reviewer_id' },
    onStatusChange: { action: 'notify', template: 'review_status_changed', recipients: 'reviewer_id' },
  })
  .build();
