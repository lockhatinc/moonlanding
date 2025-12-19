import { ROLES } from './constants.js';

export const CASL_MATRIX = {
  // FRIDAY - Engagement Management
  engagement: {
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.AUDITOR],
    stage_transition: {
      // Clerk can transition in info_gathering to team_execution if clerksCanApprove=true
      clerk_with_approval: [ROLES.CLERK],
      manager: [ROLES.MANAGER, ROLES.PARTNER],
      partner_only: {
        close_out: [ROLES.PARTNER], // Only partner can move to close_out
      },
    },
  },

  engagement_letter: {
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.AUDITOR],
    status_change: {
      requested_to_reviewing: [ROLES.PARTNER, ROLES.MANAGER],
      reviewing_to_accepted: [ROLES.PARTNER],
      reviewing_to_rejected: [ROLES.PARTNER],
      rejected_to_requested: [ROLES.PARTNER],
    },
  },

  client: {
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
  },

  rfi: {
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.AUDITOR],
    client_view: {
      // Clients can only view RFIs assigned to them
      assigned_only: [ROLES.CLIENT],
    },
  },

  // MWR - Review Management
  review: {
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.AUDITOR],
    add_checklist: [ROLES.PARTNER, ROLES.MANAGER],
    remove_checklist: [ROLES.PARTNER],
    archive: [ROLES.PARTNER],
    rate_engagement: {
      finalization_only: [ROLES.CLIENT], // Client can rate at finalization stage
    },
  },

  highlight: {
    create: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.AUDITOR],
    edit: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    delete: [ROLES.PARTNER], // Never hard-delete - soft delete to removedHighlights
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.AUDITOR],
    resolve: {
      any_role: [ROLES.PARTNER], // Partner can resolve any
      own_only: [ROLES.MANAGER, ROLES.CLERK], // Manager/Clerk can resolve only their own
    },
  },

  flag: {
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    apply: [ROLES.PARTNER, ROLES.MANAGER],
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
    manage_types: [ROLES.PARTNER], // Create/edit flag types
  },

  collaborator: {
    add: [ROLES.PARTNER],
    remove: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
    permanent: [ROLES.PARTNER, ROLES.MANAGER],
    temporary: {
      add: [ROLES.PARTNER],
      max_duration: '24h',
    },
  },

  attachment: {
    create: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.AUDITOR],
    delete: [ROLES.PARTNER], // Only partner can delete
    view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK, ROLES.AUDITOR],
  },

  // User Management
  user: {
    create: [ROLES.PARTNER],
    edit: [ROLES.PARTNER],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
    manage_roles: [ROLES.PARTNER],
    manage_status: [ROLES.PARTNER],
  },

  client_user: {
    create: [ROLES.PARTNER, ROLES.MANAGER],
    edit: [ROLES.PARTNER, ROLES.MANAGER],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
  },

  // Settings & Configuration
  settings: {
    view: [ROLES.PARTNER],
    edit: [ROLES.PARTNER],
  },

  team: {
    create: [ROLES.PARTNER],
    edit: [ROLES.PARTNER],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
  },

  template: {
    create: [ROLES.PARTNER],
    edit: [ROLES.PARTNER],
    delete: [ROLES.PARTNER],
    view: [ROLES.PARTNER, ROLES.MANAGER],
    set_default: [ROLES.PARTNER],
  },
};

export const FIELD_LEVEL_PERMISSIONS = {
  engagement: {
    stage: {
      view: 'all',
      edit: {
        info_gathering: ['partner', 'manager'],
        commencement: ['partner', 'manager'],
        team_execution: ['partner', 'manager', 'clerk'],
        partner_review: ['partner', 'manager'],
        finalization: ['partner', 'manager'],
        close_out: ['partner'], // Partner-only
      },
    },
    progress: {
      view: 'all',
      edit: ['partner', 'manager', 'clerk'],
    },
    repeat_interval: {
      view: ['partner', 'manager'],
      edit: ['partner'],
    },
    clerksCanApprove: {
      view: ['partner'],
      edit: ['partner'],
    },
  },

  review: {
    deadline: {
      view: 'all',
      edit: ['partner'],
    },
    is_tender: {
      view: 'all',
      edit: ['partner', 'manager'],
    },
    template_id: {
      view: 'all',
      edit: ['partner', 'manager'],
    },
  },

  highlight: {
    is_partner_note: {
      view: 'all',
      edit: ['partner'],
    },
    severity: {
      view: 'all',
      edit: ['partner', 'manager'],
    },
    resolved_by: {
      view: 'all',
      edit: [],
    },
  },

  rfi: {
    post_rfi_status: {
      view: 'all',
      edit: ['partner', 'manager'],
    },
    assigned_users: {
      view: 'all',
      edit: ['partner', 'manager'],
    },
  },
};

export const ROW_LEVEL_PERMISSIONS = {
  engagement: {
    // Auditors see: assigned to them OR their team
    auditor_scope: 'assigned_or_team',
  },

  rfi: {
    // Clients see: only RFIs where rfi.users includes their cloud_id
    client_scope: 'assigned_users_only',
    // Auditors see: all RFIs for their engagements
    auditor_scope: 'engagement_scope',
  },

  review: {
    // All roles see reviews for their engagements
    scope: 'engagement_scope',
  },

  highlight: {
    // All roles see highlights for reviews they can access
    scope: 'review_scope',
  },

  collaborator: {
    // Only owner/temporary creator can manage
    scope: 'review_scope',
  },
};
