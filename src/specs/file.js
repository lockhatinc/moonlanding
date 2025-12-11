export default {
  name: 'file',
  label: 'File',
  labelPlural: 'Files',
  icon: 'File',
  embedded: true,

  fields: {
    id:            { type: 'id' },
    entity_type:   { type: 'text', required: true },
    entity_id:     { type: 'text', required: true },
    drive_file_id: { type: 'text', required: true },
    file_name:     { type: 'text', label: 'Name', list: true },
    file_type:     { type: 'text', label: 'Type', list: true },
    file_size:     { type: 'int', label: 'Size' },
    uploaded_by:   { type: 'ref', ref: 'user', auto: 'user' },
    created_at:    { type: 'timestamp', auto: 'now', list: true },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager', 'clerk'],
    delete: ['partner', 'manager'],
  },
};
