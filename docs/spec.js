export const systemAnalysis = {
  friday: {
    purpose: 'Audit firm engagement management with RFI handling, client collaboration, workflow automation',
    entities: ['engagement', 'client', 'rfi', 'template', 'team', 'user', 'section', 'response', 'file'],
    stages: ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'],
    roles: {
      partner: { level: 3, can: ['close_out', 'all_settings', 'manage_users'] },
      manager: { level: 2, can: ['change_stage', 'mark_complete', 'manage_rfi'] },
      clerk: { level: 1, can: ['view', 'respond_rfi'] },
      client_admin: { level: 1, can: ['view_client_rfis', 'respond'] },
      client_user: { level: 0, can: ['view_assigned_rfis', 'respond'] }
    },
    features: [
      'engagement_lifecycle_6_stages',
      'rfi_tracking_days_outstanding',
      'client_portal',
      'email_automation',
      'engagement_recreation_yearly_monthly',
      'realtime_chat_with_review_sync',
      'google_drive_integration',
      'pdf_generation_from_templates',
      'activity_logging',
      'pwa_offline_support'
    ]
  },
  review: {
    purpose: 'PDF document review with annotations, checklists, collaboration',
    entities: ['review', 'highlight', 'checklist', 'template', 'collaborator', 'flag', 'tag', 'response'],
    roles: {
      partner: { level: 3, can: ['delete_attachments', 'remove_checklists', 'unresolve_any', 'settings'] },
      manager: { level: 2, can: ['resolve', 'add_checklists', 'unresolve_own'] },
      clerk: { level: 1, can: ['view', 'create_highlights', 'respond'] }
    },
    features: [
      'pdfjs_viewer_zoom_nav',
      'text_area_highlighting',
      'comment_threads_nested',
      'checklist_sections_resolution',
      'bidirectional_friday_linking',
      'chat_sync_cross_platform',
      'ai_tool_integration',
      'pdf_comparison_sync_scroll',
      'ml_query_consolidation',
      'weekly_checklist_reports'
    ]
  },
  integration: {
    auth: 'custom_token_exchange_firebase_projects',
    chat: 'message_merge_from_both_collections_tagged_source',
    checklist: 'friday_push_to_review',
    queries: 'review_highlights_become_friday_rfis',
    link: 'engagement_review_link_bidirectional'
  }
};

export const rebuildStack = {
  ui: { from: 'react_mui', to: 'webjsx_rippleui', reason: 'buildless_tailwind' },
  build: { from: 'cra', to: 'zero_build_esm', reason: 'no_bundler' },
  styling: { from: 'styled_components_mui', to: 'rippleui_tailwind', reason: 'utility_first' },
  state: { from: 'react_context', to: 'webjsx_signals', reason: 'fine_grained_reactivity' },
  routing: { from: 'react_router', to: 'url_based', reason: 'simpler' },
  backend: { from: 'firebase_functions', to: 'nodejs_sqlite', reason: 'single_db_transactions' },
  database: { from: 'firestore', to: 'sqlite_fts5', reason: 'full_text_search_joins' },
  auth: { from: 'firebase_auth', to: 'custom_oauth', reason: 'single_system' },
  storage: { from: 'firebase_storage_drive', to: 'local_s3_compatible', reason: 'unified' }
};

export const featureParity = {
  engagement: {
    p0: [
      'six_stage_workflow',
      'automatic_stage_transitions',
      'engagement_creation_validation',
      'client_assignment',
      'team_assignment',
      'fee_tracking',
      'progress_calculation',
      'duplicate_check'
    ],
    p1: [
      'engagement_recreation',
      'engagement_letter_generation'
    ]
  },
  rfi: {
    p0: [
      'rfi_from_templates',
      'client_user_assignment',
      'file_uploads',
      'response_tracking',
      'status_workflow',
      'days_outstanding_calc',
      'deadline_management'
    ],
    p1: [
      'flag_ml_markers',
      'bulk_deadline',
      'rfi_reminders'
    ]
  },
  client_portal: {
    p0: [
      'filtered_engagement_view',
      'rfi_response_submission',
      'file_upload_responses',
      'view_assigned_only',
      'admin_sees_all'
    ]
  },
  review: {
    p0: [
      'pdfjs_viewing',
      'text_highlighting',
      'area_highlighting',
      'comment_threads',
      'highlight_resolution',
      'color_coding_by_role',
      'checklist_sections',
      'checklist_responses'
    ],
    p1: ['file_attachments_responses'],
    p2: ['pdf_comparison', 'sync_scrolling']
  },
  collaboration: {
    p0: ['realtime_chat', 'permanent_collaborators', 'activity_logging'],
    p1: ['chat_attachments', 'cross_platform_sync', 'temporary_collaborators']
  },
  email: {
    p0: ['stage_notifications', 'rate_limiting', 'bounce_handling'],
    p1: ['weekly_summaries', 'deadline_reminders', 'collaborator_notifications']
  },
  user: {
    p0: ['google_oauth', 'role_permissions', 'team_membership', 'user_status'],
    p2: ['daily_external_sync']
  }
};

