// All entity specifications - Full replacement for My Friday + My Work Review
export const specs = {
  // === ENGAGEMENT (My Friday) ===
  engagement: {
    name: 'engagement', label: 'Engagement', labelPlural: 'Engagements', icon: 'Briefcase',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      client_id: { type: 'ref', label: 'Client', ref: 'client', required: true, list: true, sortable: true, display: 'client.name' },
      year: { type: 'int', label: 'Year', required: true, list: true, sortable: true, width: 80 },
      month: { type: 'int', label: 'Month' },
      stage: { type: 'enum', label: 'Stage', options: 'stages', list: true, default: 'info_gathering' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'pending' },
      team_id: { type: 'ref', label: 'Team', ref: 'team', list: true, display: 'avatars' },
      template_id: { type: 'ref', label: 'Template', ref: 'template' },
      engagement_type: { type: 'enum', label: 'Type', options: 'engagement_types', list: true },
      // Dates
      commencement_date: { type: 'date', label: 'Commencement Date' },
      completion_date: { type: 'date', label: 'Completion Date' },
      deadline: { type: 'date', label: 'Deadline', list: true },
      // Multi-dimensional status tracking (from Friday)
      client_status: { type: 'enum', label: 'Client Status', options: 'client_statuses', default: 'pending' },
      auditor_status: { type: 'enum', label: 'Auditor Status', options: 'auditor_statuses', default: 'requested' },
      // Engagement letter workflow
      letter_client_status: { type: 'enum', label: 'Letter (Client)', options: 'letter_client_statuses', default: 'pending' },
      letter_auditor_status: { type: 'enum', label: 'Letter (Auditor)', options: 'letter_auditor_statuses', default: 'pending' },
      letter_drive_id: { type: 'text', label: 'Letter File', hidden: true },
      // Post-RFI workflow
      post_rfi_client_status: { type: 'enum', label: 'Post-RFI (Client)', options: 'post_rfi_client_statuses', default: 'pending' },
      post_rfi_auditor_status: { type: 'enum', label: 'Post-RFI (Auditor)', options: 'post_rfi_auditor_statuses', default: 'pending' },
      post_rfi_drive_id: { type: 'text', hidden: true },
      post_rfi_journal: { type: 'json', label: 'Post-RFI Journal' },
      // Progress tracking
      progress: { type: 'int', label: 'Progress', list: true, default: 0 },
      client_progress: { type: 'int', label: 'Client Progress', default: 0 },
      // Financial
      fee: { type: 'decimal', label: 'Fee' },
      wip_value: { type: 'decimal', label: 'WIP Value' },
      // Recreation settings (from Friday)
      repeat_interval: { type: 'enum', label: 'Repeat', options: 'repeat_intervals', default: 'once' },
      recreate_with_attachments: { type: 'bool', label: 'Copy Attachments on Recreation', default: false },
      // Links
      review_id: { type: 'ref', label: 'Linked Review', ref: 'review' },
      previous_year_review_id: { type: 'ref', label: 'Previous Year Review', ref: 'review' },
      rfis_linked: { type: 'json', label: 'Linked RFIs' },
      // Settings
      clerks_can_approve: { type: 'bool', label: 'Clerks Can Approve', default: false },
      is_private: { type: 'bool', label: 'Private', default: false },
      // Assignments
      users: { type: 'json', label: 'Assigned Users' },
      client_users: { type: 'json', label: 'Client Users' },
      // Client feedback
      feedback_rating: { type: 'int', label: 'Client Rating' },
      feedback_comment: { type: 'textarea', label: 'Client Feedback' },
      feedback_date: { type: 'timestamp', label: 'Feedback Date' },
      // Metadata
      created_by: { type: 'ref', label: 'Created By', ref: 'user', auto: 'user', readOnly: true },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
      updated_at: { type: 'timestamp', auto: 'update', readOnly: true },
    },
    options: {
      statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'completed', label: 'Completed', color: 'blue' },
        { value: 'archived', label: 'Archived', color: 'gray' },
      ],
      stages: [
        { value: 'info_gathering', label: 'Info Gathering' },
        { value: 'commencement', label: 'Commencement' },
        { value: 'team_execution', label: 'Team Execution' },
        { value: 'partner_review', label: 'Partner Review' },
        { value: 'finalization', label: 'Finalization' },
        { value: 'close_out', label: 'Close Out' },
      ],
      client_statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'partially_sent', label: 'Partially Sent', color: 'amber' },
        { value: 'sent', label: 'Sent', color: 'green' },
      ],
      auditor_statuses: [
        { value: 'requested', label: 'Requested', color: 'yellow' },
        { value: 'reviewing', label: 'Reviewing', color: 'blue' },
        { value: 'queries', label: 'Queries', color: 'amber' },
        { value: 'received', label: 'Received', color: 'green' },
      ],
      letter_client_statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'sent', label: 'Sent', color: 'green' },
      ],
      letter_auditor_statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'queries', label: 'Queries', color: 'amber' },
        { value: 'accepted', label: 'Accepted', color: 'green' },
      ],
      post_rfi_client_statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'queries', label: 'Queries', color: 'amber' },
        { value: 'accepted', label: 'Accepted', color: 'green' },
      ],
      post_rfi_auditor_statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'sent', label: 'Sent', color: 'green' },
      ],
      engagement_types: [
        { value: 'audit', label: 'Audit' },
        { value: 'review', label: 'Review' },
        { value: 'compilation', label: 'Compilation' },
        { value: 'agreed_upon', label: 'Agreed Upon Procedures' },
      ],
      repeat_intervals: [
        { value: 'once', label: 'Once' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
      ],
    },
    // Computed fields
    computed: {
      rfi_count: { sql: '(SELECT COUNT(*) FROM rfis WHERE engagement_id = engagements.id)' },
      completed_rfi_count: { sql: "(SELECT COUNT(*) FROM rfis WHERE engagement_id = engagements.id AND client_status = 'completed')" },
    },
    children: {
      sections: { entity: 'engagement_section', fk: 'engagement_id', label: 'Sections' },
      rfis: { entity: 'rfi', fk: 'engagement_id', label: 'RFIs' },
      files: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Files' },
      activity: { entity: 'activity_log', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Activity' },
      chat: { entity: 'chat_message', fk: 'entity_id', filter: { entity_type: 'engagement' }, label: 'Chat', component: 'chat' },
    },
    access: {
      list: ['partner', 'manager', 'clerk', 'client'],
      view: ['partner', 'manager', 'clerk', 'client'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      delete: ['partner'],
      change_stage: ['partner', 'manager'],
      close: ['partner'],
    },
    // Custom actions (beyond CRUD)
    actions: [
      { key: 'send_letter', label: 'Send Letter', icon: 'Mail', permission: 'edit', handler: 'sendEngagementLetter' },
      { key: 'link_review', label: 'Link Review', icon: 'Link', permission: 'edit', dialog: 'linkReview' },
      { key: 'recreate', label: 'Recreate', icon: 'RefreshCw', permission: 'edit', handler: 'recreateEngagement' },
      { key: 'generate_letter', label: 'Generate Letter', icon: 'FileText', permission: 'edit', handler: 'generateEngagementLetter' },
    ],
    // Stage transition rules (workflow automation)
    workflow: {
      stage_transitions: {
        info_gathering: {
          next: 'commencement',
          auto_transition: 'commencement_date',
          allowed_roles: ['partner', 'manager'],
        },
        commencement: {
          next: 'team_execution',
          prev: null,
          allowed_roles: ['partner', 'manager'],
        },
        team_execution: {
          next: 'partner_review',
          prev: 'commencement',
          allowed_roles: ['partner', 'manager'],
        },
        partner_review: {
          next: 'finalization',
          prev: 'team_execution',
          allowed_roles: ['partner', 'manager'],
        },
        finalization: {
          next: 'close_out',
          prev: 'partner_review',
          allowed_roles: ['partner', 'manager'],
        },
        close_out: {
          prev: null,
          requires: ['letter_auditor_status=accepted'],
          allowed_roles: ['partner'],
        },
      },
    },
    form: {
      sections: [
        { label: 'Basic Info', fields: ['name', 'client_id', 'engagement_type', 'year', 'month'] },
        { label: 'Dates', fields: ['commencement_date', 'completion_date', 'deadline'] },
        { label: 'Team', fields: ['team_id', 'template_id'] },
        { label: 'Settings', fields: ['repeat_interval', 'recreate_with_attachments', 'clerks_can_approve', 'is_private'] },
        { label: 'Financial', fields: ['fee', 'wip_value'] },
      ],
    },
    list: { defaultSort: { field: 'created_at', dir: 'desc' }, filters: ['status', 'stage', 'year', 'team_id', 'engagement_type'] },
  },

  // === REVIEW (My Work Review) ===
  review: {
    name: 'review', label: 'Review', labelPlural: 'Reviews', icon: 'FileSearch',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      group_name: { type: 'text', label: 'Group Name', list: true },
      team_id: { type: 'ref', label: 'Team', ref: 'team', required: true, list: true, display: 'team.name' },
      template_id: { type: 'ref', label: 'Template', ref: 'template' },
      financial_year: { type: 'text', label: 'Financial Year', list: true },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'open' },
      stage: { type: 'int', label: 'Stage', list: true, default: 1 },
      // Privacy & Access
      is_private: { type: 'bool', label: 'Private', default: false },
      // Financial
      wip_value: { type: 'decimal', label: 'WIP Value' },
      // Dates
      deadline: { type: 'date', label: 'Deadline', list: true },
      published_date: { type: 'timestamp', label: 'Published Date' },
      closed_date: { type: 'timestamp', label: 'Closed Date' },
      // PDF file
      drive_file_id: { type: 'text', hidden: true },
      drive_folder_id: { type: 'text', hidden: true },
      file_url: { type: 'text', label: 'File URL', hidden: true },
      attachment_folder_url: { type: 'text', hidden: true },
      // PDF caching
      cached_pdf_url: { type: 'text', hidden: true },
      cached_pdf_expires: { type: 'timestamp', hidden: true },
      // Highlights stored in review (MWR style - also as separate entity)
      highlights: { type: 'json', label: 'Highlights' },
      // Flags and tags (references to flag/tag entities)
      flags: { type: 'json', label: 'Flags' },
      tags: { type: 'json', label: 'Tags' },
      tender_flags: { type: 'json', label: 'Tender Flags' },
      // Collaborators
      collaborators: { type: 'json', label: 'Collaborators' },
      collaborator_ids: { type: 'json', label: 'Collaborator IDs' },
      // Checklist sections (copied from template)
      sections: { type: 'json', label: 'Checklist Sections' },
      // Publishing state
      published: { type: 'bool', label: 'Published', default: false },
      // Tender workflow (from MWR)
      is_tender: { type: 'bool', label: 'Tender', default: false },
      tender_details: { type: 'json', label: 'Tender Details' },
      // ML / Email checklist
      has_email_checklist: { type: 'bool', label: 'Has Email Checklist', default: false },
      // Friday integration (linked engagement)
      friday_link: { type: 'text', label: 'Friday Engagement ID', hidden: true },
      // First manager (for notifications)
      first_manager_id: { type: 'ref', ref: 'user', label: 'First Manager' },
      // Audit
      email: { type: 'email', label: 'Email' },
      created_by: { type: 'ref', ref: 'user', auto: 'user', readOnly: true },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
      updated_at: { type: 'timestamp', auto: 'update', readOnly: true },
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
      collaborator_count: { sql: '(SELECT COUNT(*) FROM collaborators WHERE review_id = reviews.id)' },
    },
    children: {
      highlights: { entity: 'highlight', fk: 'review_id', label: 'Queries' },
      checklists: { entity: 'review_checklist', fk: 'review_id', label: 'Checklists' },
      collaborators: { entity: 'collaborator', fk: 'review_id', label: 'Collaborators' },
      attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'review' }, label: 'Files' },
      activity: { entity: 'activity_log', fk: 'entity_id', filter: { entity_type: 'review' }, label: 'Activity' },
      chat: { entity: 'chat_message', fk: 'entity_id', filter: { entity_type: 'review' }, label: 'Chat', component: 'chat' },
    },
    // Custom detail view (for PDF viewer)
    detail: { component: 'review-detail' },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      delete: ['partner'],
      resolve: ['partner', 'manager'],
      add_flags: ['partner'],
      add_tags: ['partner', 'manager'],
      manage_collaborators: ['partner', 'manager'],
      set_deadline: ['partner'],
      delete_attachments: ['partner'],
      remove_checklists: ['partner'],
      archive: ['partner'],
    },
    // Custom actions
    actions: [
      { key: 'add_collaborator', label: 'Add Collaborator', icon: 'UserPlus', permission: 'manage_collaborators', dialog: 'addCollaborator' },
      { key: 'add_flag', label: 'Add Flag', icon: 'Flag', permission: 'add_flags', dialog: 'addFlag' },
      { key: 'push_to_friday', label: 'Push to Friday', icon: 'Send', permission: 'edit', handler: 'pushToFriday' },
      { key: 'compare', label: 'Compare PDFs', icon: 'Columns', permission: 'view', dialog: 'comparePdfs' },
      { key: 'ml_consolidate', label: 'ML Consolidate Queries', icon: 'Sparkles', permission: 'edit', handler: 'mlConsolidateQueries' },
    ],
  },

  // === CLIENT ===
  client: {
    name: 'client', label: 'Client', labelPlural: 'Clients', icon: 'Building',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      email: { type: 'email', label: 'Email', list: true, search: true },
      address: { type: 'textarea', label: 'Address' },
      entity_type: { type: 'enum', label: 'Entity Type', options: 'entity_types' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      // Counts
      engagement_count: { type: 'int', label: 'Engagements', default: 0, readOnly: true },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
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
  },

  // === RFI (Request for Information) ===
  rfi: {
    name: 'rfi', label: 'RFI', labelPlural: 'RFIs', icon: 'FileQuestion', parent: 'engagement',
    fields: {
      id: { type: 'id' },
      engagement_id: { type: 'ref', ref: 'engagement', required: true, hidden: true },
      section_id: { type: 'ref', ref: 'engagement_section', label: 'Section', display: 'engagement_section.name' },
      key: { type: 'text', label: 'Key' },
      name: { type: 'text', label: 'Name', list: true },
      question: { type: 'textarea', label: 'Question', required: true, list: true, search: true },
      // Status tracking (multi-dimensional from Friday)
      status: { type: 'int', label: 'Status', list: true, default: 0 },
      rfi_status: { type: 'enum', label: 'RFI Status', options: 'rfi_statuses', list: true, default: 'pending' },
      client_status: { type: 'enum', label: 'Client Status', options: 'client_statuses', list: true, default: 'pending' },
      auditor_status: { type: 'enum', label: 'Auditor Status', options: 'auditor_statuses', list: true, default: 'requested' },
      // Dates & Deadlines (using timestamp for auto-set fields)
      date_requested: { type: 'timestamp', label: 'Date Requested', auto: 'now' },
      date_resolved: { type: 'timestamp', label: 'Date Resolved' },
      deadline: { type: 'date', label: 'Deadline', list: true },
      deadline_date: { type: 'timestamp', label: 'Deadline Date' },
      // Computed days outstanding (calculated: working days from date_requested to date_resolved or now)
      days_outstanding: { type: 'int', label: 'Days Outstanding', list: true, default: 0 },
      // Responses & Files counts
      response_count: { type: 'int', label: 'Responses', default: 0 },
      files_count: { type: 'int', label: 'Files', default: 0 },
      // Responses and files stored as JSON (also available as separate entities)
      responses: { type: 'json', label: 'Responses' },
      files: { type: 'json', label: 'Files' },
      // Flag (from Friday)
      flag: { type: 'bool', label: 'Flagged', list: true, default: false },
      ml_query: { type: 'bool', label: 'ML Query', default: false },
      // Assigned users (for client portal filtering)
      assigned_users: { type: 'json', label: 'Assigned Users' },
      // Recreation settings
      recreate_with_attachments: { type: 'bool', label: 'Copy on Recreation', default: false },
      // Linked to review highlight
      highlight_id: { type: 'ref', ref: 'highlight', label: 'Linked Highlight' },
      // Ordering
      sort_order: { type: 'int', default: 0, hidden: true },
      // Metadata
      created_by: { type: 'ref', ref: 'user', auto: 'user', readOnly: true },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
      updated_at: { type: 'timestamp', auto: 'update', readOnly: true },
    },
    options: {
      rfi_statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
      client_statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'sent', label: 'Sent', color: 'amber' },
        { value: 'responded', label: 'Responded', color: 'blue' },
        { value: 'completed', label: 'Completed', color: 'green' },
      ],
      auditor_statuses: [
        { value: 'requested', label: 'Requested', color: 'yellow' },
        { value: 'reviewing', label: 'Reviewing', color: 'blue' },
        { value: 'queries', label: 'Queries', color: 'amber' },
        { value: 'received', label: 'Received', color: 'green' },
      ],
    },
    children: {
      responses: { entity: 'rfi_response', fk: 'rfi_id', label: 'Responses' },
      attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'rfi' }, label: 'Attachments' },
      activity: { entity: 'activity_log', fk: 'entity_id', filter: { entity_type: 'rfi' }, label: 'Activity' },
    },
    list: {
      groupBy: 'section_id',
      expandable: true,
    },
    access: {
      list: ['partner', 'manager', 'clerk', 'client'],
      view: ['partner', 'manager', 'clerk', 'client'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      respond: ['partner', 'manager', 'clerk', 'client'],
      change_status: ['partner', 'manager'],
      delete: ['partner'],
    },
    // Custom actions
    actions: [
      { key: 'send_reminder', label: 'Send Reminder', icon: 'Bell', permission: 'edit', handler: 'sendRfiReminder' },
      { key: 'flag', label: 'Toggle Flag', icon: 'Flag', permission: 'edit', handler: 'toggleRfiFlag' },
      { key: 'bulk_deadline', label: 'Set Bulk Deadline', icon: 'Calendar', permission: 'edit', dialog: 'bulkDeadline' },
    ],
  },

  // === HIGHLIGHT (PDF Query) ===
  highlight: {
    name: 'highlight', label: 'Query', labelPlural: 'Queries', icon: 'MessageSquare', parent: 'review',
    fields: {
      id: { type: 'id' },
      review_id: { type: 'ref', ref: 'review', required: true, hidden: true },
      page_number: { type: 'int', label: 'Page', required: true, list: true },
      // Position data (from MWR highlight system)
      position: { type: 'json', label: 'Position', required: true, hidden: true },
      // Position structure: {boundingRect, rects[], pageNumber, usePdfCoordinates}
      // Content
      content: { type: 'text', label: 'Selected Text' },
      image: { type: 'text', label: 'Selection Image', hidden: true },
      comment: { type: 'textarea', label: 'Comment', list: true, search: true },
      emoji: { type: 'text', label: 'Emoji' },
      // Type
      type: { type: 'enum', label: 'Type', options: 'types', default: 'text' },
      // Resolution status (full)
      resolved: { type: 'bool', label: 'Resolved', list: true, default: false },
      resolved_by: { type: 'ref', ref: 'user' },
      resolved_at: { type: 'timestamp' },
      // Partial resolution (from MWR)
      partial_resolved: { type: 'bool', label: 'Partially Resolved', default: false },
      partial_resolved_by: { type: 'ref', ref: 'user' },
      partial_resolved_at: { type: 'timestamp' },
      // General comment (not tied to selection, fileId="general" in MWR)
      is_general: { type: 'bool', label: 'General Comment', default: false },
      // Linked to Friday RFI
      rfi_id: { type: 'ref', ref: 'rfi', label: 'Linked RFI' },
      // Display colors (from MWR)
      // Default=#B0B0B0, ScrolledTo=#7F7EFF, Partner=#ff4141, Resolved=#44BBA4
      color: { type: 'text', label: 'Color', default: '#B0B0B0' },
      is_partner: { type: 'bool', label: 'Partner Highlight', default: false },
      // Responses stored in JSON (also available as separate entities)
      responses: { type: 'json', label: 'Responses' },
      // Metadata
      email: { type: 'email', label: 'Creator Email' },
      created_by: { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
      updated_at: { type: 'timestamp', auto: 'update', readOnly: true },
    },
    options: {
      types: [
        { value: 'text', label: 'Text Selection' },
        { value: 'area', label: 'Area Selection' },
      ],
    },
    children: {
      responses: { entity: 'highlight_response', fk: 'highlight_id', label: 'Responses' },
      attachments: { entity: 'file', fk: 'entity_id', filter: { entity_type: 'highlight' }, label: 'Attachments' },
    },
    // Note: Highlights are never truly deleted - archived to removed_highlights
    softDelete: {
      archive: true,
      archiveEntity: 'removed_highlight',
    },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner', 'manager', 'clerk'],
      edit: ['partner', 'manager'],
      delete: ['partner'],
      resolve: ['partner', 'manager'],
      partial_resolve: ['partner', 'manager'],
    },
    // Custom actions
    actions: [
      { key: 'resolve', label: 'Resolve', icon: 'Check', permission: 'resolve', handler: 'resolveHighlight' },
      { key: 'partial_resolve', label: 'Partial Resolve', icon: 'CheckCheck', permission: 'partial_resolve', handler: 'partialResolveHighlight' },
      { key: 'push_to_rfi', label: 'Push to RFI', icon: 'Send', permission: 'edit', handler: 'pushHighlightToRfi' },
      { key: 'scroll_to', label: 'Scroll to Page', icon: 'Eye', permission: 'view', handler: 'scrollToHighlight' },
    ],
  },

  // === HIGHLIGHT RESPONSE ===
  highlight_response: {
    name: 'highlight_response', label: 'Response', labelPlural: 'Responses', icon: 'MessageCircle', embedded: true,
    fields: {
      id: { type: 'id' },
      highlight_id: { type: 'ref', ref: 'highlight', required: true },
      content: { type: 'textarea', label: 'Response', required: true, list: true },
      attachments: { type: 'json', label: 'Attachments' },
      created_by: { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner', 'manager', 'clerk'],
      edit: ['partner', 'manager'],
      delete: ['partner'],
    },
  },

  // === USER ===
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
      // Authentication
      auth_provider: { type: 'enum', label: 'Auth Provider', options: 'auth_providers', default: 'google' },
      uid: { type: 'text', label: 'Auth UID', hidden: true },
      // Profile
      cv_url: { type: 'text', label: 'CV URL' },
      phone: { type: 'text', label: 'Phone' },
      // Priority reviews (from MWR)
      priority_reviews: { type: 'json', label: 'Priority Reviews' },
      // Client access (for client users)
      clients: { type: 'json', label: 'Client Access' },
      // Last read tracking
      last_read_messages: { type: 'json', label: 'Last Read' },
      // Timestamps
      last_login: { type: 'timestamp', label: 'Last Login' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
      updated_at: { type: 'timestamp', auto: 'update', readOnly: true },
    },
    options: {
      types: [
        { value: 'auditor', label: 'Auditor' },
        { value: 'client', label: 'Client' },
      ],
      roles: [
        { value: 'partner', label: 'Partner' },
        { value: 'manager', label: 'Manager' },
        { value: 'clerk', label: 'Clerk' },
      ],
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
      auth_providers: [
        { value: 'google', label: 'Google' },
        { value: 'email', label: 'Email/Password' },
      ],
    },
    children: {
      teams: { entity: 'team_member', fk: 'user_id', label: 'Teams' },
    },
    access: {
      list: ['partner'],
      view: ['partner'],
      create: ['partner'],
      edit: ['partner'],
      delete: ['partner'],
    },
  },

  // === TEAM ===
  team: {
    name: 'team', label: 'Team', labelPlural: 'Teams', icon: 'Users',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true },
      partners: { type: 'json', label: 'Partners' },
      users: { type: 'json', label: 'Users' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
    },
    computed: {
      member_count: { sql: '(SELECT COUNT(*) FROM team_members WHERE team_id = teams.id)' },
    },
    children: {
      members: { entity: 'team_member', fk: 'team_id', label: 'Members' },
      engagements: { entity: 'engagement', fk: 'team_id', label: 'Engagements' },
      reviews: { entity: 'review', fk: 'team_id', label: 'Reviews' },
    },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner'],
      edit: ['partner'],
      delete: ['partner'],
    },
  },

  // === TEAM MEMBER ===
  team_member: {
    name: 'team_member', label: 'Team Member', labelPlural: 'Team Members', icon: 'UserPlus', embedded: true,
    fields: {
      id: { type: 'id' },
      team_id: { type: 'ref', ref: 'team', required: true },
      user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      role: { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'member' },
    },
    options: {
      roles: [
        { value: 'partner', label: 'Partner' },
        { value: 'member', label: 'Member' },
      ],
    },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner'],
      edit: ['partner'],
      delete: ['partner'],
    },
  },

  // === CLIENT USER ===
  client_user: {
    name: 'client_user', label: 'Contact', labelPlural: 'Contacts', icon: 'UserCircle', embedded: true,
    fields: {
      id: { type: 'id' },
      client_id: { type: 'ref', ref: 'client', required: true },
      user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      role: { type: 'enum', label: 'Role', options: 'roles', list: true, default: 'user' },
      is_primary: { type: 'bool', label: 'Primary Contact', default: false },
      status: { type: 'enum', label: 'Status', options: 'statuses', default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      roles: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
      ],
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
    },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      delete: ['partner'],
    },
  },

  // === FILE ===
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
      mime_type: { type: 'text', label: 'MIME Type' },
      download_url: { type: 'text', label: 'Download URL' },
      uploaded_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    access: {
      list: ['partner', 'manager', 'clerk', 'client'],
      view: ['partner', 'manager', 'clerk', 'client'],
      create: ['partner', 'manager', 'clerk', 'client'],
      delete: ['partner', 'manager'],
    },
  },

  // === CHAT MESSAGE ===
  chat_message: {
    name: 'chat_message', label: 'Message', labelPlural: 'Messages', icon: 'MessageSquare', embedded: true,
    fields: {
      id: { type: 'id' },
      entity_type: { type: 'text', required: true },
      entity_id: { type: 'text', required: true },
      content: { type: 'textarea', label: 'Message', required: true },
      attachments: { type: 'json' },
      is_team_only: { type: 'bool', label: 'Team Only', default: false },
      reply_to: { type: 'ref', ref: 'chat_message', label: 'Reply To' },
      // Source tracking for synced messages
      source: { type: 'enum', label: 'Source', options: 'sources', default: 'local' },
      is_friday_message: { type: 'bool', label: 'From Friday', default: false },
      is_review_message: { type: 'bool', label: 'From Review', default: false },
      created_by: { type: 'ref', ref: 'user', auto: 'user', display: 'user.name' },
      created_at: { type: 'timestamp', auto: 'now' },
    },
    options: {
      sources: [
        { value: 'local', label: 'Local' },
        { value: 'friday', label: 'Friday' },
        { value: 'review', label: 'My Review' },
      ],
    },
    access: {
      list: ['partner', 'manager', 'clerk', 'client'],
      view: ['partner', 'manager', 'clerk', 'client'],
      create: ['partner', 'manager', 'clerk', 'client'],
      delete: ['partner', 'manager'],
    },
  },

  // === TEMPLATE ===
  template: {
    name: 'template', label: 'Template', labelPlural: 'Templates', icon: 'FileCode',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, search: true },
      type: { type: 'enum', label: 'Type', options: 'types', list: true, default: 'standard' },
      template_type: { type: 'enum', label: 'Template Type', options: 'template_types', default: 'review' },
      description: { type: 'textarea', label: 'Description' },
      sections: { type: 'json', label: 'Sections' },
      default_checklists: { type: 'json', label: 'Default Checklists' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      types: [
        { value: 'standard', label: 'Standard' },
        { value: 'tender', label: 'Tender' },
        { value: 'friday', label: 'Friday' },
      ],
      template_types: [
        { value: 'review', label: 'Review' },
        { value: 'engagement', label: 'Engagement' },
        { value: 'rfi', label: 'RFI' },
      ],
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
    },
    access: {
      list: ['partner', 'manager'],
      view: ['partner', 'manager'],
      create: ['partner'],
      edit: ['partner'],
      delete: ['partner'],
    },
  },

  // === CHECKLIST ===
  checklist: {
    name: 'checklist', label: 'Checklist', labelPlural: 'Checklists', icon: 'ListChecks',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, search: true },
      section_items: { type: 'json', label: 'Items' }, // [{id, question, responses[], resolved}]
      items: { type: 'json', label: 'Items (Legacy)' },
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
    },
    access: {
      list: ['partner', 'manager'],
      view: ['partner', 'manager'],
      create: ['partner'],
      edit: ['partner'],
      delete: ['partner'],
    },
  },

  // === REVIEW CHECKLIST (attached to review) ===
  review_checklist: {
    name: 'review_checklist', label: 'Review Checklist', labelPlural: 'Review Checklists', icon: 'ClipboardCheck', embedded: true,
    fields: {
      id: { type: 'id' },
      review_id: { type: 'ref', ref: 'review', required: true },
      checklist_id: { type: 'ref', ref: 'checklist', required: true, list: true, display: 'checklist.name' },
      items: { type: 'json', label: 'Items' }, // [{id, question, responses[], resolved}]
      status: { type: 'enum', label: 'Status', options: 'statuses', list: true, default: 'pending' },
      completed_by: { type: 'ref', ref: 'user' },
      completed_at: { type: 'timestamp' },
      added_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'in_progress', label: 'In Progress', color: 'blue' },
        { value: 'completed', label: 'Completed', color: 'green' },
      ],
    },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager', 'clerk'],
      delete: ['partner'],
    },
  },

  // === ENGAGEMENT SECTION ===
  engagement_section: {
    name: 'engagement_section', label: 'Section', labelPlural: 'Sections', icon: 'FolderOpen', embedded: true,
    fields: {
      id: { type: 'id' },
      engagement_id: { type: 'ref', ref: 'engagement', required: true },
      name: { type: 'text', label: 'Name', required: true, list: true },
      key: { type: 'text', label: 'Key' },
      sort_order: { type: 'int', label: 'Order', default: 0 },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      delete: ['partner', 'manager'],
    },
  },

  // === ACTIVITY LOG ===
  activity_log: {
    name: 'activity_log', label: 'Activity', labelPlural: 'Activity', icon: 'Activity', embedded: true,
    fields: {
      id: { type: 'id' },
      entity_type: { type: 'text', required: true },
      entity_id: { type: 'text', required: true },
      action: { type: 'enum', label: 'Action', options: 'actions', required: true },
      message: { type: 'text', label: 'Message', required: true, list: true },
      details: { type: 'json', label: 'Details' },
      user_email: { type: 'email', label: 'User Email', list: true },
      created_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    options: {
      actions: [
        { value: 'create', label: 'Created' },
        { value: 'update', label: 'Updated' },
        { value: 'delete', label: 'Deleted' },
        { value: 'status_change', label: 'Status Changed' },
        { value: 'stage_change', label: 'Stage Changed' },
        { value: 'upload', label: 'File Uploaded' },
        { value: 'response', label: 'Response Added' },
        { value: 'resolve', label: 'Resolved' },
        { value: 'assign', label: 'Assigned' },
        { value: 'comment', label: 'Comment Added' },
      ],
    },
    list: { defaultSort: { field: 'created_at', dir: 'desc' } },
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner', 'manager', 'clerk'],
    },
  },

  // === COLLABORATOR (Review Access) ===
  collaborator: {
    name: 'collaborator', label: 'Collaborator', labelPlural: 'Collaborators', icon: 'UserPlus', embedded: true, parent: 'review',
    fields: {
      id: { type: 'id' },
      review_id: { type: 'ref', ref: 'review', required: true, hidden: true },
      user_id: { type: 'ref', ref: 'user', required: true, list: true, display: 'user.name' },
      type: { type: 'enum', label: 'Type', options: 'types', list: true, default: 'permanent' },
      expires_at: { type: 'timestamp', label: 'Expires At', list: true },
      added_by: { type: 'ref', ref: 'user', auto: 'user' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      types: [
        { value: 'permanent', label: 'Permanent', color: 'green' },
        { value: 'temporary', label: 'Temporary', color: 'yellow' },
      ],
    },
    access: {
      list: ['partner', 'manager'],
      view: ['partner', 'manager'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      delete: ['partner', 'manager'],
    },
  },

  // === USER GROUP (permissions) ===
  user_group: {
    name: 'user_group', label: 'User Group', labelPlural: 'User Groups', icon: 'Shield',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, unique: true },
      description: { type: 'textarea', label: 'Description' },
      roles: { type: 'json', label: 'Permissions' }, // {resource: {action: true/false}}
      status: { type: 'enum', label: 'Status', options: 'statuses', default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
    },
    access: {
      list: ['partner'],
      view: ['partner'],
      create: ['partner'],
      edit: ['partner'],
      delete: ['partner'],
    },
  },

  // === SETTINGS ===
  settings: {
    name: 'settings', label: 'Settings', labelPlural: 'Settings', icon: 'Settings', singleton: true,
    fields: {
      id: { type: 'id' },
      key: { type: 'text', label: 'Key', required: true, unique: true },
      value: { type: 'json', label: 'Value' },
      // App settings
      version: { type: 'text', label: 'Version' },
      keys: { type: 'json', label: 'API Keys', hidden: true }, // {mwr: '', drive: '', etc}
      // MWR settings
      temporary_review_access_period: { type: 'int', label: 'Temp Access Days', default: 7 },
      flags_managers: { type: 'json', label: 'Manager Flags' },
      tender_flags: { type: 'json', label: 'Tender Flags' },
      // Notification settings
      notification_triggers: { type: 'json', label: 'Notification Triggers' },
      updated_at: { type: 'timestamp', auto: 'update' },
    },
    access: {
      list: ['partner'],
      view: ['partner'],
      edit: ['partner'],
    },
  },

  // === RECREATION LOG ===
  recreation_log: {
    name: 'recreation_log', label: 'Recreation Log', labelPlural: 'Recreation Logs', icon: 'RefreshCw', embedded: true,
    fields: {
      id: { type: 'id' },
      engagement_id: { type: 'ref', ref: 'engagement', required: true },
      client_id: { type: 'ref', ref: 'client' },
      engagement_type_id: { type: 'text' },
      status: { type: 'enum', label: 'Status', options: 'statuses', default: 'pending' },
      details: { type: 'json', label: 'Details' },
      error: { type: 'text', label: 'Error' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    options: {
      statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'processing', label: 'Processing', color: 'blue' },
        { value: 'completed', label: 'Completed', color: 'green' },
        { value: 'failed', label: 'Failed', color: 'red' },
      ],
    },
    list: { defaultSort: { field: 'created_at', dir: 'desc' } },
    access: {
      list: ['partner', 'manager'],
      view: ['partner', 'manager'],
    },
  },

  // === EMAIL (incoming) ===
  email: {
    name: 'email', label: 'Email', labelPlural: 'Emails', icon: 'Mail',
    fields: {
      id: { type: 'id' },
      subject: { type: 'text', label: 'Subject', list: true, search: true },
      from_address: { type: 'email', label: 'From', list: true },
      from_name: { type: 'text', label: 'From Name' },
      to_address: { type: 'email', label: 'To' },
      cc: { type: 'text', label: 'CC' },
      bcc: { type: 'text', label: 'BCC' },
      body: { type: 'textarea', label: 'Body' },
      html_body: { type: 'textarea', label: 'HTML Body' },
      attachment_urls: { type: 'json', label: 'Attachments' },
      // Allocation
      allocated: { type: 'bool', label: 'Allocated', list: true, default: false },
      allocated_to_client: { type: 'ref', ref: 'client', label: 'Client', display: 'client.name' },
      allocated_to_engagement: { type: 'ref', ref: 'engagement', label: 'Engagement' },
      allocated_to_rfi: { type: 'ref', ref: 'rfi', label: 'RFI' },
      allocated_by: { type: 'ref', ref: 'user' },
      allocated_at: { type: 'timestamp' },
      // Dates
      email_date: { type: 'timestamp', label: 'Email Date' },
      received_at: { type: 'timestamp', label: 'Received At', auto: 'now' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    list: { defaultSort: { field: 'created_at', dir: 'desc' }, filters: ['allocated'] },
    access: {
      list: ['partner', 'manager'],
      view: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      delete: ['partner'],
    },
  },

  // === NOTIFICATION (queue) ===
  notification: {
    name: 'notification', label: 'Notification', labelPlural: 'Notifications', icon: 'Bell', embedded: true,
    fields: {
      id: { type: 'id' },
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
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      types: [
        { value: 'review_created', label: 'Review Created' },
        { value: 'review_status', label: 'Review Status Change' },
        { value: 'collaborator_added', label: 'Collaborator Added' },
        { value: 'rfi_deadline', label: 'RFI Deadline' },
        { value: 'rfi_response', label: 'RFI Response' },
        { value: 'engagement_stage', label: 'Engagement Stage Change' },
        { value: 'tender_deadline', label: 'Tender Deadline' },
        { value: 'weekly_summary', label: 'Weekly Summary' },
        { value: 'checklist_pdf', label: 'Checklist PDF' },
      ],
      statuses: [
        { value: 'pending', label: 'Pending', color: 'yellow' },
        { value: 'sent', label: 'Sent', color: 'green' },
        { value: 'failed', label: 'Failed', color: 'red' },
      ],
    },
    list: { defaultSort: { field: 'created_at', dir: 'desc' } },
    access: {
      list: ['partner'],
      view: ['partner'],
    },
  },

  // === FLAG (standalone) ===
  flag: {
    name: 'flag', label: 'Flag', labelPlural: 'Flags', icon: 'Flag',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, search: true },
      color: { type: 'text', label: 'Color', list: true, default: '#ff4141' },
      type: { type: 'enum', label: 'Type', options: 'types', list: true },
      status: { type: 'enum', label: 'Status', options: 'statuses', default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      types: [
        { value: 'review', label: 'Review' },
        { value: 'tender', label: 'Tender' },
        { value: 'rfi', label: 'RFI' },
      ],
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
    },
    access: {
      list: ['partner', 'manager'],
      view: ['partner', 'manager'],
      create: ['partner'],
      edit: ['partner'],
      delete: ['partner'],
    },
  },

  // === TAG (standalone) ===
  tag: {
    name: 'tag', label: 'Tag', labelPlural: 'Tags', icon: 'Tag',
    fields: {
      id: { type: 'id' },
      name: { type: 'text', label: 'Name', required: true, list: true, search: true },
      color: { type: 'text', label: 'Color', list: true, default: '#3b82f6' },
      status: { type: 'enum', label: 'Status', options: 'statuses', default: 'active' },
      created_at: { type: 'timestamp', auto: 'now', readOnly: true },
    },
    options: {
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
    },
    access: {
      list: ['partner', 'manager'],
      view: ['partner', 'manager'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      delete: ['partner'],
    },
  },

  // === RFI RESPONSE ===
  rfi_response: {
    name: 'rfi_response', label: 'Response', labelPlural: 'Responses', icon: 'MessageCircle', embedded: true, parent: 'rfi',
    fields: {
      id: { type: 'id' },
      rfi_id: { type: 'ref', ref: 'rfi', required: true, hidden: true },
      content: { type: 'textarea', label: 'Response', required: true, list: true },
      attachments: { type: 'json', label: 'Attachments' },
      is_client: { type: 'bool', label: 'From Client', default: false },
      created_by: { type: 'ref', ref: 'user', auto: 'user', list: true, display: 'user.name' },
      created_at: { type: 'timestamp', auto: 'now', list: true },
    },
    access: {
      list: ['partner', 'manager', 'clerk', 'client'],
      view: ['partner', 'manager', 'clerk', 'client'],
      create: ['partner', 'manager', 'clerk', 'client'],
      delete: ['partner'],
    },
  },

  // === REMOVED HIGHLIGHT (archive) ===
  removed_highlight: {
    name: 'removed_highlight', label: 'Removed Highlight', labelPlural: 'Removed Highlights', icon: 'Archive', embedded: true,
    fields: {
      id: { type: 'id' },
      review_id: { type: 'ref', ref: 'review', required: true },
      original_id: { type: 'text', required: true },
      highlight_data: { type: 'json', label: 'Highlight Data', required: true },
      removed_by: { type: 'ref', ref: 'user', auto: 'user' },
      removed_at: { type: 'timestamp', auto: 'now' },
    },
    access: {
      list: ['partner'],
      view: ['partner'],
    },
  },

  // === SYSTEM LOG ===
  system_log: {
    name: 'system_log', label: 'System Log', labelPlural: 'System Logs', icon: 'FileText', embedded: true,
    fields: {
      id: { type: 'id' },
      level: { type: 'enum', label: 'Level', options: 'levels', default: 'info' },
      message: { type: 'text', label: 'Message', required: true, list: true },
      review: { type: 'text', label: 'Review' },
      email: { type: 'email', label: 'Email' },
      details: { type: 'json', label: 'Details' },
      stack: { type: 'textarea', label: 'Stack Trace' },
      log_time: { type: 'timestamp', auto: 'now', list: true },
    },
    options: {
      levels: [
        { value: 'info', label: 'Info', color: 'blue' },
        { value: 'warning', label: 'Warning', color: 'yellow' },
        { value: 'error', label: 'Error', color: 'red' },
      ],
    },
    list: { defaultSort: { field: 'log_time', dir: 'desc' } },
    access: {
      list: ['partner'],
      view: ['partner'],
    },
  },
};

// === HELPER FUNCTIONS ===

export function getSpec(name) {
  const spec = specs[name];
  if (!spec) throw new Error(`Unknown entity: ${name}`);
  return spec;
}

export function getListFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.list)
    .map(([key, f]) => ({ key, ...f }));
}

export function getFormFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && !f.readOnly && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));
}

export function getOptions(spec, optionsKey) {
  return spec.options?.[optionsKey] || [];
}

export function getNavItems() {
  return Object.values(specs)
    .filter(s => !s.embedded && !s.parent && !s.singleton)
    .map(s => ({
      name: s.name,
      label: s.labelPlural,
      icon: s.icon,
      href: `/${s.name}`,
    }));
}

// Get all entities including embedded ones
export function getAllSpecs() {
  return Object.values(specs);
}

// Check if entity has a parent
export function hasParent(spec) {
  return !!spec.parent;
}

// Get child definitions for an entity
export function getChildren(spec) {
  return spec.children || {};
}
