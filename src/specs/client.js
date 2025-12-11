export default {
  name: 'client',
  label: 'Client',
  labelPlural: 'Clients',
  icon: 'Building',

  fields: {
    id:          { type: 'id' },
    name:        { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    email:       { type: 'email', label: 'Email', list: true, search: true },
    address:     { type: 'textarea', label: 'Address' },
    entity_type: { type: 'enum', label: 'Entity Type', options: 'entity_types' },
    status:      { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    created_at:  { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
    ],
    entity_types: [
      { value: 'company', label: 'Company' },
      { value: 'trust', label: 'Trust' },
      { value: 'individual', label: 'Individual' },
      { value: 'partnership', label: 'Partnership' },
      { value: 'npo', label: 'Non-Profit' },
    ],
  },

  children: {
    engagements: { entity: 'engagement', fk: 'client_id', label: 'Engagements' },
    contacts: { entity: 'client_user', fk: 'client_id', label: 'Contacts' },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
  },
};
