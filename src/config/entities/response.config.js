import { createSimpleEntity } from '../spec-builder.js';

export const responseSpec = createSimpleEntity('response', {
  highlight_id: { type: 'ref', ref: 'highlight', required: true },
  author_id: { type: 'ref', ref: 'user', display: 'user.name', required: true },
  text: { type: 'textarea', required: true },
}, {
  label: 'Response',
  labelPlural: 'Responses',
  icon: 'MessageSquare',
  order: 6,
  parent: 'highlight',
  embedded: true,
  timestamps: true,
});
