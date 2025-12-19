import { ROLES, ENGAGEMENT_STAGE } from './constants.js';

export const BUSINESS_RULES = {
  // FRIDAY - Engagement Lifecycle Rules
  engagement: {
    // CloseOut transition rules (CRITICAL)
    closeOutValidation: {
      requiredRole: ROLES.PARTNER,
      requiredFrom: [ENGAGEMENT_STAGE.FINALIZATION],
      requiredConditions: [
        {
          field: 'engagement_letter_id',
          condition: 'must_exist_and_be_accepted',
          description: 'Engagement Letter must exist and status=accepted',
          allowAlternative: {
            field: 'progress',
            condition: 'equals_zero',
            description: 'OR progress must be 0% (cancelled job)',
          },
        },
      ],
      readOnlyAfter: true,
      description: 'Only Partner can transition to CloseOut. Requires letter acceptance OR 0% progress.',
    },

    // Info Gathering auto-transition
    infogatheringAutoTransition: {
      trigger: 'commencement_date_reached',
      fromStage: ENGAGEMENT_STAGE.INFO_GATHERING,
      toStage: ENGAGEMENT_STAGE.COMMENCEMENT,
      automaticOn: 'daily_check',
      description: 'Auto-transition when commencement_date timestamp is reached',
    },

    // Stage backward flexibility
    stageBackwardFlexibility: {
      allowed: [
        {
          from: ENGAGEMENT_STAGE.COMMENCEMENT,
          to: ENGAGEMENT_STAGE.INFO_GATHERING,
          restrictedRole: ROLES.CLERK,
          condition: 'only_if_before_commencement_date',
        },
        {
          from: ENGAGEMENT_STAGE.TEAM_EXECUTION,
          to: ENGAGEMENT_STAGE.COMMENCEMENT,
          allowedRoles: [ROLES.PARTNER, ROLES.MANAGER],
        },
        {
          from: ENGAGEMENT_STAGE.PARTNER_REVIEW,
          to: ENGAGEMENT_STAGE.TEAM_EXECUTION,
          allowedRoles: [ROLES.PARTNER, ROLES.MANAGER],
          reason: 'Partner can send back to TeamExecution to fix queries',
        },
      ],
    },

    // Clerk approval override
    clerkApprovalOverride: {
      field: 'clerksCanApprove',
      description: 'When true, clerk can approve stage transitions within their assigned engagement',
      allowedTransitions: [ENGAGEMENT_STAGE.TEAM_EXECUTION], // Clerk can approve at team execution
      requiresPartnerGate: 'clerksCanApprove field on engagement',
    },

    // Recreation rules
    recreationLocking: {
      afterRecreation: 'set repeat_interval to "once"',
      purpose: 'Prevents infinite loops of automatic recreation',
      originalEngagementBecomes: 'read_only_for_new_rfis',
    },

    recreationDateCalculation: {
      yearly: 'commencement_date + 365 days',
      monthly: 'commencement_date + 30 days',
      daylightSaving: 'Math may be off by 1 day - not accounted for',
    },

    recreationContent: {
      copies: ['all_sections', 'all_rfis'],
      conditionalCopy: {
        field: 'recreate_with_attachments',
        ifTrue: 'copy all files and client responses (Permanent Files)',
      },
      resets: {
        rfi_status: 'waiting',
        rfi_auditor_status: 'requested',
        rfi_client_status: 'pending',
        rfi_date_requested: null,
        rfi_date_resolved: null,
      },
    },
  },

  // RFI Business Logic
  rfi: {
    // Days outstanding calculation
    daysOutstanding: {
      calculation: 'working_days(date_requested, date_resolved || today)',
      exception: 'Zero-out if engagement.stage == "info_gathering"',
      purpose: 'Track aging of open RFIs',
      notification: {
        at_7_days_remaining: 'send_deadline_alert',
        at_3_days_remaining: 'send_deadline_alert',
        at_1_day_remaining: 'send_deadline_alert',
        at_0_days_overdue: 'send_overdue_alert',
      },
    },

    // Client visibility
    clientAccess: {
      rule: 'Client can ONLY view RFIs where rfi.assigned_users.includes(client_cloud_id)',
      enforcement: 'query_layer_filter + row_level_permission',
      scope: 'client_ids array must contain client engagement participant',
    },

    // Post-RFI workflow (distinct from standard)
    postRfiWorkflow: {
      is_post_rfi: true,
      activeStage: ENGAGEMENT_STAGE.FINALIZATION,
      statusOptions: ['pending', 'sent', 'queries', 'accepted'],
      example: 'Signed financial statements sent to client',
      clientCannotInitiate: 'Only auditor can create/manage post-RFIs',
      clientStatuses: {
        view: ['pending', 'queries'],
        respond: ['pending', 'queries'],
        cannot: ['sent', 'accepted'],
      },
    },
  },

  // MWR - Review Management Rules
  review: {
    // Checklist inheritance on creation
    checklistInheritance: {
      trigger: 'review:created',
      source: 'template.default_checklists',
      destination: 'review.sections[]',
      action: 'copy_all_checklists_as_checklist_entities',
      validation: 'template_id must exist if checklists to inherit',
    },

    // Highlight immutability
    highlightImmutability: {
      rule: 'Highlights are NEVER hard-deleted',
      softDelete: {
        action: 'Move to removed_highlights/{reviewId} collection',
        preserves: 'original_highlight_id, created_by, created_at, status, text',
        reason: 'Audit trail - shows review history',
      },
    },

    // Highlight color mapping (from MWR spec)
    highlightColors: {
      grey: { value: '#B0B0B0', meaning: 'Unresolved / Open' },
      green: { value: '#44BBA4', meaning: 'Resolved' },
      red: { value: '#FF4141', meaning: 'Partner/High Priority Note' },
      purple: { value: '#7F7EFF', meaning: 'Scrolled To (active focus)' },
      partnerNote: {
        color: '#FF4141',
        field: 'is_partner_note = true',
        editableBy: [ROLES.PARTNER],
      },
    },

    // Tender review rules
    tenderReviews: {
      marker: 'is_tender = true',
      deadline: 'deadline field (Unix timestamp)',
      sevenDayWarning: 'notification sent 7 days before deadline',
      zeroHourWarning: 'notification sent when deadline reached',
      missedDeadlineFlag: {
        trigger: 'if deadline_date < now and status != closed',
        action: 'auto_apply "missed" to tender_flags array',
        job: 'daily_tender_missed',
      },
    },

    // Collaborator management
    collaborators: {
      permanent: {
        type: 'permanent',
        roles: ['owner', 'reviewer', 'viewer'],
        access: 'indefinite',
        permissions: {
          owner: 'full_control, can_add_remove_others',
          reviewer: 'edit_highlights, respond_to_items',
          viewer: 'read_only',
        },
      },
      temporary: {
        type: 'temporary',
        duration: '24 hours',
        expires_at: 'auto-calculated on add',
        cleanup: 'daily_temp_access_cleanup job removes expired',
        notification: 'removed automatically, no email to user',
      },
    },

    // Permissions matrix
    permissions: {
      create: [ROLES.PARTNER, ROLES.MANAGER],
      addChecklist: [ROLES.PARTNER, ROLES.MANAGER],
      removeChecklist: [ROLES.PARTNER],
      deleteAttachment: [ROLES.PARTNER],
      manageFlags: {
        createTypes: [ROLES.PARTNER],
        apply: [ROLES.PARTNER, ROLES.MANAGER],
        view: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
      },
      resolveHighlight: {
        partner: 'any_highlight',
        manager_clerk: 'own_highlights_only',
        client: 'cannot_resolve',
      },
      manageDeadline: [ROLES.PARTNER],
      archive: [ROLES.PARTNER],
    },
  },

  // Shared Rules
  shared: {
    // User sync (daily)
    userSync: {
      source: 'Google Workspace',
      frequency: 'daily_2am',
      newUsers: {
        created: true,
        defaultRole: ROLES.CLERK,
        defaultStatus: 'active',
        type: 'auditor',
      },
      removedUsers: {
        action: 'set status = inactive',
        notDeleted: 'soft delete only',
      },
    },

    // Email notifications
    notifications: {
      engagement: ['created', 'status_changed', 'stage_changed'],
      rfi: ['deadline_7days', 'deadline_3days', 'deadline_1day', 'deadline_overdue'],
      review: ['created', 'status_changed', 'tender_deadline_7days', 'tender_deadline_today'],
      highlight: ['resolved', 'response_added'],
      flag: ['created', 'assigned', 'status_changed'],
      collaborator: ['added', 'removed_on_expiry'],
      engagement_letter: ['status_changed'],
    },

    // Offline considerations
    offline: {
      friday: {
        cacheStrategy: 'persistence: unlimited',
        banner: 'Limited Functionality shown when offline',
        restrictions: ['cannot_upload_files', 'cannot_generate_letters'],
      },
      mwr: {
        pdfStrategy: 'NetworkOnly (Secure/Large)',
        restriction: 'PDFs cannot be viewed offline',
        appShell: 'StaleWhileRevalidate',
      },
    },
  },
};

