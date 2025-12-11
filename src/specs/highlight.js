export default {
  name: 'highlight',
  label: 'Query',
  labelPlural: 'Queries',
  icon: 'MessageSquare',
  parent: 'review',

  fields: {
    id:          { type: 'id' },
    review_id:   { type: 'ref', ref: 'review', required: true, hidden: true },
    page_number: { type: 'int', label: 'Page', required: true, list: true },
    position:    { type: 'json', label: 'Position', required: true, hidden: true },
    content:     { type: 'text', label: 'Selected Text' },
    comment:     { type: 'textarea', label: 'Comment', list: true, search: true },
    type:        { type: 'enum', label: 'Type', options: 'types', default: 'text' },
    resolved:    { type: 'bool', label: 'Resolved', list: true, default: false },
    resolved_by: { type: 'ref', ref: 'user' },
    resolved_at: { type: 'timestamp' },
    created_by:  { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
    created_at:  { type: 'timestamp', auto: 'now', list: true },
  },

  options: {
    types: [
      { value: 'text', label: 'Text Selection' },
      { value: 'area', label: 'Area Selection' },
    ],
  },

  children: {
    responses: { entity: 'highlight_response', fk: 'highlight_id', label: 'Responses' },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager', 'clerk'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
    resolve: ['partner', 'manager'],
  },
};
