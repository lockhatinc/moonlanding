// Shared constants for entity specifications
// Centralizes common patterns to reduce duplication

// ========================================
// COMMON STATUS OPTIONS
// ========================================

export const STATUS = {
  ACTIVE_INACTIVE: [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'inactive', label: 'Inactive', color: 'gray' },
  ],
  PENDING_ACTIVE: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'completed', label: 'Completed', color: 'blue' },
    { value: 'archived', label: 'Archived', color: 'gray' },
  ],
  OPEN_CLOSED: [
    { value: 'open', label: 'Open', color: 'green' },
    { value: 'closed', label: 'Closed', color: 'gray' },
  ],
  PROGRESS: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'in_progress', label: 'In Progress', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
  ],
  NOTIFICATION: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'sent', label: 'Sent', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' },
  ],
  RECREATION: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'processing', label: 'Processing', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' },
  ],
};

// ========================================
// WORKFLOW STATUS OPTIONS
// ========================================

export const WORKFLOW_STATUS = {
  CLIENT: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'partially_sent', label: 'Partially Sent', color: 'amber' },
    { value: 'sent', label: 'Sent', color: 'green' },
  ],
  AUDITOR: [
    { value: 'requested', label: 'Requested', color: 'yellow' },
    { value: 'reviewing', label: 'Reviewing', color: 'blue' },
    { value: 'queries', label: 'Queries', color: 'amber' },
    { value: 'received', label: 'Received', color: 'green' },
  ],
  LETTER_CLIENT: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'sent', label: 'Sent', color: 'green' },
  ],
  LETTER_AUDITOR: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'queries', label: 'Queries', color: 'amber' },
    { value: 'accepted', label: 'Accepted', color: 'green' },
  ],
  POST_RFI_CLIENT: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'queries', label: 'Queries', color: 'amber' },
    { value: 'accepted', label: 'Accepted', color: 'green' },
  ],
  POST_RFI_AUDITOR: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'sent', label: 'Sent', color: 'green' },
  ],
  RFI_CLIENT: [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'sent', label: 'Sent', color: 'amber' },
    { value: 'responded', label: 'Responded', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
  ],
};

// ========================================
// ENGAGEMENT STAGES
// ========================================

export const ENGAGEMENT_STAGES = [
  { value: 'info_gathering', label: 'Info Gathering' },
  { value: 'commencement', label: 'Commencement' },
  { value: 'team_execution', label: 'Team Execution' },
  { value: 'partner_review', label: 'Partner Review' },
  { value: 'finalization', label: 'Finalization' },
  { value: 'close_out', label: 'Close Out' },
];

export const STAGE_WORKFLOW = {
  info_gathering: { next: 'commencement', auto_transition: 'commencement_date', allowed_roles: ['partner', 'manager'] },
  commencement: { next: 'team_execution', prev: null, allowed_roles: ['partner', 'manager'] },
  team_execution: { next: 'partner_review', prev: 'commencement', allowed_roles: ['partner', 'manager'] },
  partner_review: { next: 'finalization', prev: 'team_execution', allowed_roles: ['partner', 'manager'] },
  finalization: { next: 'close_out', prev: 'partner_review', allowed_roles: ['partner', 'manager'] },
  close_out: { prev: null, requires: ['letter_auditor_status=accepted'], allowed_roles: ['partner'] },
};

// ========================================
// REPEAT INTERVALS
// ========================================