export const VALIDATION_GATES = {
  // Engagement CloseOut (CRITICAL - must validate at engine layer)
  engagement_closeout: {
    rule: 'CloseOut transition gate',
    checks: [
      {
        name: 'role_check',
        condition: 'user.role == partner',
        errorMessage: 'Only Partner can transition to CloseOut',
        severity: 'CRITICAL',
      },
      {
        name: 'letter_acceptance_check',
        condition: 'engagement_letter exists AND status == "accepted"',
        errorMessage: 'Engagement Letter must be Accepted',
        severity: 'CRITICAL',
        allowBypass: {
          field: 'progress',
          condition: 'equals_zero',
          reason: 'Cancelled jobs can skip letter acceptance',
        },
      },
      {
        name: 'stage_check',
        condition: 'from stage == finalization',
        errorMessage: 'Can only transition to CloseOut from Finalization',
        severity: 'CRITICAL',
      },
    ],
  },

  // RFI Client Assignment (CRITICAL - must filter at query layer)
  rfi_client_visibility: {
    rule: 'Client users can only view assigned RFIs',
    checks: [
      {
        name: 'client_access_filter',
        condition: 'user.role == client',
        filter: 'rfi.assigned_users.includes(user.cloud_id)',
        errorMessage: 'Client cannot view this RFI',
        severity: 'CRITICAL',
        location: 'query_engine',
      },
    ],
  },

  // Highlight Immutability (CRITICAL - no hard deletes)
  highlight_immutability: {
    rule: 'Highlights never hard-deleted',
    checks: [
      {
        name: 'soft_delete_only',
        condition: 'delete action on highlight',
        action: 'move to removed_highlights collection',
        prevent: 'hard_delete from database',
        severity: 'CRITICAL',
        location: 'query_engine',
      },
    ],
  },

  // Days Outstanding Calculation (IMPORTANT)
  rfi_days_outstanding: {
    rule: 'Days outstanding zeroed during InfoGathering',
    checks: [
      {
        name: 'info_gathering_check',
        condition: 'engagement.stage == info_gathering',
        action: 'days_outstanding = 0',
        reason: 'No urgency during initial information gathering',
        severity: 'IMPORTANT',
        location: 'computed_field',
      },
    ],
  },

  // Review Checklist Inheritance (IMPORTANT)
  review_checklist_copy: {
    rule: 'On review create, copy template checklists',
    checks: [
      {
        name: 'template_exists',
        condition: 'review.template_id exists',
        action: 'copy template.default_checklists[] to new checklist entities',
        severity: 'IMPORTANT',
        location: 'hook:review.create',
      },
    ],
  },
};

