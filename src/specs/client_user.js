export default {
  name: 'client_user',
  label: 'Contact',
  labelPlural: 'Contacts',
  icon: 'UserCircle',
  embedded: true,

  fields: {
    id:         { type: 'id' },
    client_id:  { type: 'ref', ref: 'client', required: true },
    user_id:    { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
    role:       { type: 'text', label: 'Role', list: true },
    is_primary: { type: 'bool', label: 'Primary Contact', default: false },
    created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
  },
};
