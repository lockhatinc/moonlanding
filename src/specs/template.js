export default {
  name: 'template',
  label: 'Template',
  labelPlural: 'Templates',
  icon: 'FileCode',

  fields: {
    id:         { type: 'id' },
    name:       { type: 'text', label: 'Name', required: true, list: true, search: true },
    type:       { type: 'enum', label: 'Type', options: 'types', list: true, default: 'standard' },
    sections:   { type: 'json', label: 'Sections' },
    status:     { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    types: [
      { value: 'standard', label: 'Standard' },
      { value: 'tender', label: 'Tender' },
    ],
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
  },

  access: {
    list: ['partner'],
    view: ['partner'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};
