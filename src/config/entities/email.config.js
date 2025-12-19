import { createSimpleEntity } from '../spec-builder.js';
import { ROLES } from '../constants.js';

export const emailSpec = createSimpleEntity('email', {
  to: { type: 'email', required: true },
  subject: { type: 'text', required: true },
  body: { type: 'textarea', required: true },
  template: { type: 'text' },
}, {
  label: 'Email',
  labelPlural: 'Emails',
  icon: 'Mail',
  access: {
    list: [ROLES.PARTNER, ROLES.MANAGER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [],
    delete: [],
  },
});