export const entitySchemas = {
  engagement: {
    fields: {
      client_id: { type: 'reference', ref: 'client', required: true },
      team_id: { type: 'reference', ref: 'team', required: true },
      engagement_type_id: { type: 'reference', ref: 'engagement_type', required: true },
      year: { type: 'integer', required: true, min: 2000, max: 2100 },
      month: { type: 'string' },
      stage: { type: 'enum', values: ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'] },
      status: { type: 'enum', values: ['pending', 'active'] },
      fee: { type: 'decimal', min: 0 },
      commencement_date: { type: 'date', required: true },
      completion_date: { type: 'date' },
      repeat_interval: { type: 'enum', values: ['yearly', 'monthly', 'once'] },
      users: { type: 'array', items: { type: 'reference', ref: 'user' } }
    },
    computed: {
      progress: 'calculateEngagementProgress',
      client_progress: 'calculateClientProgress'
    },
    constraints: { unique: ['client_id', 'engagement_type_id', 'year', 'month'] }
  },
  rfi: {
    fields: {
      engagement_id: { type: 'reference', ref: 'engagement', required: true },
      section_id: { type: 'reference', ref: 'section' },
      question: { type: 'text', required: true },
      status: { type: 'integer', default: 0 },
      date_requested: { type: 'datetime' },
      date_resolved: { type: 'datetime' },
      deadline_date: { type: 'date' },
      auditor_status: { type: 'enum', values: ['requested', 'reviewing', 'queries', 'received'] },
      client_status: { type: 'enum', values: ['pending', 'partially_sent', 'sent'] },
      users: { type: 'array', items: { type: 'reference', ref: 'user' } },
      flag: { type: 'boolean', default: false },
      ml_query: { type: 'boolean', default: false }
    },
    computed: {
      days_outstanding: 'calculateWorkingDays(date_requested, date_resolved || now())',
      files_count: 'countRelatedFiles',
      response_count: 'countRelatedResponses'
    }
  },
  review: {
    fields: {
      name: { type: 'text', required: true },
      financial_year: { type: 'text' },
      template_id: { type: 'reference', ref: 'template' },
      team_id: { type: 'reference', ref: 'team' },
      status: { type: 'enum', values: ['open', 'closed'], default: 'open' },
      file_url: { type: 'text' },
      friday_link: { type: 'reference', ref: 'engagement' },
      private: { type: 'boolean', default: false },
      archived: { type: 'boolean', default: false }
    }
  },
  highlight: {
    fields: {
      review_id: { type: 'reference', ref: 'review', required: true },
      position: { type: 'json', required: true },
      content: { type: 'json' },
      comment: { type: 'json' },
      resolved: { type: 'boolean', default: false },
      resolved_by: { type: 'reference', ref: 'user' },
      resolved_date: { type: 'datetime' },
      partial_resolved: { type: 'boolean', default: false },
      ml_query: { type: 'boolean', default: false },
      created_by: { type: 'reference', ref: 'user', required: true }
    }
  }
};

export const systemConfig = {
  organization: {
    timezone: 'Africa/Johannesburg',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    fiscal_year_start: 3
  },
  thresholds: {
    email: { rate_limit_per_minute: 100, daily_limit: 10000, send_max_retries: 3, rate_limit_delay_ms: 600 },
    rfi: { max_days_outstanding: 90, deadline_reminder_days: [7, 3, 1, 0] },
    workflow: { stage_transition_lockout_minutes: 5 },
    system: { default_page_size: 50, max_page_size: 100, session_timeout_hours: 24 }
  },
  automation: {
    schedules: {
      daily_engagement_check: '0 6 * * *',
      daily_rfi_notifications: '0 7 * * *',
      weekly_client_emails: '0 8 * * 1',
      yearly_engagement_creation: '0 1 1 1 *',
      monthly_engagement_creation: '0 1 1 * *',
      daily_backup: '0 2 * * *'
    }
  }
};

export const entityConfig = {
  engagement: {
    display: {
      list_columns: ['client.name', 'engagement_type.name', 'year', 'stage', 'progress'],
      card_fields: ['client.name', 'fee', 'commencement_date'],
      search_fields: ['client.name', 'engagement_type.name']
    },
    stages: {
      info_gathering: {
        label: 'Info Gathering', color: 'gray',
        auto_transition: { to: 'commencement', condition: 'commencement_date <= today' },
        restrictions: { manual_set: 'commencement_date > today' }
      },
      commencement: { label: 'Commencement', color: 'blue', on_enter: ['send_engagement_letter'] },
      team_execution: { label: 'Team Execution', color: 'yellow' },
      partner_review: { label: 'Partner Review', color: 'orange' },
      finalization: {
        label: 'Finalization', color: 'purple',
        restrictions: { advance: 'role == partner && (engagement_letter_accepted || progress == 0)' }
      },
      close_out: { label: 'Close Out', color: 'green', readonly: true }
    },
    recreation: {
      copy_entities: ['section', 'rfi', 'checklist'],
      reset_fields: { stage: 'info_gathering', progress: 0, engagement_letter: null, post_rfi: null },
      date_adjustments: { yearly: { commencement_date: '+1 year' }, monthly: { commencement_date: '+1 month' } }
    }
  },
  rfi: {
    display: { list_columns: ['question', 'status', 'deadline_date', 'days_outstanding'], group_by: 'section.name' },
    status_machine: {
      waiting: {
        value: 0, label: 'Waiting', color: 'yellow',
        transitions: { completed: { guard: 'files_count > 0 || response_count > 0', role: ['manager', 'partner'] } }
      },
      completed: {
        value: 1, label: 'Completed', color: 'green',
        transitions: { waiting: { role: ['manager', 'partner'] } }
      }
    }
  },
  review: {
    display: { list_columns: ['name', 'financial_year', 'status', 'team.name'], tabs: ['active', 'priority', 'history', 'archive'] },
    highlight_colors: { default: '#B0B0B0', partner: '#ff4141', resolved: '#44BBA4', scrolled_to: '#7F7EFF' }
  }
};

export const dbSchema = `
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data JSON NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT,
  status TEXT DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(type, status);

CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(id, type, searchable_text, content='entities', content_rowid='rowid');

CREATE TABLE IF NOT EXISTS entity_relations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  data JSON,
  FOREIGN KEY (source_id) REFERENCES entities(id),
  FOREIGN KEY (target_id) REFERENCES entities(id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  changes JSON,
  user_id TEXT,
  timestamp INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  entity_id TEXT,
  entity_type TEXT,
  filename TEXT NOT NULL,
  mimetype TEXT,
  size INTEGER,
  storage_path TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT
);
`;

export const apiRoutes = {
  entities: {
    list: 'GET /api/entities/:type',
    create: 'POST /api/entities/:type',
    get: 'GET /api/entities/:type/:id',
    update: 'PUT /api/entities/:type/:id',
    delete: 'DELETE /api/entities/:type/:id',
    related: 'GET /api/entities/:type/:id/related',
    action: 'POST /api/entities/:type/:id/action'
  },
  query: {
    filter: '?filter[field]=value',
    gt: '?filter[field][gt]=value',
    contains: '?filter[field][contains]=text',
    sort: '?sort=field,-other',
    include: '?include=related_type',
    paginate: '?page=1&limit=50'
  }
};

export const migrationPhases = [
  { phase: 1, weeks: '1-2', name: 'Foundation', tasks: ['webjsx_setup', 'rippleui_integrate', 'sqlite_schema', 'entity_api', 'config_system'] },
  { phase: 2, weeks: '3-4', name: 'Core Entities', tasks: ['google_oauth', 'team_role_mgmt', 'client_entity', 'engagement_stages'] },
  { phase: 3, weeks: '5-6', name: 'RFI System', tasks: ['rfi_templates', 'response_handling', 'file_uploads', 'days_outstanding'] },
  { phase: 4, weeks: '7-8', name: 'Document Review', tasks: ['pdfjs_integration', 'highlight_system', 'comment_threads', 'checklist_sections'] },
  { phase: 5, weeks: '9-10', name: 'Integration', tasks: ['chat_system', 'cross_platform_link', 'email_notifications', 'scheduled_jobs'] },
  { phase: 6, weeks: '11-12', name: 'Polish', tasks: ['pwa_config', 'offline_support', 'performance', 'data_migration'] }
];

export const simplifications = {
  unified_entity_system: 'Single entities table with type discrimination and JSON storage enables generic CRUD, consistent permissions, unified search, simplified backup',
  config_over_code: 'Stage transitions, permission matrices, notification triggers, field validations all in config not code',
  single_database: 'Replace dual Firebase projects with SQLite - eliminates cross-project auth complexity, enables transactions, reduces costs',
  buildless: 'webjsx eliminates build step - direct ESM imports, runtime JSX transpile, HMR without bundler',
  tailwind_styling: 'Ripple UI replaces styled-components - utility CSS, smaller bundle, consistent design, no CSS-in-JS'
};

export const successCriteria = {
  feature_parity: 'All P0 features functional',
  performance: 'Page load < 2s, API < 200ms',
  reliability: 'Zero-downtime deploys, auto-recovery',
  adaptability: 'New entity types via config only',
  simplicity: '< 10K lines total',
  maintainability: 'Single dev can understand entire system'
};
