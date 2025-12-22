import { spec } from '../spec-builder.js';
import { PERMISSION_DEFAULTS } from '../permission-defaults.js';

export const clientSpec = spec('client')
  .label('Client', 'Clients')
  .icon('Building')
  .order(3)
  .embedded()
  .fields({
    name: { type: 'text', required: true, list: true, search: true },
    email: { type: 'email' },
    phone: { type: 'text' },
    address: { type: 'textarea' },
  })
  .access(PERMISSION_DEFAULTS)
  .build();