export const REPEAT_INTERVALS = [
  { value: 'once', label: 'Once' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

// ========================================
// COMMON FIELD DEFINITIONS
// ========================================

export const FIELDS = {
  // Standard ID field
  id: { type: 'id' },

  // Timestamps (group: Metadata - won't show in forms as readOnly)
  created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  updated_at: { type: 'timestamp', auto: 'update', readOnly: true },

  // Audit fields
  created_by: (opts = {}) => ({
    type: 'ref', ref: 'user', auto: 'user', readOnly: true,
    label: opts.label || 'Created By',
    ...opts
  }),

  // Entity reference (polymorphic)
  entity_type: { type: 'text', required: true, hidden: true },
  entity_id: { type: 'text', required: true, hidden: true },

  // Status with options
  status: (options = 'statuses', defaultVal = 'active') => ({
    type: 'enum', label: 'Status', options, list: true, default: defaultVal, group: 'Basic Info',
  }),

  // Name field (searchable)
  name: (opts = {}) => ({
    type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true, group: 'Basic Info',
    ...opts,
  }),

  // Email field
  email: (opts = {}) => ({
    type: 'email', label: 'Email', list: true, search: true, group: 'Basic Info',
    ...opts,
  }),

  // Resolution fields
  resolved: { type: 'bool', label: 'Resolved', list: true, default: false },
  resolved_by: { type: 'ref', ref: 'user' },
  resolved_at: { type: 'timestamp' },

  // Partial resolution
  partial_resolved: { type: 'bool', label: 'Partially Resolved', default: false },
  partial_resolved_by: { type: 'ref', ref: 'user' },
  partial_resolved_at: { type: 'timestamp' },

  // Sort order
  sort_order: { type: 'int', default: 0, hidden: true },

  // JSON attachments
  attachments: { type: 'json', label: 'Attachments' },

  // Ref field factory with group
  ref: (refEntity, label, opts = {}) => ({
    type: 'ref', ref: refEntity, label, display: `${refEntity}.name`, group: 'Basic Info',
    ...opts,
  }),

  // Date field factory
  date: (label, opts = {}) => ({
    type: 'date', label, group: 'Dates',
    ...opts,
  }),

  // Bool field factory (settings)
  bool: (label, opts = {}) => ({
    type: 'bool', label, default: false, group: 'Settings',
    ...opts,
  }),

  // Decimal field factory (financial)
  decimal: (label, opts = {}) => ({
    type: 'decimal', label, group: 'Financial',
    ...opts,
  }),
};

// Generate timestamp fields bundle
export const timestampFields = () => ({
  created_at: FIELDS.created_at,
  updated_at: FIELDS.updated_at,
});

// Generate audit fields bundle
export const auditFields = () => ({
  created_by: FIELDS.created_by(),
  ...timestampFields(),
});

// Generate resolution fields bundle
export const resolutionFields = () => ({
  resolved: FIELDS.resolved,
  resolved_by: FIELDS.resolved_by,
  resolved_at: FIELDS.resolved_at,
});

// Generate partial resolution fields bundle
export const partialResolutionFields = () => ({
  partial_resolved: FIELDS.partial_resolved,
  partial_resolved_by: FIELDS.partial_resolved_by,
  partial_resolved_at: FIELDS.partial_resolved_at,
});

// ========================================
// COMMON ACCESS PATTERNS
// ========================================

export const ACCESS = {
  // Full CRUD for partners only
  PARTNER_ONLY: {
    list: ['partner'], view: ['partner'], create: ['partner'],
    edit: ['partner'], delete: ['partner'],
  },

  // Partners manage, managers/clerks view
  PARTNER_MANAGE: {
    list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'],
    create: ['partner'], edit: ['partner'], delete: ['partner'],
  },

  // Partners/managers manage, clerks view
  MANAGER_MANAGE: {
    list: ['partner', 'manager', 'clerk'], view: ['partner', 'manager', 'clerk'],
    create: ['partner', 'manager'], edit: ['partner', 'manager'], delete: ['partner'],
  },

  // Full access including clients (for RFIs, files)
  WITH_CLIENT: {
    list: ['partner', 'manager', 'clerk', 'client'],
    view: ['partner', 'manager', 'clerk', 'client'],
    create: ['partner', 'manager', 'clerk', 'client'],
    delete: ['partner', 'manager'],
  },

  // Read-only for most
  READ_ONLY: {
    list: ['partner', 'manager'], view: ['partner', 'manager'],
  },
};

// ========================================
// HIGHLIGHT COLORS (MWR)
// ========================================

export const HIGHLIGHT_COLORS = {
  default: '#B0B0B0',
  scrolledTo: '#7F7EFF',
  partner: '#ff4141',
  resolved: '#44BBA4',
};

// ========================================
// ROLE DEFINITIONS
// ========================================

export const USER_TYPES = [
  { value: 'auditor', label: 'Auditor' },
  { value: 'client', label: 'Client' },
];

export const USER_ROLES = [
  { value: 'partner', label: 'Partner' },
  { value: 'manager', label: 'Manager' },
  { value: 'clerk', label: 'Clerk' },
];

export const CLIENT_USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

export const TEAM_MEMBER_ROLES = [
  { value: 'partner', label: 'Partner' },
  { value: 'member', label: 'Member' },
];

export const AUTH_PROVIDERS = [
  { value: 'google', label: 'Google' },
  { value: 'email', label: 'Email/Password' },
];

// ========================================
// NOTIFICATION TYPES
// ========================================

export const NOTIFICATION_TYPES = [
  { value: 'review_created', label: 'Review Created' },
  { value: 'review_status', label: 'Review Status Change' },
  { value: 'collaborator_added', label: 'Collaborator Added' },
  { value: 'rfi_deadline', label: 'RFI Deadline' },
  { value: 'rfi_response', label: 'RFI Response' },
  { value: 'engagement_stage', label: 'Engagement Stage Change' },
  { value: 'tender_deadline', label: 'Tender Deadline' },
  { value: 'weekly_summary', label: 'Weekly Summary' },
  { value: 'checklist_pdf', label: 'Checklist PDF' },
];

// ========================================
// ACTIVITY LOG ACTIONS
// ========================================

export const ACTIVITY_ACTIONS = [
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
];

// ========================================
// LOG LEVELS
// ========================================

export const LOG_LEVELS = [
  { value: 'info', label: 'Info', color: 'blue' },
  { value: 'warning', label: 'Warning', color: 'yellow' },
  { value: 'error', label: 'Error', color: 'red' },
];

// ========================================
// ENGAGEMENT TYPES (legacy enum)
// ========================================

export const ENGAGEMENT_TYPES = [
  { value: 'audit', label: 'Audit' },
  { value: 'review', label: 'Review' },
  { value: 'compilation', label: 'Compilation' },
  { value: 'agreed_upon', label: 'Agreed Upon Procedures' },
];

// ========================================
// ENTITY TYPES (legacy enum)
// ========================================

export const ENTITY_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'trust', label: 'Trust' },
  { value: 'individual', label: 'Individual' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'npo', label: 'Non-Profit' },
];

