import { createSimpleEntity } from '../spec-builder.js';
import { ROLES } from '../constants.js';

export const fileSpec = createSimpleEntity('file', {
  entity_type: { type: 'text', required: true },
  entity_id: { type: 'text', required: true },
  drive_file_id: { type: 'text', required: true },
  file_name: { type: 'text', required: true },
  file_type: { type: 'text' },
  file_size: { type: 'int' },
  mime_type: { type: 'text' },
  download_url: { type: 'text' },
}, {
  label: 'File',
  labelPlural: 'Files',
  icon: 'File',
  access: {
    list: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    create: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    edit: [ROLES.PARTNER],
    delete: [ROLES.PARTNER],
  },
});
