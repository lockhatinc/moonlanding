import { createSimpleEntity } from '../spec-factory.js';

export const teamSpec = createSimpleEntity('team', {
  name: { type: 'text', required: true, list: true, search: true },
  description: { type: 'textarea' },
  partners: { type: 'json', default: '[]' },
  users: { type: 'json', default: '[]' },
}, {
  label: 'Team',
  labelPlural: 'Teams',
  icon: 'Users',
  order: 9,
  auditFields: true,
  status: {
    optionsKey: 'team_status',
    values: {
      active: { label: 'Active', color: 'green' },
      inactive: { label: 'Inactive', color: 'gray' },
    },
    defaultValue: 'active',
  },
  searchFields: ['name'],
});