// ========================================
// TEMPLATE TYPES
// ========================================

export const TEMPLATE_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'tender', label: 'Tender' },
  { value: 'friday', label: 'Friday' },
];

export const TEMPLATE_TARGET_TYPES = [
  { value: 'review', label: 'Review' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'rfi', label: 'RFI' },
];

// ========================================
// FLAG & TAG TYPES
// ========================================

export const FLAG_TYPES = [
  { value: 'review', label: 'Review' },
  { value: 'tender', label: 'Tender' },
  { value: 'rfi', label: 'RFI' },
];

// ========================================
// HIGHLIGHT TYPES
// ========================================

export const HIGHLIGHT_TYPES = [
  { value: 'text', label: 'Text Selection' },
  { value: 'area', label: 'Area Selection' },
];

// ========================================
// COLLABORATOR TYPES
// ========================================

export const COLLABORATOR_TYPES = [
  { value: 'permanent', label: 'Permanent', color: 'green' },
  { value: 'temporary', label: 'Temporary', color: 'yellow' },
];

// ========================================
// MESSAGE SOURCES
// ========================================

export const MESSAGE_SOURCES = [
  { value: 'local', label: 'Local' },
  { value: 'friday', label: 'Friday' },
  { value: 'review', label: 'My Review' },
];

// ========================================
// CLIENT NOTIFICATION TYPES
// ========================================

export const CLIENT_NOTIFICATION_TYPES = [
  { value: 'rfi_response', label: 'RFI Response' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'status_change', label: 'Status Change' },
];

// ========================================
// RFI STATUS (legacy int)
// ========================================

export const RFI_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
];

// ========================================
// SEED DATA
// ========================================

export const SEED_DATA = {
  entity_types: [
    { name: 'Company', description: 'Private or public company' },
    { name: 'Trust', description: 'Family or business trust' },
    { name: 'Individual', description: 'Individual person' },
    { name: 'Partnership', description: 'Business partnership' },
    { name: 'Non-Profit', description: 'Non-profit organization' },
    { name: 'Close Corporation', description: 'Close corporation (CC)' },
    { name: 'Sole Proprietor', description: 'Sole proprietorship' },
  ],
  engagement_types: [
    { key: 'audit', name: 'Audit', description: 'Full audit engagement' },
    { key: 'review', name: 'Review', description: 'Review engagement' },
    { key: 'compilation', name: 'Compilation', description: 'Compilation engagement' },
    { key: 'agreed_upon', name: 'Agreed Upon Procedures', description: 'AUP engagement' },
    { key: 'tax', name: 'Tax Services', description: 'Tax compliance and advisory' },
    { key: 'advisory', name: 'Advisory', description: 'Advisory services' },
  ],
  permissions: [
    { key: 'reviews.create', name: 'Create Reviews', roles: { partner: true, manager: true, clerk: false } },
    { key: 'reviews.delete', name: 'Delete Reviews', roles: { partner: true, manager: false, clerk: false } },
    { key: 'reviews.resolve', name: 'Resolve Highlights', roles: { partner: true, manager: true, clerk: false } },
    { key: 'reviews.flags', name: 'Manage Flags', roles: { partner: true, manager: false, clerk: false } },
    { key: 'reviews.tags', name: 'Manage Tags', roles: { partner: true, manager: true, clerk: false } },
    { key: 'reviews.wip', name: 'Set WIP Value', roles: { partner: true, manager: true, clerk: false } },
    { key: 'reviews.deadline', name: 'Set Deadlines', roles: { partner: true, manager: false, clerk: false } },
    { key: 'reviews.collaborators', name: 'Manage Collaborators', roles: { partner: true, manager: true, clerk: false } },
    { key: 'reviews.checklists.remove', name: 'Remove Checklists', roles: { partner: true, manager: false, clerk: false } },
    { key: 'reviews.attachments.delete', name: 'Delete Attachments', roles: { partner: true, manager: false, clerk: false } },
    { key: 'engagements.create', name: 'Create Engagements', roles: { partner: true, manager: true, clerk: false } },
    { key: 'engagements.delete', name: 'Delete Engagements', roles: { partner: true, manager: false, clerk: false } },
    { key: 'engagements.stage', name: 'Change Stage', roles: { partner: true, manager: true, clerk: false } },
    { key: 'engagements.close', name: 'Close Out', roles: { partner: true, manager: false, clerk: false } },
    { key: 'rfi.status', name: 'Change RFI Status', roles: { partner: true, manager: true, clerk: false } },
    { key: 'settings.manage', name: 'Manage Settings', roles: { partner: true, manager: false, clerk: false } },
    { key: 'users.manage', name: 'Manage Users', roles: { partner: true, manager: false, clerk: false } },
    { key: 'teams.manage', name: 'Manage Teams', roles: { partner: true, manager: false, clerk: false } },
    { key: 'templates.manage', name: 'Manage Templates', roles: { partner: true, manager: false, clerk: false } },
    { key: 'checklists.manage', name: 'Manage Checklists', roles: { partner: true, manager: false, clerk: false } },
  ],
};

