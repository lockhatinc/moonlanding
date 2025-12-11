export default {
  name: 'highlight_response',
  label: 'Response',
  labelPlural: 'Responses',
  icon: 'MessageCircle',
  embedded: true,

  fields: {
    id:           { type: 'id' },
    highlight_id: { type: 'ref', ref: 'highlight', required: true },
    content:      { type: 'textarea', label: 'Response', required: true, list: true },
    created_by:   { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
    created_at:   { type: 'timestamp', auto: 'now', list: true },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager', 'clerk'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
  },
};
