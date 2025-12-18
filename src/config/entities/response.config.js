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
    created_at: { type: 'int', auto: 'now', hidden: true },
    updated_at: { type: 'int', auto: 'update', hidden: true },
  })
  .build();
