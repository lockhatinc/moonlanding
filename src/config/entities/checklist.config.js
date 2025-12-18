import { spec } from '../spec-builder.js';

export const checklistSpec = spec('checklist')
  .label('Checklist', 'Checklists')
  .icon('CheckCircle')
  .order(7)
  .parent('review')
  .embedded()
  .fields({
    review_id: { type: 'ref', ref: 'review', required: true },
    title: { type: 'text', required: true, list: true },
    items: { type: 'json', default: [] },
  })
  .build();