export const CASL_GATES = {
  // Role-based access control gates
  canTransitionEngagementToCloseOut: (user, engagement, letter) => {
    return (
      user.role === ROLES.PARTNER &&
      engagement.stage === ENGAGEMENT_STAGE.FINALIZATION &&
      (letter?.status === 'accepted' || engagement.progress === 0)
    );
  },

  canClerkApprove: (user, engagement, action) => {
    return (
      user.role === ROLES.CLERK &&
      engagement.clerksCanApprove === true &&
      action === 'stage_transition'
    );
  },

  canClientViewRfi: (user, rfi, clientIds) => {
    if (user.role !== ROLES.CLIENT) return true; // Non-clients see all they have access to
    const userClientIds = JSON.parse(typeof user.client_access === 'string' ? user.client_access : '[]');
    const rfiClientIds = JSON.parse(typeof clientIds === 'string' ? clientIds : '[]');
    return rfiClientIds.some(cid => userClientIds.includes(cid));
  },

  canDeleteHighlight: (user) => {
    // Only partner can hard-delete (others move to removed_highlights)
    return user.role === ROLES.PARTNER;
  },

  canRemoveCollaborator: (user, review, createdBy) => {
    // Only partner or original adder can remove
    return user.role === ROLES.PARTNER || user.id === createdBy;
  },

  canManageTender: (user) => {
    return user.role === ROLES.PARTNER;
  },

  canRateEngagement: (user, engagement) => {
    // Client can only rate at finalization stage
    return user.role === ROLES.CLIENT && engagement.stage === ENGAGEMENT_STAGE.FINALIZATION;
  },
};
