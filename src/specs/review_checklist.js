export default {
  name: 'review_checklist',
  label: 'Review Checklist',
  labelPlural: 'Review Checklists',
  icon: 'ClipboardCheck',
  embedded: true,

  fields: {
    id:           { type: 'id' },
    review_id:    { type: 'ref', ref: 'review', required: true },
    checklist_id: { type: 'ref', ref: 'checklist', required: true, list: true, display: 'checklist.name' },
    items:        { type: 'json', label: 'Items' },
    status:       { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'pending' },
    completed_by: { type: 'ref', ref: 'user' },
    completed_at: { type: 'timestamp' },
    created_at:   { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'in_progress', label: 'In Progress', color: 'blue' },
      { value: 'completed', label: 'Completed', color: 'green' },
    ],
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager', 'clerk'],
    delete: ['partner'],
  },
};
