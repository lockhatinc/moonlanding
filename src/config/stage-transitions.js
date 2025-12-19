import { ROLES, ENGAGEMENT_STAGE } from './constants.js';

/**
 * FRIDAY Engagement Stage Transition Matrix
 * Defines all allowed stage transitions with role requirements and validation gates
 */

export const STAGE_TRANSITIONS_MATRIX = {
  // INFO_GATHERING → COMMENCEMENT
  [ENGAGEMENT_STAGE.INFO_GATHERING]: {
    // Manual transition
    [ENGAGEMENT_STAGE.COMMENCEMENT]: {
      allowedRoles: [ROLES.PARTNER, ROLES.MANAGER],
      validation: {
        beforeDateCheck: {
          rule: 'cannot_set_info_gathering_after_commencement_date',
          condition: 'currentDate < commencement_date',
          errorMessage: 'Cannot set InfoGathering if current date > commencement_date',
          checkAtTransition: true,
        },
      },
      requiresApproval: false,
      notes: 'Manual move OR automatic via daily_engagement_check when commencement_date reached',
    },

    // Auto-transition (no manual action needed)
    autoTransition: {
      to: ENGAGEMENT_STAGE.COMMENCEMENT,
      trigger: 'commencement_date_reached',
      job: 'daily_engagement_check',
      frequency: 'daily',
      requiresApproval: false,
      notes: 'Happens automatically when epoch timestamp passed',
    },

    backwardAllowed: false,
  },

  // COMMENCEMENT
  [ENGAGEMENT_STAGE.COMMENCEMENT]: {
    // Forward: COMMENCEMENT → TEAM_EXECUTION
    [ENGAGEMENT_STAGE.TEAM_EXECUTION]: {
      allowedRoles: [ROLES.PARTNER, ROLES.MANAGER],
      validation: {
        engagementLetter: {
          rule: 'letter_should_be_initiated',
          description: 'Engagement Letter workflow should be active at this stage',
          required: false,
          notes: 'Not strictly required, but expected by business',
        },
      },
      requiresApproval: false,
      notes: 'Marks end of initial information gathering phase',
    },

    // Backward: COMMENCEMENT → INFO_GATHERING (restricted)
    [ENGAGEMENT_STAGE.INFO_GATHERING]: {
      allowedRoles: [],
      validation: {
        restrictedByDate: {
          rule: 'cannot_go_back_after_date_passed',
          condition: 'currentDate <= commencement_date',
          errorMessage: 'Cannot revert to InfoGathering once commencement_date passed',
          severity: 'BLOCK',
        },
      },
      requiresApproval: false,
      notes: 'Backward not typically allowed unless date not yet reached',
    },

    backwardAllowed: {
      to: ENGAGEMENT_STAGE.INFO_GATHERING,
      condition: 'Only if commencement_date not yet reached',
      roles: [],
    },
  },

  // TEAM_EXECUTION
  [ENGAGEMENT_STAGE.TEAM_EXECUTION]: {
    // Forward: TEAM_EXECUTION → PARTNER_REVIEW
    [ENGAGEMENT_STAGE.PARTNER_REVIEW]: {
      allowedRoles: [ROLES.PARTNER, ROLES.MANAGER, ROLES.CLERK],
      validation: {
        teamWorkCompleted: {
          rule: 'rfi_responses_expected',
          description: 'Team should have completed RFI responses',
          required: false,
        },
      },
      clerkApprovalOverride: {
        enabled: true,
        condition: 'if engagement.clerksCanApprove == true',
        roles: [ROLES.CLERK],
        notes: 'Clerk can approve if explicitly enabled on engagement',
      },
      requiresApproval: false,
      notes: 'Marks end of fieldwork/RFI phase',
    },

    // Backward: TEAM_EXECUTION → COMMENCEMENT (flexible)
    [ENGAGEMENT_STAGE.COMMENCEMENT]: {
      allowedRoles: [ROLES.PARTNER, ROLES.MANAGER],
      validation: {
        noDateRestriction: {
          rule: 'can_always_go_back',
          description: 'No date restriction on going back',
        },
      },
      requiresApproval: false,
      notes: 'Allows fixing things if needed before formal review',
    },

    backwardAllowed: {
      to: ENGAGEMENT_STAGE.COMMENCEMENT,
      roles: [ROLES.PARTNER, ROLES.MANAGER],
    },
  },

  // PARTNER_REVIEW
  [ENGAGEMENT_STAGE.PARTNER_REVIEW]: {
    // Forward: PARTNER_REVIEW → FINALIZATION
    [ENGAGEMENT_STAGE.FINALIZATION]: {
      allowedRoles: [ROLES.PARTNER, ROLES.MANAGER],
      validation: {
        workPapersReviewed: {
          rule: 'partner_review_complete',
          description: 'Partner should have reviewed work papers',
          required: false,
        },
      },
      requiresApproval: false,
      notes: 'Marks readiness for client feedback and final signing',
    },

    // Backward: PARTNER_REVIEW → TEAM_EXECUTION (flexible)
    [ENGAGEMENT_STAGE.TEAM_EXECUTION]: {
      allowedRoles: [ROLES.PARTNER, ROLES.MANAGER],
      validation: {
        noRestriction: {
          rule: 'can_send_back_for_fixes',
          description: 'Partner can send back to fix queries',
        },
      },
      requiresApproval: false,
      notes: 'Allows returning to team if issues found during review',
    },

    backwardAllowed: {
      to: ENGAGEMENT_STAGE.TEAM_EXECUTION,
      roles: [ROLES.PARTNER, ROLES.MANAGER],
    },
  },

  // FINALIZATION
  [ENGAGEMENT_STAGE.FINALIZATION]: {
    // Forward: FINALIZATION → CLOSE_OUT (CRITICAL GATE)
    [ENGAGEMENT_STAGE.CLOSE_OUT]: {
      allowedRoles: [ROLES.PARTNER], // PARTNER ONLY
      validation: {
        partnerOnly: {
          rule: 'exclusive_partner_action',
          condition: 'user.role == partner',
          errorMessage: 'Only Partner can transition to CloseOut',
          severity: 'CRITICAL',
        },
        letterAcceptance: {
          rule: 'letter_acceptance_or_zero_progress',
          condition: '(letter exists AND letter.status == "accepted") OR engagement.progress == 0',
          errorMessage: 'Engagement Letter must be Accepted OR Progress = 0% (cancelled job)',
          severity: 'CRITICAL',
        },
      },
      clientFeedbackPhase: {
        enabled: true,
        during: ENGAGEMENT_STAGE.FINALIZATION,
        action: 'Client can rate engagement (0-5 stars)',
        canRate: ['client_admin'],
      },
      postRfiWorkflow: {
        enabled: true,
        description: 'Post-RFI (signed financials) workflow active',
        rfiType: 'is_post_rfi = true',
      },
      requiresApproval: false,
      notes: 'CRITICAL: Only Partner can move to CloseOut with strict validations',
    },

    // Backward: FINALIZATION → PARTNER_REVIEW (rare)
    backwardAllowed: {
      to: ENGAGEMENT_STAGE.PARTNER_REVIEW,
      roles: [ROLES.PARTNER, ROLES.MANAGER],
      notes: 'Rarely used, only if additional partner review needed',
    },
  },

  // CLOSE_OUT (final state)
  [ENGAGEMENT_STAGE.CLOSE_OUT]: {
    readOnly: true,
    backwardAllowed: false,
    description: 'Final state - engagement is archived',
    validation: {
      noTransitionsOut: {
        rule: 'terminal_state',
        description: 'Cannot transition from CloseOut to any other stage',
      },
    },
  },
};