// ========================================
// CHILD DEFINITION HELPERS
// ========================================

// Standard children for entities with files/activity/chat
export const withStandardChildren = (entityType, extra = {}) => ({
  files: { entity: 'file', fk: 'entity_id', filter: { entity_type: entityType }, label: 'Files' },
  activity: { entity: 'activity_log', fk: 'entity_id', filter: { entity_type: entityType }, label: 'Activity' },
  chat: { entity: 'chat_message', fk: 'entity_id', filter: { entity_type: entityType }, label: 'Chat', component: 'chat' },
  ...extra,
});

// ========================================
// ACTION FACTORY
// ========================================

const ACTION_TEMPLATES = {
  send_reminder: { label: 'Send Reminder', icon: 'Bell', permission: 'edit' },
  flag: { label: 'Toggle Flag', icon: 'Flag', permission: 'edit' },
  resolve: { label: 'Resolve', icon: 'Check', permission: 'resolve' },
  partial_resolve: { label: 'Partial Resolve', icon: 'CheckCheck', permission: 'partial_resolve' },
  push_to_rfi: { label: 'Push to RFI', icon: 'Send', permission: 'edit' },
  scroll_to: { label: 'Scroll to Page', icon: 'Eye', permission: 'view' },
  add_collaborator: { label: 'Add Collaborator', icon: 'UserPlus', permission: 'manage_collaborators', dialog: 'addCollaborator' },
  add_flag: { label: 'Add Flag', icon: 'Flag', permission: 'add_flags', dialog: 'addFlag' },
  compare: { label: 'Compare PDFs', icon: 'Columns', permission: 'view', dialog: 'comparePdfs' },
  bulk_deadline: { label: 'Set Bulk Deadline', icon: 'Calendar', permission: 'edit', dialog: 'bulkDeadline' },
};

export const action = (key, handler, overrides = {}) => ({
  key,
  handler: handler || key,
  ...ACTION_TEMPLATES[key],
  ...overrides,
});

export const actions = (...keys) => keys.map(k => typeof k === 'string' ? action(k, k) : action(k.key, k.handler, k));

// ========================================
// SPEC FACTORY
// ========================================

// Create a simple embedded spec
export const embeddedSpec = (name, label, icon, fields, extra = {}) => ({
  name,
  label,
  labelPlural: extra.labelPlural || `${label}s`,
  icon,
  embedded: true,
  fields: { id: FIELDS.id, ...fields, created_at: FIELDS.created_at },
  access: extra.access || ACCESS.MANAGER_MANAGE,
  ...extra,
});

// Create a config/lookup spec (entity_type, engagement_type_config, etc.)
export const configSpec = (name, label, icon, extraFields = {}, extra = {}) => ({
  name,
  label,
  labelPlural: extra.labelPlural || `${label}s`,
  icon,
  fields: {
    id: FIELDS.id,
    name: { ...FIELDS.name(), unique: true },
    description: { type: 'textarea', label: 'Description' },
    status: FIELDS.status(),
    sort_order: FIELDS.sort_order,
    created_at: FIELDS.created_at,
    ...extraFields,
  },
  options: { statuses: STATUS.ACTIVE_INACTIVE },
  access: ACCESS.READ_ONLY,
  ...extra,
});
