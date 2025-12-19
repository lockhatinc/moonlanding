import { spec } from '../spec-builder.js';
import { ROLES } from '../constants.js';

export const userSpec = spec('user')
  .label('User', 'Users')
  .icon('User')
  .order(1)
  .fields({
    email: { type: 'email', required: true, unique: true, list: true, search: true },
    name: { type: 'text', required: true, list: true, search: true },
    role: { type: 'enum', options: 'roles', required: true, list: true },
    status: { type: 'enum', options: 'user_status', required: true, list: true, default: 'active' },
    avatar: { type: 'text' },
    priority_reviews: { type: 'json', default: '[]', hidden: true },
    client_access: { type: 'json', default: '[]', hidden: true },
  })
  .options('roles', {
    partner: { label: 'Partner', color: 'red' },
    manager: { label: 'Manager', color: 'blue' },
    clerk: { label: 'Clerk', color: 'gray' },
    auditor: { label: 'Auditor', color: 'amber' },
    client: { label: 'Client', color: 'green' },
  })
  .options('user_status', {
    active: { label: 'Active', color: 'green' },
    inactive: { label: 'Inactive', color: 'gray' },
  })
  .list({
    groupBy: 'status',
    defaultSort: { field: 'name', dir: 'asc' },
    searchFields: ['name', 'email'],
    displayRules: {
      role: { renderAs: 'badge', colorMapping: 'roles' },
      status: { renderAs: 'badge', colorMapping: 'user_status' },
    },
  })
  .fieldPermissions({
    role: { view: ['partner', 'manager'], edit: ['partner'] },
    status: { view: ['partner', 'manager'], edit: ['partner'] },
    priority_reviews: { view: ['partner'], edit: [] },
    client_access: { view: ['partner'], edit: ['partner'] },
  })
  .access({
    list: [ROLES.PARTNER, ROLES.MANAGER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
    create: [ROLES.PARTNER],
    edit: [ROLES.PARTNER],
    delete: [ROLES.PARTNER],
  })
  .build();
