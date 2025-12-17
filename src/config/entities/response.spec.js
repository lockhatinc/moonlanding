import { spec } from '../spec-builder.js';

export const responseSpec = spec('response')
  .label('Response', 'Responses')
  .icon('MessageSquare')
  .order(6)
  .parent('highlight')
  .embedded()
  .fields({
    highlight_id: { type: 'ref', ref: 'highlight', required: true },
    author_id: { type: 'ref', ref: 'user', display: 'user.name', required: true },
    text: { type: 'textarea', required: true },
  })
  .build();
