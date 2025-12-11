export default {
  name: 'engagement',
  label: 'Engagement',
  labelPlural: 'Engagements',
  icon: 'Briefcase',

  fields: {
    id:          { type: 'id' },
    name:        { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    client_id:   { type: 'ref', label: 'Client', ref: 'client', required: true, list: true, sortable: true, display: 'client.name' },
    year:        { type: 'int', label: 'Year', required: true, list: true, sortable: true, width: 80 },
    stage:       { type: 'enum', label: 'Stage', options: 'stages', list: true, default: 1 },
    status:      { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
    team_id:     { type: 'ref', label: 'Team', ref: 'team', list: true, display: 'team.name' },
    deadline:    { type: 'date', label: 'Deadline', list: true },
    commencement_date: { type: 'date', label: 'Commencement Date' },
    engagement_type:   { type: 'enum', label: 'Type', options: 'engagement_types' },
    letter_status:     { type: 'enum', label: 'Letter Status', options: 'letter_statuses', default: 'pending' },
    letter_drive_id:   { type: 'text', label: 'Letter File', hidden: true },
    review_id:   { type: 'ref', label: 'Linked Review', ref: 'review' },
    created_by:  { type: 'ref', label: 'Created By', ref: 'user', auto: 'user', readOnly: true },
    created_at:  { type: 'timestamp', auto: 'now', readOnly: true },
    updated_at:  { type: 'timestamp', auto: 'update', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'completed', label: 'Completed', color: 'blue' },
      { value: 'archived', label: 'Archived', color: 'gray' },
    ],
    stages: [
      { value: 1, label: 'Info Gathering' },
      { value: 2, label: 'Engagement Letter' },
      { value: 3, label: 'RFI' },
      { value: 4, label: 'Fieldwork' },
      { value: 5, label: 'Review' },
      { value: 6, label: 'Completion' },
    ],
    letter_statuses: [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'sent', label: 'Sent', color: 'amber' },
      { value: 'signed', label: 'Signed', color: 'green' },
    ],
    engagement_types: [
      { value: 'audit', label: 'Audit' },
      { value: 'review', label: 'Review' },
      { value: 'compilation', label: 'Compilation' },
      { value: 'agreed_upon', label: 'Agreed Upon Procedures' },
    ],
  },

  children: {
    rfis: { entity: 'rfi', fk: 'engagement_id', label: 'RFIs' },
    files: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Files' },
    chat: { entity: 'chat_message', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Chat', component: 'chat' },
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
  },

  actions: [
    { key: 'send_letter', label: 'Send Letter', icon: 'Mail', permission: 'edit', handler: 'sendEngagementLetter' },
    { key: 'link_review', label: 'Link Review', icon: 'Link', permission: 'edit', dialog: 'linkReview' },
  ],

  form: {
    sections: [
      { label: 'Basic Info', fields: ['name', 'client_id', 'engagement_type', 'year'] },
      { label: 'Dates', fields: ['commencement_date', 'deadline'] },
      { label: 'Team', fields: ['team_id'] },
    ],
  },

  list: {
    defaultSort: { field: 'created_at', dir: 'desc' },
    filters: ['status', 'year', 'team_id'],
  },
};
