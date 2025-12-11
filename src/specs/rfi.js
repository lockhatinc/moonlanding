export default {
  name: 'rfi',
  label: 'RFI',
  labelPlural: 'RFIs',
  icon: 'FileQuestion',
  parent: 'engagement',

  fields: {
    id:            { type: 'id' },
    engagement_id: { type: 'ref', ref: 'engagement', required: true, hidden: true },
    group_name:    { type: 'text', label: 'Group', list: true, groupBy: true },
    question:      { type: 'textarea', label: 'Question', required: true, list: true, search: true },
    response:      { type: 'textarea', label: 'Response' },
    client_status: { type: 'enum', label: 'Client Status', options: 'statuses', list: true, default: 'pending' },
    team_status:   { type: 'enum', label: 'Team Status', options: 'statuses', list: true, default: 'pending' },
    deadline:      { type: 'date', label: 'Deadline', list: true },
    sort_order:    { type: 'int', default: 0, hidden: true },
    created_by:    { type: 'ref', ref: 'user', auto: 'user', readOnly: true },
    created_at:    { type: 'timestamp', auto: 'now', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'sent', label: 'Sent', color: 'amber' },
      { value: 'responded', label: 'Responded', color: 'blue' },
      { value: 'completed', label: 'Completed', color: 'green' },
    ],
  },

  children: {
    attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'rfi' }, label: 'Attachments' },
  },

  list: {
    groupBy: 'group_name',
    expandable: true,
  },

  access: {
    list: ['partner', 'manager', 'clerk', 'client'],
    view: ['partner', 'manager', 'clerk', 'client'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    respond: ['partner', 'manager', 'clerk', 'client'],
    delete: ['partner'],
  },
};
