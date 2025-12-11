// Entity Specifications - Unified Platform
// Uses shared constants for reduced duplication

import {
  STATUS, WORKFLOW_STATUS, ENGAGEMENT_STAGES, STAGE_WORKFLOW, REPEAT_INTERVALS,
  FIELDS, timestampFields, auditFields, resolutionFields, partialResolutionFields,
  ACCESS, HIGHLIGHT_COLORS, USER_TYPES, USER_ROLES, CLIENT_USER_ROLES, TEAM_MEMBER_ROLES,
  AUTH_PROVIDERS, NOTIFICATION_TYPES, ACTIVITY_ACTIONS, LOG_LEVELS, ENGAGEMENT_TYPES,
  ENTITY_TYPES, TEMPLATE_TYPES, TEMPLATE_TARGET_TYPES, FLAG_TYPES, HIGHLIGHT_TYPES,
  COLLABORATOR_TYPES, MESSAGE_SOURCES, CLIENT_NOTIFICATION_TYPES, RFI_STATUSES, SEED_DATA,
  withStandardChildren, action, actions, embeddedSpec, configSpec,
} from './specs/constants.js';

// ========================================
// ENTITY SPECIFICATIONS
// ========================================

export const specs = {
  // === ENGAGEMENT ===
  engagement: {
    name: 'engagement', label: 'Engagement', labelPlural: 'Engagements', icon: 'Briefcase',
    fields: {
      id: FIELDS.id,
      name: FIELDS.name(),
      client_id: { type: 'ref', label: 'Client', ref: 'client', required: true, list: true, sortable: true, display: 'client.name' },
      year: { type: 'int', label: 'Year', required: true, list: true, sortable: true, width: 80 },
      month: { type: 'int', label: 'Month' },
      stage: { type: 'enum', label: 'Stage', options: 'stages', list: true, default: 'info_gathering' },
      status: FIELDS.status('statuses', 'pending'),
      team_id: { type: 'ref', label: 'Team', ref: 'team', list: true, display: 'avatars' },
      template_id: { type: 'ref', label: 'Template', ref: 'template' },
      engagement_type_id: { type: 'ref', ref: 'engagement_type_config', label: 'Type', list: true, display: 'engagement_type_config.name' },
      engagement_type: { type: 'enum', label: 'Type (Legacy)', options: 'engagement_types', hidden: true },
      // Dates
      commencement_date: { type: 'date', label: 'Commencement Date' },
      completion_date: { type: 'date', label: 'Completion Date' },
      deadline: { type: 'date', label: 'Deadline', list: true },
      // Multi-dimensional status tracking
      client_status: { type: 'enum', label: 'Client Status', options: 'client_statuses', default: 'pending' },
      auditor_status: { type: 'enum', label: 'Auditor Status', options: 'auditor_statuses', default: 'requested' },
      letter_client_status: { type: 'enum', label: 'Letter (Client)', options: 'letter_client_statuses', default: 'pending' },
      letter_auditor_status: { type: 'enum', label: 'Letter (Auditor)', options: 'letter_auditor_statuses', default: 'pending' },
      letter_drive_id: { type: 'text', label: 'Letter File', hidden: true },
      post_rfi_client_status: { type: 'enum', label: 'Post-RFI (Client)', options: 'post_rfi_client_statuses', default: 'pending' },
      post_rfi_auditor_status: { type: 'enum', label: 'Post-RFI (Auditor)', options: 'post_rfi_auditor_statuses', default: 'pending' },
      post_rfi_drive_id: { type: 'text', hidden: true },
      post_rfi_journal: { type: 'json', label: 'Post-RFI Journal' },
      // Progress
      progress: { type: 'int', label: 'Progress', list: true, default: 0 },
      client_progress: { type: 'int', label: 'Client Progress', default: 0 },
      // Financial
      fee: { type: 'decimal', label: 'Fee' },
      wip_value: { type: 'decimal', label: 'WIP Value' },
      // Recreation
      repeat_interval: { type: 'enum', label: 'Repeat', options: 'repeat_intervals', default: 'once' },
      recreate_with_attachments: { type: 'bool', label: 'Copy Attachments on Recreation', default: false },
      // Links
      review_id: { type: 'ref', label: 'Linked Review', ref: 'review' },
      previous_year_review_id: { type: 'ref', label: 'Previous Year Review', ref: 'review' },
      rfis_linked: { type: 'json', label: 'Linked RFIs' },
      // Settings
      clerks_can_approve: { type: 'bool', label: 'Clerks Can Approve', default: false },
      is_private: { type: 'bool', label: 'Private', default: false },
      users: { type: 'json', label: 'Assigned Users' },
      client_users: { type: 'json', label: 'Client Users' },
      // Feedback
      feedback_rating: { type: 'int', label: 'Client Rating' },
      feedback_comment: { type: 'textarea', label: 'Client Feedback' },
      feedback_date: { type: 'timestamp', label: 'Feedback Date' },
      ...auditFields(),
    },
    options: {
      statuses: STATUS.PENDING_ACTIVE,
      stages: ENGAGEMENT_STAGES,
      client_statuses: WORKFLOW_STATUS.CLIENT,
      auditor_statuses: WORKFLOW_STATUS.AUDITOR,
      letter_client_statuses: WORKFLOW_STATUS.LETTER_CLIENT,
      letter_auditor_statuses: WORKFLOW_STATUS.LETTER_AUDITOR,
      post_rfi_client_statuses: WORKFLOW_STATUS.POST_RFI_CLIENT,
      post_rfi_auditor_statuses: WORKFLOW_STATUS.POST_RFI_AUDITOR,
      engagement_types: ENGAGEMENT_TYPES,
      repeat_intervals: REPEAT_INTERVALS,
    },
    computed: {
      rfi_count: { sql: '(SELECT COUNT(*) FROM rfis WHERE engagement_id = engagements.id)' },
      completed_rfi_count: { sql: "(SELECT COUNT(*) FROM rfis WHERE engagement_id = engagements.id AND client_status = 'completed')" },
    },
    children: withStandardChildren('engagement', {
      sections: { entity: 'engagement_section', fk: 'engagement_id', label: 'Sections' },
      rfis: { entity: 'rfi', fk: 'engagement_id', label: 'RFIs' },
    }),
    access: { ...ACCESS.MANAGER_MANAGE, list: ['partner', 'manager', 'clerk', 'client'], view: ['partner', 'manager', 'clerk', 'client'], change_stage: ['partner', 'manager'], close: ['partner'] },
    actions: [
      { key: 'send_letter', label: 'Send Letter', icon: 'Mail', permission: 'edit', handler: 'sendEngagementLetter' },
      { key: 'link_review', label: 'Link Review', icon: 'Link', permission: 'edit', dialog: 'linkReview' },
      { key: 'recreate', label: 'Recreate', icon: 'RefreshCw', permission: 'edit', handler: 'recreateEngagement' },
      { key: 'generate_letter', label: 'Generate Letter', icon: 'FileText', permission: 'edit', handler: 'generateEngagementLetter' },
    ],
    workflow: { stage_transitions: STAGE_WORKFLOW },
    form: {
      sections: [
        { label: 'Basic Info', fields: ['name', 'client_id', 'engagement_type_id', 'year', 'month'] },
        { label: 'Dates', fields: ['commencement_date', 'completion_date', 'deadline'] },
        { label: 'Team', fields: ['team_id', 'template_id'] },
        { label: 'Settings', fields: ['repeat_interval', 'recreate_with_attachments', 'clerks_can_approve', 'is_private'] },
        { label: 'Financial', fields: ['fee', 'wip_value'] },
      ],
    },
    list: { defaultSort: { field: 'created_at', dir: 'desc' }, filters: ['status', 'stage', 'year', 'team_id', 'engagement_type_id'] },
    triggers: { onCreate: 'onEngagementCreate', onUpdate: 'onEngagementUpdate', onDelete: 'onEngagementDelete' },
  },

  // === REVIEW ===
  review: {
    name: 'review', label: 'Review', labelPlural: 'Reviews', icon: 'FileSearch',
    fields: {
      id: FIELDS.id,
      name: FIELDS.name(),
      group_name: { type: 'text', label: 'Group Name', list: true },
      team_id: { type: 'ref', label: 'Team', ref: 'team', required: true, list: true, display: 'team.name' },
      template_id: { type: 'ref', label: 'Template', ref: 'template' },
      financial_year: { type: 'text', label: 'Financial Year', list: true },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'open' },
      stage: { type: 'int', label: 'Stage', list: true, default: 1 },
      is_private: { type: 'bool', label: 'Private', default: false },
      wip_value: { type: 'decimal', label: 'WIP Value' },
      deadline: { type: 'date', label: 'Deadline', list: true },
      published_date: { type: 'timestamp', label: 'Published Date' },
      closed_date: { type: 'timestamp', label: 'Closed Date' },
      drive_file_id: { type: 'text', hidden: true },
      drive_folder_id: { type: 'text', hidden: true },
      file_url: { type: 'text', label: 'File URL', hidden: true },
      attachment_folder_url: { type: 'text', hidden: true },
      cached_pdf_url: { type: 'text', hidden: true },
      cached_pdf_expires: { type: 'timestamp', hidden: true },
      highlights: { type: 'json', label: 'Highlights' },
      flags: { type: 'json', label: 'Flags' },
      tags: { type: 'json', label: 'Tags' },
      tender_flags: { type: 'json', label: 'Tender Flags' },
      collaborators: { type: 'json', label: 'Collaborators' },
      collaborator_ids: { type: 'json', label: 'Collaborator IDs' },
      sections: { type: 'json', label: 'Checklist Sections' },
      published: { type: 'bool', label: 'Published', default: false },
      is_tender: { type: 'bool', label: 'Tender', default: false },
      tender_details: { type: 'json', label: 'Tender Details' },
      has_email_checklist: { type: 'bool', label: 'Has Email Checklist', default: false },
      friday_link: { type: 'text', label: 'Friday Engagement ID', hidden: true },
      first_manager_id: { type: 'ref', ref: 'user', label: 'First Manager' },
      email: { type: 'email', label: 'Email' },
      ...auditFields(),
    },
    options: { statuses: STATUS.OPEN_CLOSED },
    computed: {
      highlight_count: { sql: '(SELECT COUNT(*) FROM highlights WHERE review_id = reviews.id)' },
      unresolved_count: { sql: '(SELECT COUNT(*) FROM highlights WHERE review_id = reviews.id AND resolved = 0)' },
      collaborator_count: { sql: '(SELECT COUNT(*) FROM collaborators WHERE review_id = reviews.id)' },
    },
    children: withStandardChildren('review', {
      highlights: { entity: 'highlight', fk: 'review_id', label: 'Queries' },
      checklists: { entity: 'review_checklist', fk: 'review_id', label: 'Checklists' },
      collaborators: { entity: 'collaborator', fk: 'review_id', label: 'Collaborators' },
      attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'review' }, label: 'Files' },
    }),
    detail: { component: 'review-detail' },
    access: { ...ACCESS.MANAGER_MANAGE, resolve: ['partner', 'manager'], add_flags: ['partner'], add_tags: ['partner', 'manager'], manage_collaborators: ['partner', 'manager'], set_deadline: ['partner'], delete_attachments: ['partner'], remove_checklists: ['partner'], archive: ['partner'] },
    actions: [
      action('add_collaborator'),
      action('add_flag'),
      { key: 'push_to_friday', label: 'Push to Friday', icon: 'Send', permission: 'edit', handler: 'pushToFriday' },
      action('compare'),
      { key: 'ml_consolidate', label: 'ML Consolidate Queries', icon: 'Sparkles', permission: 'edit', handler: 'mlConsolidateQueries' },
    ],
    triggers: { onCreate: 'onReviewCreate', onUpdate: 'onReviewUpdate' },
  },

  // === CLIENT ===
  client: {
    name: 'client', label: 'Client', labelPlural: 'Clients', icon: 'Building',
    fields: {
      id: FIELDS.id,
      name: FIELDS.name(),
      email: FIELDS.email(),
      address: { type: 'textarea', label: 'Address' },
      entity_type_id: { type: 'ref', ref: 'entity_type', label: 'Entity Type', list: true, display: 'entity_type.name' },
      entity_type: { type: 'enum', label: 'Entity Type (Legacy)', options: 'entity_types', hidden: true },
      status: FIELDS.status(),
      engagement_count: { type: 'int', label: 'Engagements', default: 0, readOnly: true },
      ...timestampFields(),
    },
    options: { statuses: STATUS.ACTIVE_INACTIVE, entity_types: ENTITY_TYPES },
    triggers: { onUpdate: 'onClientUpdate' },
    children: {
      engagements: { entity: 'engagement', fk: 'client_id', label: 'Engagements' },
      contacts: { entity: 'client_user', fk: 'client_id', label: 'Contacts' },
    },
    access: ACCESS.MANAGER_MANAGE,
  },

  // === RFI ===
  rfi: {
    name: 'rfi', label: 'RFI', labelPlural: 'RFIs', icon: 'FileQuestion', parent: 'engagement',
    fields: {
      id: FIELDS.id,
      engagement_id: { type: 'ref', ref: 'engagement', required: true, hidden: true },
      section_id: { type: 'ref', ref: 'engagement_section', label: 'Section', display: 'engagement_section.name' },
      key: { type: 'text', label: 'Key' },
      name: { type: 'text', label: 'Name', list: true },
      question: { type: 'textarea', label: 'Question', required: true, list: true, search: true },
      status: { type: 'int', label: 'Status', list: true, default: 0 },
      rfi_status: { type: 'enum', label: 'RFI Status', options: 'rfi_statuses', list: true, default: 'pending' },
      client_status: { type: 'enum', label: 'Client Status', options: 'client_statuses', list: true, default: 'pending' },
      auditor_status: { type: 'enum', label: 'Auditor Status', options: 'auditor_statuses', list: true, default: 'requested' },
      date_requested: { type: 'timestamp', label: 'Date Requested', auto: 'now' },
      date_resolved: { type: 'timestamp', label: 'Date Resolved' },
      deadline: { type: 'date', label: 'Deadline', list: true },
      deadline_date: { type: 'timestamp', label: 'Deadline Date' },
      days_outstanding: { type: 'int', label: 'Days Outstanding', list: true, default: 0 },
      response_count: { type: 'int', label: 'Responses', default: 0 },
      files_count: { type: 'int', label: 'Files', default: 0 },
      responses: { type: 'json', label: 'Responses' },
      files: { type: 'json', label: 'Files' },
      flag: { type: 'bool', label: 'Flagged', list: true, default: false },
      ml_query: { type: 'bool', label: 'ML Query', default: false },
      assigned_users: { type: 'json', label: 'Assigned Users' },
      recreate_with_attachments: { type: 'bool', label: 'Copy on Recreation', default: false },
      highlight_id: { type: 'ref', ref: 'highlight', label: 'Linked Highlight' },
      sort_order: FIELDS.sort_order,
      ...auditFields(),
    },
    options: {
      rfi_statuses: RFI_STATUSES,
      client_statuses: WORKFLOW_STATUS.RFI_CLIENT,
      auditor_statuses: WORKFLOW_STATUS.AUDITOR,
    },
    children: {
      responses: { entity: 'rfi_response', fk: 'rfi_id', label: 'Responses' },
      ...withStandardChildren('rfi', {}),
    },
    list: { groupBy: 'section_id', expandable: true },
    access: { ...ACCESS.WITH_CLIENT, create: ['partner', 'manager'], edit: ['partner', 'manager'], respond: ['partner', 'manager', 'clerk', 'client'], change_status: ['partner', 'manager'] },
    actions: [
      action('send_reminder', 'sendRfiReminder'),
      action('flag', 'toggleRfiFlag'),
      action('bulk_deadline'),
    ],
    triggers: { onUpdate: 'onRfiUpdate' },
    validation: { statusChangeRequires: 'files_or_responses', statusChangeRoles: ['partner', 'manager'] },
  },

  // === HIGHLIGHT ===
  highlight: {
    name: 'highlight', label: 'Query', labelPlural: 'Queries', icon: 'MessageSquare', parent: 'review',
    fields: {
      id: FIELDS.id,
      review_id: { type: 'ref', ref: 'review', required: true, hidden: true },
      page_number: { type: 'int', label: 'Page', required: true, list: true },
      position: { type: 'json', label: 'Position', required: true, hidden: true },
      content: { type: 'text', label: 'Selected Text' },
      image: { type: 'text', label: 'Selection Image', hidden: true },
      comment: { type: 'textarea', label: 'Comment', list: true, search: true },
      emoji: { type: 'text', label: 'Emoji' },
      type: { type: 'enum', label: 'Type', options: 'types', default: 'text' },
      ...resolutionFields(),
      ...partialResolutionFields(),
      is_general: { type: 'bool', label: 'General Comment', default: false },
      rfi_id: { type: 'ref', ref: 'rfi', label: 'Linked RFI' },
      color: { type: 'text', label: 'Color', default: HIGHLIGHT_COLORS.default },
      is_partner: { type: 'bool', label: 'Partner Highlight', default: false },
      responses: { type: 'json', label: 'Responses' },
      email: { type: 'email', label: 'Creator Email' },
      created_by: { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
      ...timestampFields(),
    },
    options: { types: HIGHLIGHT_TYPES },
    children: {
      responses: { entity: 'highlight_response', fk: 'highlight_id', label: 'Responses' },
      attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'highlight' }, label: 'Attachments' },
    },
    softDelete: { archive: true, archiveEntity: 'removed_highlight' },
    access: { ...ACCESS.MANAGER_MANAGE, resolve: ['partner', 'manager'], partial_resolve: ['partner', 'manager'] },
    actions: [
      action('resolve', 'resolveHighlight'),
      action('partial_resolve', 'partialResolveHighlight'),
      action('push_to_rfi', 'pushHighlightToRfi'),
      action('scroll_to', 'scrollToHighlight'),
    ],
    triggers: { beforeDelete: 'onHighlightDelete' },
    displayColors: HIGHLIGHT_COLORS,
  },

  // === HIGHLIGHT RESPONSE ===
  highlight_response: {
    name: 'highlight_response', label: 'Response', labelPlural: 'Responses', icon: 'MessageCircle', embedded: true,
    fields: {
      id: FIELDS.id,
      highlight_id: { type: 'ref', ref: 'highlight', required: true },
      content: { type: 'textarea', label: 'Response', required: true, list: true },
      attachments: FIELDS.attachments,
      created_by: { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
      created_at: FIELDS.created_at,
    },
    access: ACCESS.MANAGER_MANAGE,
  },

  // === USER ===
  user: {
    name: 'user', label: 'User', labelPlural: 'Users', icon: 'User',
    fields: {
      id: FIELDS.id,
      email: { ...FIELDS.email(), required: true, unique: true, sortable: true },
      name: FIELDS.name(),
      avatar: { type: 'image', label: 'Avatar', list: true },
      password_hash: { type: 'text', hidden: true },
      type: { type: 'enum', label: 'Type', options: 'types', list: true, default: 'auditor' },
      role: { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'clerk' },
      status: FIELDS.status(),
      auth_provider: { type: 'enum', label: 'Auth Provider', options: 'auth_providers', default: 'google' },
      uid: { type: 'text', label: 'Auth UID', hidden: true },
      cv_url: { type: 'text', label: 'CV URL' },
      phone: { type: 'text', label: 'Phone' },
      priority_reviews: { type: 'json', label: 'Priority Reviews' },
      clients: { type: 'json', label: 'Client Access' },
      last_read_messages: { type: 'json', label: 'Last Read' },
      last_login: { type: 'timestamp', label: 'Last Login' },
      ...timestampFields(),
    },
    options: { types: USER_TYPES, roles: USER_ROLES, statuses: STATUS.ACTIVE_INACTIVE, auth_providers: AUTH_PROVIDERS },
    children: { teams: { entity: 'team_member', fk: 'user_id', label: 'Teams' } },
    access: ACCESS.PARTNER_ONLY,
  },

  // === TEAM ===
  team: {
    name: 'team', label: 'Team', labelPlural: 'Teams', icon: 'Users',
    fields: {
      id: FIELDS.id,
      name: FIELDS.name(),
      partners: { type: 'json', label: 'Partners' },
      users: { type: 'json', label: 'Users' },
      status: FIELDS.status(),
      created_at: FIELDS.created_at,
    },
    options: { statuses: STATUS.ACTIVE_INACTIVE },
    computed: { member_count: { sql: '(SELECT COUNT(*) FROM team_members WHERE team_id = teams.id)' } },
    children: {
      members: { entity: 'team_member', fk: 'team_id', label: 'Members' },
      engagements: { entity: 'engagement', fk: 'team_id', label: 'Engagements' },
      reviews: { entity: 'review', fk: 'team_id', label: 'Reviews' },
    },
    access: ACCESS.PARTNER_MANAGE,
    triggers: { onUpdate: 'onTeamUpdate' },
  },

  // === TEAM MEMBER ===
  team_member: {
    name: 'team_member', label: 'Team Member', labelPlural: 'Team Members', icon: 'UserPlus', embedded: true,
    fields: {
      id: FIELDS.id,
      team_id: { type: 'ref', ref: 'team', required: true },
      user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      role: { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'member' },
    },
    options: { roles: TEAM_MEMBER_ROLES },
    access: ACCESS.PARTNER_MANAGE,
  },

  // === CLIENT USER ===
  client_user: {
    name: 'client_user', label: 'Contact', labelPlural: 'Contacts', icon: 'UserCircle', embedded: true,
    fields: {
      id: FIELDS.id,
      client_id: { type: 'ref', ref: 'client', required: true },
      user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      role: { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'user' },
      is_primary: { type: 'bool', label: 'Primary Contact', default: false },
      status: FIELDS.status(),
      created_at: FIELDS.created_at,
    },
    options: { roles: CLIENT_USER_ROLES, statuses: STATUS.ACTIVE_INACTIVE },
    access: ACCESS.MANAGER_MANAGE,
  },

  // === FILE ===
  file: {
    name: 'file', label: 'File', labelPlural: 'Files', icon: 'File', embedded: true,
    fields: {
      id: FIELDS.id,
      entity_type: FIELDS.entity_type,
      entity_id: FIELDS.entity_id,
      drive_file_id: { type: 'text', required: true },
      file_name: { type: 'text', label: 'Name', list: true },
      file_type: { type: 'text', label: 'Type', list: true },
      file_size: { type: 'int', label: 'Size' },
      mime_type: { type: 'text', label: 'MIME Type' },
      download_url: { type: 'text', label: 'Download URL' },
      uploaded_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: FIELDS.created_at,
    },
    access: ACCESS.WITH_CLIENT,
  },

  // === CHAT MESSAGE ===
  chat_message: {
    name: 'chat_message', label: 'Message', labelPlural: 'Messages', icon: 'MessageSquare', embedded: true,
    fields: {
      id: FIELDS.id,
      entity_type: FIELDS.entity_type,
      entity_id: FIELDS.entity_id,
      content: { type: 'textarea', label: 'Message', required: true },
      attachments: FIELDS.attachments,
      is_team_only: { type: 'bool', label: 'Team Only', default: false },
      reply_to: { type: 'ref', ref: 'chat_message', label: 'Reply To' },
      source: { type: 'enum', label: 'Source', options: 'sources', default: 'local' },
      is_friday_message: { type: 'bool', label: 'From Friday', default: false },
      is_review_message: { type: 'bool', label: 'From Review', default: false },
      created_by: { type: 'ref', ref: 'user', auto: 'user', display: 'user.name' },
      created_at: FIELDS.created_at,
    },
    options: { sources: MESSAGE_SOURCES },
    access: ACCESS.WITH_CLIENT,
  },

  // === TEMPLATE ===
  template: {
    name: 'template', label: 'Template', labelPlural: 'Templates', icon: 'FileCode',
    fields: {
      id: FIELDS.id,
      name: { ...FIELDS.name(), search: true },
      type: { type: 'enum', label: 'Type', options: 'types', list: true, default: 'standard' },
      template_type: { type: 'enum', label: 'Template Type', options: 'template_types', default: 'review' },
      description: { type: 'textarea', label: 'Description' },
      sections: { type: 'json', label: 'Sections' },
      default_checklists: { type: 'json', label: 'Default Checklists' },
      status: FIELDS.status(),
      created_at: FIELDS.created_at,
    },
    options: { types: TEMPLATE_TYPES, template_types: TEMPLATE_TARGET_TYPES, statuses: STATUS.ACTIVE_INACTIVE },
    access: ACCESS.READ_ONLY,
  },

  // === CHECKLIST ===
  checklist: {
    name: 'checklist', label: 'Checklist', labelPlural: 'Checklists', icon: 'ListChecks',
    fields: {
      id: FIELDS.id,
      name: { ...FIELDS.name(), search: true },
      section_items: { type: 'json', label: 'Items' },
      items: { type: 'json', label: 'Items (Legacy)' },
      status: FIELDS.status(),
      created_at: FIELDS.created_at,
    },
    options: { statuses: STATUS.ACTIVE_INACTIVE },
    access: ACCESS.READ_ONLY,
  },

  // === REVIEW CHECKLIST ===
  review_checklist: {
    name: 'review_checklist', label: 'Review Checklist', labelPlural: 'Review Checklists', icon: 'ClipboardCheck', embedded: true,
    fields: {
      id: FIELDS.id,
      review_id: { type: 'ref', ref: 'review', required: true },
      checklist_id: { type: 'ref', ref: 'checklist', required: true, list: true, display: 'checklist.name' },
      items: { type: 'json', label: 'Items' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'pending' },
      completed_by: { type: 'ref', ref: 'user' },
      completed_at: { type: 'timestamp' },
      added_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: FIELDS.created_at,
    },
    options: { statuses: STATUS.PROGRESS },
    access: ACCESS.MANAGER_MANAGE,
  },

  // === ENGAGEMENT SECTION ===
  engagement_section: {
    name: 'engagement_section', label: 'Section', labelPlural: 'Sections', icon: 'FolderOpen', embedded: true,
    fields: {
      id: FIELDS.id,
      engagement_id: { type: 'ref', ref: 'engagement', required: true },
      name: { type: 'text', label: 'Name', required: true, list: true },
      key: { type: 'text', label: 'Key' },
      sort_order: FIELDS.sort_order,
      created_at: FIELDS.created_at,
    },
    access: ACCESS.MANAGER_MANAGE,
  },

  // === ACTIVITY LOG ===
  activity_log: {
    name: 'activity_log', label: 'Activity', labelPlural: 'Activity', icon: 'Activity', embedded: true,
    fields: {
      id: FIELDS.id,
      entity_type: FIELDS.entity_type,
      entity_id: FIELDS.entity_id,
      action: { type: 'enum', label: 'Action', options: 'actions', required: true },
      message: { type: 'text', label: 'Message', required: true, list: true },
      details: { type: 'json', label: 'Details' },
      user_email: { type: 'email', label: 'User Email', list: true },
      created_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: FIELDS.created_at,
    },
    options: { actions: ACTIVITY_ACTIONS },
    list: { defaultSort: { field: 'created_at', dir: 'desc' } },
    access: { ...ACCESS.MANAGER_MANAGE, create: ['partner', 'manager', 'clerk'] },
  },

  // === COLLABORATOR ===
  collaborator: {
    name: 'collaborator', label: 'Collaborator', labelPlural: 'Collaborators', icon: 'UserPlus', embedded: true, parent: 'review',
    fields: {
      id: FIELDS.id,
      review_id: { type: 'ref', ref: 'review', required: true, hidden: true },
      user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      type: { type: 'enum', label: 'Type', options: 'types', list: true, default: 'permanent' },
      expires_at: { type: 'timestamp', label: 'Expires At', list: true },
      added_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: FIELDS.created_at,
    },
    options: { types: COLLABORATOR_TYPES },
    access: { ...ACCESS.READ_ONLY, create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner', 'manager'] },
    triggers: { onCreate: 'onCollaboratorCreate' },
  },

  // === USER GROUP ===
  user_group: {
    name: 'user_group', label: 'User Group', labelPlural: 'User Groups', icon: 'Shield',
    fields: {
      id: FIELDS.id,
      name: { ...FIELDS.name(), unique: true },
      description: { type: 'textarea', label: 'Description' },
      roles: { type: 'json', label: 'Permissions' },
      status: FIELDS.status(),
      created_at: FIELDS.created_at,
    },
    options: { statuses: STATUS.ACTIVE_INACTIVE },
    access: ACCESS.PARTNER_ONLY,
  },

  // === SETTINGS ===
  settings: {
    name: 'settings', label: 'Settings', labelPlural: 'Settings', icon: 'Settings', singleton: true,
    fields: {
      id: FIELDS.id,
      key: { type: 'text', label: 'Key', required: true, unique: true },
      value: { type: 'json', label: 'Value' },
      version: { type: 'text', label: 'Version' },
      keys: { type: 'json', label: 'API Keys', hidden: true },
      temporary_review_access_period: { type: 'int', label: 'Temp Access Days', default: 7 },
      flags_managers: { type: 'json', label: 'Manager Flags' },
      tender_flags: { type: 'json', label: 'Tender Flags' },
      notification_triggers: { type: 'json', label: 'Notification Triggers' },
      updated_at: FIELDS.updated_at,
    },
    access: { list: ['partner'], view: ['partner'], edit: ['partner'] },
  },

  // === RECREATION LOG ===
  recreation_log: {
    name: 'recreation_log', label: 'Recreation Log', labelPlural: 'Recreation Logs', icon: 'RefreshCw', embedded: true,
    fields: {
      id: FIELDS.id,
      engagement_id: { type: 'ref', ref: 'engagement', required: true },
      client_id: { type: 'ref', ref: 'client' },
      engagement_type_id: { type: 'text' },
      status: { type: 'enum', label: 'Status', options: 'statuses', default: 'pending' },
      details: { type: 'json', label: 'Details' },
      error: { type: 'text', label: 'Error' },
      created_at: FIELDS.created_at,
    },
    options: { statuses: STATUS.RECREATION },
    list: { defaultSort: { field: 'created_at', dir: 'desc' } },
    access: ACCESS.READ_ONLY,
  },

  // === EMAIL ===
  email: {
    name: 'email', label: 'Email', labelPlural: 'Emails', icon: 'Mail',
    fields: {
      id: FIELDS.id,
      subject: { type: 'text', label: 'Subject', list: true, search: true },
      from_address: { type: 'email', label: 'From', list: true },
      from_name: { type: 'text', label: 'From Name' },
      to_address: { type: 'email', label: 'To' },
      cc: { type: 'text', label: 'CC' },
      bcc: { type: 'text', label: 'BCC' },
      body: { type: 'textarea', label: 'Body' },
      html_body: { type: 'textarea', label: 'HTML Body' },
      attachment_urls: { type: 'json', label: 'Attachments' },
      allocated: { type: 'bool', label: 'Allocated', list: true, default: false },
      allocated_to_client: { type: 'ref', ref: 'client', label: 'Client', display: 'client.name' },
      allocated_to_engagement: { type: 'ref', ref: 'engagement', label: 'Engagement' },
      allocated_to_rfi: { type: 'ref', ref: 'rfi', label: 'RFI' },
      allocated_by: { type: 'ref', ref: 'user' },
      allocated_at: { type: 'timestamp' },
      email_date: { type: 'timestamp', label: 'Email Date' },
      received_at: { type: 'timestamp', label: 'Received At', auto: 'now' },
      created_at: FIELDS.created_at,
    },
    list: { defaultSort: { field: 'created_at', dir: 'desc' }, filters: ['allocated'] },
    access: { ...ACCESS.READ_ONLY, edit: ['partner', 'manager'], delete: ['partner'] },
  },

  // === NOTIFICATION ===
  notification: {
    name: 'notification', label: 'Notification', labelPlural: 'Notifications', icon: 'Bell', embedded: true,
    fields: {
      id: FIELDS.id,
      type: { type: 'enum', label: 'Type', options: 'types', list: true },
      recipient_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      recipient_email: { type: 'email', label: 'Email' },
      subject: { type: 'text', label: 'Subject', list: true },
      content: { type: 'textarea', label: 'Content' },
      entity_type: { type: 'text', label: 'Entity Type' },
      entity_id: { type: 'text', label: 'Entity ID' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'pending' },
      sent_at: { type: 'timestamp', label: 'Sent At' },
      error: { type: 'text', label: 'Error' },
      retry_count: { type: 'int', label: 'Retry Count', default: 0 },
      created_at: FIELDS.created_at,
    },
    options: { types: NOTIFICATION_TYPES, statuses: STATUS.NOTIFICATION },
    list: { defaultSort: { field: 'created_at', dir: 'desc' } },
    access: ACCESS.PARTNER_ONLY,
  },

  // === FLAG ===
  flag: {
    name: 'flag', label: 'Flag', labelPlural: 'Flags', icon: 'Flag',
    fields: {
      id: FIELDS.id,
      name: { ...FIELDS.name(), search: true },
      color: { type: 'text', label: 'Color', list: true, default: '#ff4141' },
      type: { type: 'enum', label: 'Type', options: 'types', list: true },
      status: FIELDS.status(),
      created_at: FIELDS.created_at,
    },
    options: { types: FLAG_TYPES, statuses: STATUS.ACTIVE_INACTIVE },
    access: ACCESS.PARTNER_MANAGE,
  },

  // === TAG ===
  tag: {
    name: 'tag', label: 'Tag', labelPlural: 'Tags', icon: 'Tag',
    fields: {
      id: FIELDS.id,
      name: { ...FIELDS.name(), search: true },
      color: { type: 'text', label: 'Color', list: true, default: '#3b82f6' },
      status: FIELDS.status(),
      created_at: FIELDS.created_at,
    },
    options: { statuses: STATUS.ACTIVE_INACTIVE },
    access: { ...ACCESS.READ_ONLY, create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'] },
  },

  // === RFI RESPONSE ===
  rfi_response: {
    name: 'rfi_response', label: 'Response', labelPlural: 'Responses', icon: 'MessageCircle', embedded: true, parent: 'rfi',
    fields: {
      id: FIELDS.id,
      rfi_id: { type: 'ref', ref: 'rfi', required: true, hidden: true },
      content: { type: 'textarea', label: 'Response', required: true, list: true },
      attachments: FIELDS.attachments,
      is_client: { type: 'bool', label: 'From Client', default: false },
      created_by: { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
      created_at: FIELDS.created_at,
    },
    access: ACCESS.WITH_CLIENT,
  },

  // === REMOVED HIGHLIGHT ===
  removed_highlight: {
    name: 'removed_highlight', label: 'Removed Highlight', labelPlural: 'Removed Highlights', icon: 'Archive', embedded: true,
    fields: {
      id: FIELDS.id,
      review_id: { type: 'ref', ref: 'review', required: true },
      original_id: { type: 'text', required: true },
      highlight_data: { type: 'json', label: 'Highlight Data', required: true },
      removed_by: { type: 'ref', ref: 'user', auto: 'user' },
      removed_at: { type: 'timestamp', auto: 'now' },
    },
    access: ACCESS.PARTNER_ONLY,
  },

  // === SYSTEM LOG ===
  system_log: {
    name: 'system_log', label: 'System Log', labelPlural: 'System Logs', icon: 'FileText', embedded: true,
    fields: {
      id: FIELDS.id,
      level: { type: 'enum', label: 'Level', options: 'levels', default: 'info' },
      message: { type: 'text', label: 'Message', required: true, list: true },
      review: { type: 'text', label: 'Review' },
      email: { type: 'email', label: 'Email' },
      details: { type: 'json', label: 'Details' },
      stack: { type: 'textarea', label: 'Stack Trace' },
      log_time: { type: 'timestamp', auto: 'now', list: true },
    },
    options: { levels: LOG_LEVELS },
    list: { defaultSort: { field: 'log_time', dir: 'desc' } },
    access: ACCESS.PARTNER_ONLY,
  },

  // === ENTITY TYPE ===
  entity_type: configSpec('entity_type', 'Entity Type', 'Building2', {}, {
    labelPlural: 'Entity Types',
    seedData: SEED_DATA.entity_types,
  }),

  // === ENGAGEMENT TYPE CONFIG ===
  engagement_type_config: configSpec('engagement_type_config', 'Engagement Type', 'Briefcase', {
    key: { type: 'text', label: 'Key', required: true, unique: true },
    default_template_id: { type: 'ref', ref: 'template', label: 'Default Template' },
    default_fee: { type: 'decimal', label: 'Default Fee' },
    requires_letter: { type: 'bool', label: 'Requires Engagement Letter', default: true },
  }, {
    labelPlural: 'Engagement Types',
    seedData: SEED_DATA.engagement_types,
  }),

  // === USER PERMISSION ===
  user_permission: {
    name: 'user_permission', label: 'Permission', labelPlural: 'Permissions', icon: 'Key', embedded: true,
    fields: {
      id: FIELDS.id,
      name: { ...FIELDS.name(), unique: true },
      key: { type: 'text', label: 'Key', required: true, unique: true },
      description: { type: 'textarea', label: 'Description' },
      roles: { type: 'json', label: 'Role Access' },
      created_at: FIELDS.created_at,
    },
    seedData: SEED_DATA.permissions,
    access: ACCESS.PARTNER_ONLY,
  },

  // === CLIENT SENT NOTIFICATION ===
  client_sent_notification: {
    name: 'client_sent_notification', label: 'Client Notification', labelPlural: 'Client Notifications', icon: 'BellRing', embedded: true,
    fields: {
      id: FIELDS.id,
      client_id: { type: 'ref', ref: 'client', required: true },
      engagement_id: { type: 'ref', ref: 'engagement' },
      rfi_id: { type: 'ref', ref: 'rfi' },
      type: { type: 'enum', label: 'Type', options: 'types', list: true },
      message: { type: 'text', label: 'Message', list: true },
      details: { type: 'json', label: 'Details' },
      consolidated: { type: 'bool', label: 'Consolidated', default: false },
      created_at: FIELDS.created_at,
    },
    options: { types: CLIENT_NOTIFICATION_TYPES },
    access: ACCESS.READ_ONLY,
  },
};

// ========================================
// HELPER FUNCTIONS (Field utils in lib/field-types.js)
// ========================================

export function getSpec(name) {
  const spec = specs[name];
  if (!spec) throw new Error(`Unknown entity: ${name}`);
  return spec;
}

export function getNavItems() {
  return Object.values(specs)
    .filter(s => !s.embedded && !s.parent && !s.singleton)
    .map(s => ({ name: s.name, label: s.labelPlural, icon: s.icon, href: `/${s.name}` }));
}

export function getAllSpecs() {
  return Object.values(specs);
}
