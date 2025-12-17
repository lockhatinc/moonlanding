import { spec } from '../spec-builder.js';
import { ROLES } from '../constants.js';

export const emailSpec = spec('email')
  .label('Email', 'Emails')
  .icon('Mail')
  .fields({
    to: { type: 'email', required: true },
    subject: { type: 'text', required: true },
    body: { type: 'textarea', required: true },
    template: { type: 'text' },
  })
  .access({
    list: [ROLES.PARTNER, ROLES.MANAGER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [],
    delete: [],
  })
  .build();
