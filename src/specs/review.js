export default {
  name: 'review',
  label: 'Review',
  labelPlural: 'Reviews',
  icon: 'FileSearch',

  fields: {
    id:           { type: 'id' },
    name:         { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
    team_id:      { type: 'ref', label: 'Team', ref: 'team', required: true, list: true, display: 'team.name' },
    template_id:  { type: 'ref', label: 'Template', ref: 'template' },
    financial_year: { type: 'text', label: 'Financial Year', list: true },
    status:       { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'open' },
    is_private:   { type: 'bool', label: 'Private', default: false },
    wip_value:    { type: 'decimal', label: 'WIP Value' },
    deadline:     { type: 'date', label: 'Deadline', list: true },
    drive_file_id:   { type: 'text', hidden: true },
    drive_folder_id: { type: 'text', hidden: true },
    created_by:   { type: 'ref', ref: 'user', auto: 'user', readOnly: true },
    created_at:   { type: 'timestamp', auto: 'now', readOnly: true },
    updated_at:   { type: 'timestamp', auto: 'update', readOnly: true },
  },

  options: {
    statuses: [
      { value: 'open', label: 'Open', color: 'green' },
      { value: 'closed', label: 'Closed', color: 'gray' },
    ],
  },

  computed: {
    highlight_count: { sql: '(SELECT COUNT(*) FROM highlights WHERE review_id = reviews.id)' },
    unresolved_count: { sql: '(SELECT COUNT(*) FROM highlights WHERE review_id = reviews.id AND resolved = 0)' },
  },

  children: {
    highlights: { entity: 'highlight', fk: 'review_id', label: 'Queries' },
    checklists: { entity: 'review_checklist', fk: 'review_id', label: 'Checklists' },
    attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'review' }, label: 'Files' },
    chat: { entity: 'chat_message', fk: 'entity_id', filter: { entity_type: 'review' }, label: 'Chat', component: 'chat' },
  },

  detail: {
    component: 'review-detail',
  },

  access: {
    list: ['partner', 'manager', 'clerk'],
    view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'],
    edit: ['partner', 'manager'],
    delete: ['partner'],
    resolve: ['partner', 'manager'],
  },
};
