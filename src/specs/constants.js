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

  // Timestamps
  created_at: { type: 'timestamp', auto: 'now', readOnly: true },
  updated_at: { type: 'timestamp', auto: 'update', readOnly: true },

  // Audit fields
  created_by: (opts = {}) => ({
    type: 'ref', ref: 'user', auto: 'user', readOnly: true,
    label: opts.label || 'Created By',
    ...opts
  }),

  // Entity reference (polymorphic)
  entity_type: { type: 'text', required: true },
  entity_id: { type: 'text', required: true },

  // Status with options
  status: (options = 'statuses', defaultVal = 'active') => ({
    type: 'enum', label: 'Status', options, list: true, default: defaultVal,
  }),

  // Name field (searchable)
  name: (opts = {}) => ({
    type: 'text', label: 'Name', required: true, list: true, sortable: true, search: true,
    ...opts,
  }),

  // Email field
  email: (opts = {}) => ({
    type: 'email', label: 'Email', list: true, search: true,
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
