import { createSimpleEntity } from '../spec-factory.js';

export const checklistSpec = createSimpleEntity('checklist', {
  review_id: { type: 'ref', ref: 'review', required: true },
  title: { type: 'text', required: true, list: true },
  items: { type: 'json', default: [] },
}, {
  label: 'Checklist',
  labelPlural: 'Checklists',
  icon: 'CheckCircle',
  order: 7,
  parent: 'review',
  embedded: true,
  auditFields: true,
});
