import { spec } from '../spec-builder.js';

export const messageSpec = spec('message')
  .label('Message', 'Messages')
  .icon('MessageCircle')
  .order(9)
  .parent('rfi')
  .embedded()
  .fields({
    rfi_id: { type: 'ref', ref: 'rfi', required: true },
    author_id: { type: 'ref', ref: 'user', display: 'user.name', required: true },
    text: { type: 'textarea', required: true },
  })
  .build();
