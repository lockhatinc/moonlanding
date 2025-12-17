import { spec } from '../spec-builder.js';

export const reviewSpec = spec('review')
  .label('Review', 'Reviews')
  .icon('FileText')
  .order(4)
  .parent('engagement')
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    title: { type: 'text', required: true, list: true, search: true },
    document_url: { type: 'text' },
    status: { type: 'enum', options: 'review_status', required: true, list: true, default: 'open' },
    reviewer_id: { type: 'ref', ref: 'user', display: 'user.name' },
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
  .build();
