// All entity specifications in a single file
export const specs = {
  engagement: {
    name: 'engagement', label: 'Engagement', labelPlural: 'Engagements', icon: 'Briefcase',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      client_id: { type: 'ref', label: 'Client', ref: 'client', required: true, list: true, sortable: true, display: 'client.name' },
      year: { type: 'int', label: 'Year', required: true, list: true, sortable: true, width: 80 },
      stage: { type: 'enum', label: 'Stage', options: 'stages', list: true, default: 1 },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      team_id: { type: 'ref', label: 'Team', ref: 'team', list: true, display: 'team.name' },
      deadline: { type: 'date', label: 'Deadline', list: true },
      commencement_date: { type: 'date', label: 'Commencement Date' },
      engagement_type: { type: 'enum', label: 'Type', options: 'engagement_types' },
      letter_status: { type: 'enum', label: 'Letter Status', options: 'letter_statuses', default: 'pending' },
      letter_drive_id: { type: 'text', label: 'Letter File', hidden: true },
      review_id: { type: 'ref', label: 'Linked Review', ref: 'review' },
      created_by: { type: 'ref', label: 'Created By', ref: 'user', auto: 'user', readOnly: true },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
      updated_at: { type: 'timestamp', auto: 'update', readOnly: true },
    },
    options: {
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'completed', label: 'Completed', color: 'blue' },
        { value: 'archived', label: 'Archived', color: 'gray' },
      ],
      stages: [
        { value: 1, label: 'Info Gathering' }, { value: 2, label: 'Engagement Letter' },
        { value: 3, label: 'RFI' }, { value: 4, label: 'Fieldwork' },
        { value: 5, label: 'Review' }, { value: 6, label: 'Completion' },
      ],
      letter_statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'sent', label: 'Sent', color: 'amber' },
        { value: 'signed', label: 'Signed', color: 'green' },
      ],
      engagement_types: [
        { value: 'audit', label: 'Audit' }, { value: 'review', label: 'Review' },
        { value: 'compilation', label: 'Compilation' }, { value: 'agreed_upon', label: 'Agreed Upon Procedures' },
      ],
    },
    children: {
      rfis: { entity: 'rfi', fk: 'engagement_id', label: 'RFIs' },
      files: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Files' },
      chat: { entity: 'chat_message', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Chat', component: 'chat' },
    },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'] },
    form: { sections: [{ label: 'Basic Info', fields: ['name', 'client_id', 'engagement_type', 'year'] }, { label: 'Dates', fields: ['commencement_date', 'deadline'] }, { label: 'Team', fields: ['team_id'] }] },
    list: { defaultSort: { field: 'created_at', dir: 'desc' }, filters: ['status', 'year', 'team_id'] },
  },

  review: {
    name: 'review', label: 'Review', labelPlural: 'Reviews', icon: 'FileSearch',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      team_id: { type: 'ref', label: 'Team', ref: 'team', required: true, list: true, display: 'team.name' },
      template_id: { type: 'ref', label: 'Template', ref: 'template' },
      financial_year: { type: 'text', label: 'Financial Year', list: true },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'open' },
      is_private: { type: 'bool', label: 'Private', default: false },
      wip_value: { type: 'decimal', label: 'WIP Value' },
      deadline: { type: 'date', label: 'Deadline', list: true },
      drive_file_id: { type: 'text', hidden: true },
      drive_folder_id: { type: 'text', hidden: true },
      created_by: { type: 'ref', ref: 'user', auto: 'user', readOnly: true },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
      updated_at: { type: 'timestamp', auto: 'update', readOnly: true },
    },
    options: { statuses: [{ value: 'open', label: 'Open', color: 'green' }, { value: 'closed', label: 'Closed', color: 'gray' }] },
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
    detail: { component: 'review-detail' },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'], resolve: ['partner', 'manager'] },
  },

  client: {
    name: 'client', label: 'Client', labelPlural: 'Clients', icon: 'Building',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      email: { type: 'email', label: 'Email', list: true, search: true },
      address: { type: 'textarea', label: 'Address' },
      entity_type: { type: 'enum', label: 'Entity Type', options: 'entity_types' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      statuses: [{ value: 'active', label: 'Active', color: 'green' }, { value: 'inactive', label: 'Inactive', color: 'gray' }],
      entity_types: [{ value: 'company', label: 'Company' }, { value: 'trust', label: 'Trust' }, { value: 'individual', label: 'Individual' }, { value: 'partnership', label: 'Partnership' }, { value: 'npo', label: 'Non-Profit' }],
    },
    children: { engagements: { entity: 'engagement', fk: 'client_id', label: 'Engagements' }, contacts: { entity: 'client_user', fk: 'client_id', label: 'Contacts' } },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'] },
  },

  rfi: {
    name: 'rfi', label: 'RFI', labelPlural: 'RFIs', icon: 'FileQuestion', parent: 'engagement',
    fields: {
      id: { type: 'id' },
      engagement_id: { type: 'ref', ref: 'engagement', required: true, hidden: true },
      group_name: { type: 'text', label: 'Group', list: true, groupBy: true },
      question: { type: 'textarea', label: 'Question', required: true, list: true, search: true },
      response: { type: 'textarea', label: 'Response' },
      client_status: { type: 'enum', label: 'Client Status', options: 'statuses', list: true, default: 'pending' },
      team_status: { type: 'enum', label: 'Team Status', options: 'statuses', list: true, default: 'pending' },
      deadline: { type: 'date', label: 'Deadline', list: true },
      sort_order: { type: 'int', default: 0, hidden: true },
      created_by: { type: 'ref', ref: 'user', auto: 'user', readOnly: true },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: { statuses: [{ value: 'pending', label: 'Pending', color: 'yellow' }, { value: 'sent', label: 'Sent', color: 'amber' }, { value: 'responded', label: 'Responded', color: 'blue' }, { value: 'completed', label: 'Completed', color: 'green' }] },
    children: { attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'rfi' }, label: 'Attachments' } },
    list: { groupBy: 'group_name', expandable: true },
    access: { list: ['partner', 'manager', 'clerk', 'client'], view: ['partner', 'manager', 'clerk', 'client'], create: ['partner', 'manager'], edit: ['partner', 'manager'], respond: ['partner', 'manager', 'clerk', 'client'], delete: ['partner'] },
  },

  highlight: {
    name: 'highlight', label: 'Query', labelPlural: 'Queries', icon: 'MessageSquare', parent: 'review',
    fields: {
      id: { type: 'id' },
      review_id: { type: 'ref', ref: 'review', required: true, hidden: true },
      page_number: { type: 'int', label: 'Page', required: true, list: true },
      position: { type: 'json', label: 'Position', required: true, hidden: true },
      content: { type: 'text', label: 'Selected Text' },
      comment: { type: 'textarea', label: 'Comment', list: true, search: true },
      type: { type: 'enum', label: 'Type', options: 'types', default: 'text' },
      resolved: { type: 'bool', label: 'Resolved', list: true, default: false },
      resolved_by: { type: 'ref', ref: 'user' },
      resolved_at: { type: 'timestamp' },
      created_by: { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    options: { types: [{ value: 'text', label: 'Text Selection' }, { value: 'area', label: 'Area Selection' }] },
    children: { responses: { entity: 'highlight_response', fk: 'highlight_id', label: 'Responses' } },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager', 'clerk'], edit: ['partner', 'manager'], delete: ['partner'], resolve: ['partner', 'manager'] },
  },

  highlight_response: {
    name: 'highlight_response', label: 'Response', labelPlural: 'Responses', icon: 'MessageCircle', embedded: true,
    fields: {
      id: { type: 'id' },
      highlight_id: { type: 'ref', ref: 'highlight', required: true },
      content: { type: 'textarea', label: 'Response', required: true, list: true },
      created_by: { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager', 'clerk'], edit: ['partner', 'manager'], delete: ['partner'] },
  },

  user: {
    name: 'user', label: 'User', labelPlural: 'Users', icon: 'User',
    fields: {
      id: { type: 'id' },
      email: { type: 'email', label: 'Email', required: true, unique: true, list: true, sortable: true, search: true },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      avatar: { type: 'image', label: 'Avatar', list: true },
      password_hash: { type: 'text', hidden: true },
      type: { type: 'enum', label: 'Type', options: 'types', list: true, default: 'auditor' },
      role: { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'clerk' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      types: [{ value: 'auditor', label: 'Auditor' }, { value: 'client', label: 'Client' }],
      roles: [{ value: 'partner', label: 'Partner' }, { value: 'manager', label: 'Manager' }, { value: 'clerk', label: 'Clerk' }],
      statuses: [{ value: 'active', label: 'Active', color: 'green' }, { value: 'inactive', label: 'Inactive', color: 'gray' }],
    },
    children: { teams: { entity: 'team_member', fk: 'user_id', label: 'Teams' } },
    access: { list: ['partner'], view: ['partner'], create: ['partner'], edit: ['partner'], delete: ['partner'] },
  },

  team: {
    name: 'team', label: 'Team', labelPlural: 'Teams', icon: 'Users',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: { statuses: [{ value: 'active', label: 'Active', color: 'green' }, { value: 'inactive', label: 'Inactive', color: 'gray' }] },
    computed: { member_count: { sql: '(SELECT COUNT(*) FROM team_members WHERE team_id = teams.id)' } },
    children: { members: { entity: 'team_member', fk: 'team_id', label: 'Members' }, engagements: { entity: 'engagement', fk: 'team_id', label: 'Engagements' }, reviews: { entity: 'review', fk: 'team_id', label: 'Reviews' } },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner'], edit: ['partner'], delete: ['partner'] },
  },

  team_member: {
    name: 'team_member', label: 'Team Member', labelPlural: 'Team Members', icon: 'UserPlus', embedded: true,
    fields: {
      id: { type: 'id' },
      team_id: { type: 'ref', ref: 'team', required: true },
      user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      role: { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'member' },
    },
    options: { roles: [{ value: 'partner', label: 'Partner' }, { value: 'member', label: 'Member' }] },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner'], edit: ['partner'], delete: ['partner'] },
  },

  file: {
    name: 'file', label: 'File', labelPlural: 'Files', icon: 'File', embedded: true,
    fields: {
      id: { type: 'id' },
      entity_type: { type: 'text', required: true },
      entity_id: { type: 'text', required: true },
      drive_file_id: { type: 'text', required: true },
      file_name: { type: 'text', label: 'Name', list: true },
      file_type: { type: 'text', label: 'Type', list: true },
      file_size: { type: 'int', label: 'Size' },
      uploaded_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager', 'clerk'], delete: ['partner', 'manager'] },
  },

  chat_message: {
    name: 'chat_message', label: 'Message', labelPlural: 'Messages', icon: 'MessageSquare', embedded: true,
    fields: {
      id: { type: 'id' },
      entity_type: { type: 'text', required: true },
      entity_id: { type: 'text', required: true },
      content: { type: 'textarea', label: 'Message', required: true },
      attachments: { type: 'json' },
      is_team_only: { type: 'bool', label: 'Team Only', default: false },
      created_by: { type: 'ref', ref: 'user', auto: 'user', display: 'user.name' },
      created_at: { type: 'timestamp', auto: 'now' },
    },
    access: { list: ['partner', 'manager', 'clerk', 'client'], view: ['partner', 'manager', 'clerk', 'client'], create: ['partner', 'manager', 'clerk', 'client'], delete: ['partner', 'manager'] },
  },

  template: {
    name: 'template', label: 'Template', labelPlural: 'Templates', icon: 'FileCode',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, search: true },
      type: { type: 'enum', label: 'Type', options: 'types', list: true, default: 'standard' },
      sections: { type: 'json', label: 'Sections' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      types: [{ value: 'standard', label: 'Standard' }, { value: 'tender', label: 'Tender' }],
      statuses: [{ value: 'active', label: 'Active', color: 'green' }, { value: 'inactive', label: 'Inactive', color: 'gray' }],
    },
    access: { list: ['partner'], view: ['partner'], create: ['partner'], edit: ['partner'], delete: ['partner'] },
  },

  checklist: {
    name: 'checklist', label: 'Checklist', labelPlural: 'Checklists', icon: 'ListChecks',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, search: true },
      items: { type: 'json', label: 'Items' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: { statuses: [{ value: 'active', label: 'Active', color: 'green' }, { value: 'inactive', label: 'Inactive', color: 'gray' }] },
    access: { list: ['partner', 'manager'], view: ['partner', 'manager'], create: ['partner'], edit: ['partner'], delete: ['partner'] },
  },

  review_checklist: {
    name: 'review_checklist', label: 'Review Checklist', labelPlural: 'Review Checklists', icon: 'ClipboardCheck', embedded: true,
    fields: {
      id: { type: 'id' },
      review_id: { type: 'ref', ref: 'review', required: true },
      checklist_id: { type: 'ref', ref: 'checklist', required: true, list: true, display: 'checklist.name' },
      items: { type: 'json', label: 'Items' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'pending' },
      completed_by: { type: 'ref', ref: 'user' },
      completed_at: { type: 'timestamp' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: { statuses: [{ value: 'pending', label: 'Pending', color: 'yellow' }, { value: 'in_progress', label: 'In Progress', color: 'blue' }, { value: 'completed', label: 'Completed', color: 'green' }] },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager', 'clerk'], delete: ['partner'] },
  },

  client_user: {
    name: 'client_user', label: 'Contact', labelPlural: 'Contacts', icon: 'UserCircle', embedded: true,
    fields: {
      id: { type: 'id' },
      client_id: { type: 'ref', ref: 'client', required: true },
      user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      role: { type: 'text', label: 'Role', list: true },
      is_primary: { type: 'bool', label: 'Primary Contact', default: false },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    access: { list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'], create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'] },
  },
};

export function getSpec(name) {
  const spec = specs[name];
  if (!spec) throw new Error(`Unknown entity: ${name}`);
  return spec;
}

export function getListFields(spec) {
  return Object.entries(spec.fields).filter(([_, f]) => f.list).map(([key, f]) => ({ key, ...f }));
}

export function getFormFields(spec) {
  return Object.entries(spec.fields).filter(([_, f]) => !f.hidden && !f.readOnly && f.type !== 'id').map(([key, f]) => ({ key, ...f }));
}

export function getOptions(spec, optionsKey) {
  return spec.options?.[optionsKey] || [];
}

export function getNavItems() {
  return Object.values(specs).filter(s => !s.embedded && !s.parent).map(s => ({ name: s.name, label: s.labelPlural, icon: s.icon, href: `/${s.name}` }));
}
