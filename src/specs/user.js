export default {
  name: 'user',
  label: 'User',
  labelPlural: 'Users',
  icon: 'User',

  fields: {
    id:            { type: 'id' },
    email:         { type: 'email', label: 'Email', required: true, unique: true, list: true, sortable: true, search: true },
    name:          { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    avatar:        { type: 'image', label: 'Avatar', list: true },
    password_hash: { type: 'text', hidden: true },
    type:          { type: 'enum', label: 'Type', options: 'types', list: true, default: 'auditor' },
    role:          { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'clerk' },
    status:        { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    created_at:    { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    types: [
      { value: 'auditor', label: 'Auditor' },
      { value: 'client', label: 'Client' },
    ],
    roles: [
      { value: 'partner', label: 'Partner' },
      { value: 'manager', label: 'Manager' },
      { value: 'clerk', label: 'Clerk' },
    ],
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
  },

  children: {
    teams: { entity: 'team_member', fk: 'user_id', label: 'Teams' },
  },

  access: {
    list: ['partner'],
    view: ['partner'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};