/**
 * Helper function to check if transition is allowed
 */
export function isTransitionAllowed(engagement, toStage, user) {
  const fromStage = engagement.stage;
  const transitions = STAGE_TRANSITIONS_MATRIX[fromStage];

  if (!transitions) {
    return {
      allowed: false,
      reason: `Invalid stage: ${fromStage}`,
    };
  }

  if (transitions.readOnly) {
    return {
      allowed: false,
      reason: `${fromStage} is a terminal state - no transitions allowed`,
    };
  }

  const transition = transitions[toStage];

  if (!transition) {
    // Check if backward allowed
    if (transitions.backwardAllowed) {
      const allowed = transitions.backwardAllowed;
      if (allowed.to === toStage) {
        const allowed_roles = allowed.roles || [];
        if (!allowed_roles.includes(user.role)) {
          return {
            allowed: false,
            reason: `Only ${allowed_roles.join(',')} can transition backward to ${toStage}`,
          };
        }
        return { allowed: true, reason: 'Backward transition allowed' };
      }
    }
    return {
      allowed: false,
      reason: `Cannot transition from ${fromStage} to ${toStage}`,
    };
  }

  // Check role permissions
  if (transition.allowedRoles && transition.allowedRoles.length > 0) {
    if (!transition.allowedRoles.includes(user.role)) {
      // Check for clerk approval override
      if (
        transition.clerkApprovalOverride?.enabled &&
        user.role === ROLES.CLERK &&
        engagement.clerksCanApprove === true
      ) {
        // Clerk can proceed if override enabled
        return { allowed: true, reason: 'Clerk approval override enabled' };
      }
      return {
        allowed: false,
        reason: `Role ${user.role} cannot transition to ${toStage}. Allowed: ${transition.allowedRoles.join(',')}`,
      };
    }
  }

  // Run validation gates
  if (transition.validation) {
    for (const [validationName, validationRule] of Object.entries(transition.validation)) {
      // Run custom validation logic here
      // For now, just note that validation should be performed
    }
  }

  return {
    allowed: true,
    reason: 'Transition allowed',
    notes: transition.notes,
  };
}

/**
 * Get all allowed next stages from current stage
 */
export function getAllowedNextStages(engagement, user) {
  const fromStage = engagement.stage;
  const transitions = STAGE_TRANSITIONS_MATRIX[fromStage];

  if (!transitions) return [];

  const allowed = [];

  // Check forward transitions
  for (const [toStage, transition] of Object.entries(transitions)) {
    if (toStage === 'autoTransition' || toStage === 'backwardAllowed' || toStage === 'readOnly') {
      continue;
    }

    if (!transition.allowedRoles || transition.allowedRoles.includes(user.role)) {
      allowed.push(toStage);
    }
  }

  // Check backward transitions
  if (transitions.backwardAllowed) {
    const allowed_roles = transitions.backwardAllowed.roles || [];
    if (allowed_roles.includes(user.role)) {
      allowed.push(transitions.backwardAllowed.to);
    }
  }

  return allowed;
}
