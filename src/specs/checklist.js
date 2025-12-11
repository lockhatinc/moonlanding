export default {
  name: 'checklist',
  label: 'Checklist',
  labelPlural: 'Checklists',
  icon: 'ListChecks',

  fields: {
    id:         { type: 'id' },
    name:       { type: 'text', label: 'Name', required: true, list: true, search: true },
    items:      { type: 'json', label: 'Items' },
    status:     { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
  },

  access: {
    list: ['partner', 'manager'],
    view: ['partner', 'manager'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};
