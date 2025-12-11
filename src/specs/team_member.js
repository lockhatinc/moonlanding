export default {
  name: 'team_member',
  label: 'Team Member',
  labelPlural: 'Team Members',
  icon: 'UserPlus',
  embedded: true,

  fields: {
    id:      { type: 'id' },
    team_id: { type: 'ref', ref: 'team', required: true },
    user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
    role:    { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'member' },
  },

  options: {
    roles: [
      { value: 'partner', label: 'Partner' },
      { value: 'member', label: 'Member' },
    ],
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};
