import { createSimpleEntity } from '../spec-factory.js';

export const messageSpec = createSimpleEntity('message', {
  rfi_id: { type: 'ref', ref: 'rfi', required: true },
  author_id: { type: 'ref', ref: 'user', display: 'user.name', required: true },
  text: { type: 'textarea', required: true },
}, {
  label: 'Message',
  labelPlural: 'Messages',
  icon: 'MessageCircle',
  order: 9,
  parent: 'rfi',
  embedded: true,
  timestamps: true,
});
