export default {
  name: 'chat_message',
  label: 'Message',
  labelPlural: 'Messages',
  icon: 'MessageSquare',
  embedded: true,

  fields: {
    id:           { type: 'id' },
    entity_type:  { type: 'text', required: true },
    entity_id:    { type: 'text', required: true },
    content:      { type: 'textarea', label: 'Message', required: true },
    attachments:  { type: 'json' },
    is_team_only: { type: 'bool', label: 'Team Only', default: false },
    created_by:   { type: 'ref', ref: 'user', auto: 'user', display: 'user.name' },
    created_at:   { type: 'timestamp', auto: 'now' },
  },

  access: {
    list: ['partner', 'manager', 'clerk', 'client'],
    view: ['partner', 'manager', 'clerk', 'client'],
    create: ['partner', 'manager', 'clerk', 'client'],
    delete: ['partner', 'manager'],
  },
};
