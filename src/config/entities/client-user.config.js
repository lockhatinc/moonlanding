import { createSimpleEntity } from '../spec-factory.js';

export const clientUserSpec = createSimpleEntity('client_user', {
  client_id: { type: 'ref', ref: 'client', required: true },
  user_id: { type: 'ref', ref: 'user', required: true },
  role: { type: 'enum', options: 'client_user_role', required: true, default: 'user' },
  status: { type: 'enum', options: 'client_user_status', required: true, default: 'active' },
}, {
  label: 'Client User',
  labelPlural: 'Client Users',
  icon: 'Users',
  order: 3,
  parent: 'client',
  embedded: true,
  timestamps: true,
  customOptions: {
    client_user_role: {
      admin: { label: 'Admin', color: 'red' },
      user: { label: 'User', color: 'blue' },
    },
    client_user_status: {
      active: { label: 'Active', color: 'green' },
      inactive: { label: 'Inactive', color: 'gray' },
    },
  },
});
