import { spec } from '../spec-builder.js';
import { PARTNER_MANAGER_ACCESS } from '../permission-defaults.js';

export const userSpec = spec('user')
  .label('User', 'Users')
  .icon('User')
  .order(1)
  .fields({
    email: { type: 'email', required: true, unique: true, list: true, search: true },
    name: { type: 'text', required: true, list: true, search: true },
    role: { type: 'enum', options: 'roles', required: true, list: true },
  })
  .options('roles', {
    partner: { label: 'Partner', color: 'red' },
    manager: { label: 'Manager', color: 'blue' },
    clerk: { label: 'Clerk', color: 'gray' },
    auditor: { label: 'Auditor', color: 'amber' },
    client: { label: 'Client', color: 'green' },
  })
  .access(PARTNER_MANAGER_ACCESS)
  .build();
