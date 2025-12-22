import { createSimpleEntity } from '../spec-factory.js';
import { ALL_STAFF_ACCESS } from '../permission-defaults.js';

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
  access: ALL_STAFF_ACCESS,
});
