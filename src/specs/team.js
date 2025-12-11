export default {
  name: 'team',
  label: 'Team',
  labelPlural: 'Teams',
  icon: 'Users',

  fields: {
    id:         { type: 'id' },
    name:       { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    status:     { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
  },

  computed: {
    member_count: { sql: '(SELECT COUNT(*) FROM team_members WHERE team_id = teams.id)' },
  },

  children: {
    members: { entity: 'team_member', fk: 'team_id', label: 'Members' },
    engagements: { entity: 'engagement', fk: 'team_id', label: 'Engagements' },
    reviews: { entity: 'review', fk: 'team_id', label: 'Reviews' },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner'],
    edit: ['partner'],
    delete: ['partner'],
  },
};
