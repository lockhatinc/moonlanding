// Database Triggers - Business logic hooks for entity operations
// These implement the business rules from MWR and Friday systems

import { list, get, update, create, remove, count, getBy } from '../engine';
import { sendNotification, queueEmail } from './email-templates';

// === ENGAGEMENT TRIGGERS ===

/**
 * Trigger: After engagement is created
 * From Friday: engagementCreate
 * - Update client engagement count
 * - Send initial emails based on stage
 * - Log activity
 */
export async function onEngagementCreate(engagement, user) {
  // Update client engagement count
  if (engagement.client_id) {
    const client = get('client', engagement.client_id);
    if (client) {
      const engagementCount = count('engagement', { client_id: engagement.client_id });
      update('client', engagement.client_id, { engagement_count: engagementCount });
    }
  }

  // Send emails based on stage
  if (engagement.stage === 'info_gathering') {
    // Send engagement info gathering email to client users
    await queueEmail('engagement_info_gathering', {
      engagement,
      recipients: 'client_users',
    });
  }

  // Log activity
  create('activity_log', {
    entity_type: 'engagement',
    entity_id: engagement.id,
    action: 'create',
    message: `Engagement "${engagement.name}" created`,
    user_email: user?.email,
  }, user);
}

/**
 * Trigger: After engagement is updated
 * From Friday: engagementUpdate
 * - Handle stage changes (auto-transition, notifications)
 * - Handle status changes
 * - Handle date changes
 * - Send notifications
 */
export async function onEngagementUpdate(engagement, changes, previousData, user) {
  const notifications = [];

  // Stage change handling
  if (changes.stage && changes.stage !== previousData.stage) {
    // Log stage change
    create('activity_log', {
      entity_type: 'engagement',
      entity_id: engagement.id,
      action: 'stage_change',
      message: `Stage changed from ${previousData.stage} to ${changes.stage}`,
      details: JSON.stringify({ from: previousData.stage, to: changes.stage }),
      user_email: user?.email,
    }, user);

    // Stage-specific actions
    switch (changes.stage) {
      case 'commencement':
        // Send engagement letter notifications
        await queueEmail('engagement_commencement', { engagement, recipients: 'client_users' });
        break;
      case 'finalization':
        // Enable client rating, send completion notification
        await queueEmail('engagement_finalization', { engagement, recipients: 'client_admin' });
        break;
      case 'close_out':
        // Validate close-out requirements
        if (engagement.letter_auditor_status !== 'accepted' && engagement.progress > 0) {
          throw new Error('Cannot close out: Letter must be accepted or progress must be 0%');
        }
        break;
    }
  }

  // Status change handling
  if (changes.status && changes.status !== previousData.status) {
    create('activity_log', {
      entity_type: 'engagement',
      entity_id: engagement.id,
      action: 'status_change',
      message: `Status changed from ${previousData.status} to ${changes.status}`,
      user_email: user?.email,
    }, user);
  }

  // Date change notifications
  if (changes.commencement_date && changes.commencement_date !== previousData.commencement_date) {
    await queueEmail('engagement_date_change', {
      engagement,
      field: 'commencement_date',
      recipients: 'team_members',
    });
  }
}

/**
 * Trigger: After engagement is deleted
 * From Friday: engagementDelete
 * - Decrement client engagement count
 */
export async function onEngagementDelete(engagement, user) {
  if (engagement.client_id) {
    const engagementCount = count('engagement', { client_id: engagement.client_id });
    update('client', engagement.client_id, { engagement_count: engagementCount });
  }
}

// === CLIENT TRIGGERS ===

/**
 * Trigger: After client is updated
 * From Friday: clientInactiveUpdate
 * - When client becomes inactive:
 *   - Set all engagements repeat_interval to 'once'
 *   - Delete 0% InfoGathering engagements
 */
export async function onClientUpdate(client, changes, previousData, user) {
  if (changes.status === 'inactive' && previousData.status !== 'inactive') {
    // Get all engagements for this client
    const engagements = list('engagement', { client_id: client.id });

    for (const engagement of engagements) {
      // Set repeat_interval to 'once'
      if (engagement.repeat_interval !== 'once') {
        update('engagement', engagement.id, { repeat_interval: 'once' });
      }

      // Delete 0% InfoGathering engagements
      if (engagement.stage === 'info_gathering' && engagement.progress === 0) {
        remove('engagement', engagement.id);
      }
    }

    create('activity_log', {
      entity_type: 'client',
      entity_id: client.id,
      action: 'status_change',
      message: `Client set to inactive. Updated ${engagements.length} engagements.`,
      user_email: user?.email,
    }, user);
  }
}

// === RFI TRIGGERS ===

/**
 * Trigger: After RFI is updated
 * From Friday: rfiUpdateMonitor
 * - Create notifications on status/deadline changes
 * - Calculate days outstanding
 * - Update engagement progress
 */
export async function onRfiUpdate(rfi, changes, previousData, user) {
  // Status change notification
  if (changes.status !== undefined && changes.status !== previousData.status) {
    // If completed, set date_resolved
    if (changes.status === 1 && !rfi.date_resolved) {
      update('rfi', rfi.id, { date_resolved: Math.floor(Date.now() / 1000) });
    }

    // Create notification for client status changes
    if (changes.client_status && changes.client_status !== previousData.client_status) {
      await queueEmail('rfi_status_change', {
        rfi,
        from: previousData.client_status,
        to: changes.client_status,
        recipients: 'assigned_users',
      });
    }

    create('activity_log', {
      entity_type: 'rfi',
      entity_id: rfi.id,
      action: 'status_change',
      message: `Status changed from ${previousData.status} to ${changes.status}`,
      user_email: user?.email,
    }, user);
  }

  // Deadline change notification
  if (changes.deadline && changes.deadline !== previousData.deadline) {
    await queueEmail('rfi_deadline_change', {
      rfi,
      newDeadline: changes.deadline,
      recipients: 'assigned_users',
    });

    create('activity_log', {
      entity_type: 'rfi',
      entity_id: rfi.id,
      action: 'update',
      message: `Deadline changed to ${new Date(changes.deadline * 1000).toLocaleDateString()}`,
      user_email: user?.email,
    }, user);
  }

  // Update engagement progress when RFI status changes
  if (changes.status !== undefined || changes.client_status !== undefined) {
    await updateEngagementProgress(rfi.engagement_id);
  }
}

/**
 * Calculate and update engagement progress based on RFI completion
 */
async function updateEngagementProgress(engagementId) {
  const rfis = list('rfi', { engagement_id: engagementId });
  if (rfis.length === 0) return;

  const completedRfis = rfis.filter(r => r.status === 1 || r.client_status === 'completed');
  const progress = Math.round((completedRfis.length / rfis.length) * 100);

  update('engagement', engagementId, { progress });
}

/**
 * Calculate working days between two dates
 * From Friday: calculateWorkingDays
 */
export function calculateWorkingDays(startTimestamp, endTimestamp) {
  if (!startTimestamp) return 0;
  const start = new Date(startTimestamp * 1000);
  const end = endTimestamp ? new Date(endTimestamp * 1000) : new Date();

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

// === TEAM TRIGGERS ===

/**
 * Trigger: After team is updated
 * From Friday: teamUsersUpdateMonitor
 * - When users are removed from team, remove from team's engagements
 */
export async function onTeamUpdate(team, changes, previousData, user) {
  if (changes.users && previousData.users) {
    const prevUsers = JSON.parse(previousData.users || '[]');
    const newUsers = JSON.parse(changes.users || '[]');
    const removedUsers = prevUsers.filter(u => !newUsers.includes(u));

    if (removedUsers.length > 0) {
      // Get all engagements for this team
      const engagements = list('engagement', { team_id: team.id });

      for (const engagement of engagements) {
        const engagementUsers = JSON.parse(engagement.users || '[]');
        const updatedUsers = engagementUsers.filter(u => !removedUsers.includes(u));

        if (updatedUsers.length !== engagementUsers.length) {
          update('engagement', engagement.id, { users: JSON.stringify(updatedUsers) });
        }
      }
    }
  }
}

// === REVIEW TRIGGERS (MWR) ===

/**
 * Trigger: After review is created
 * From MWR: newReviewerTriggerNotification
 * - Email team partners on new review
 * - Initialize checklists from template
 */
export async function onReviewCreate(review, user) {
  // Email team partners
  await queueEmail('review_created', {
    review,
    recipients: 'team_partners',
  });

  // Initialize default checklists from template if template has them
  if (review.template_id) {
    const template = get('template', review.template_id);
    if (template?.default_checklists) {
      const checklistIds = JSON.parse(template.default_checklists || '[]');
      for (const checklistId of checklistIds) {
        const checklist = get('checklist', checklistId);
        if (checklist) {
          create('review_checklist', {
            review_id: review.id,
            checklist_id: checklistId,
            items: checklist.section_items || checklist.items,
            status: 'pending',
          }, user);
        }
      }
    }
  }

  // Log activity
  create('activity_log', {
    entity_type: 'review',
    entity_id: review.id,
    action: 'create',
    message: `Review "${review.name}" created`,
    user_email: user?.email,
  }, user);
}

/**
 * Trigger: After review is updated
 * From MWR: updatedReviewTriggerNotification
 * - Archive removed highlights
 * - Notify on status/collaborator changes
 */
export async function onReviewUpdate(review, changes, previousData, user) {
  // Status change notifications
  if (changes.status && changes.status !== previousData.status) {
    await queueEmail('review_status_change', {
      review,
      from: previousData.status,
      to: changes.status,
      recipients: 'team_members',
    });

    create('activity_log', {
      entity_type: 'review',
      entity_id: review.id,
      action: 'status_change',
      message: `Status changed from ${previousData.status} to ${changes.status}`,
      user_email: user?.email,
    }, user);
  }

  // Collaborator changes
  if (changes.collaborators && changes.collaborators !== previousData.collaborators) {
    const prevCollabs = JSON.parse(previousData.collaborators || '[]');
    const newCollabs = JSON.parse(changes.collaborators || '[]');

    // Find newly added collaborators
    const addedCollabs = newCollabs.filter(c => !prevCollabs.find(p => p.id === c.id));

    for (const collab of addedCollabs) {
      await queueEmail('collaborator_added', {
        review,
        collaborator: collab,
        recipients: 'collaborator',
      });
    }
  }
}

// === HIGHLIGHT TRIGGERS ===

/**
 * Trigger: Before highlight is deleted
 * From MWR: Highlights are NEVER deleted, only archived
 * - Archive to removed_highlights instead of deleting
 */
export async function onHighlightDelete(highlight, user) {
  // Archive the highlight instead of deleting
  create('removed_highlight', {
    review_id: highlight.review_id,
    original_id: highlight.id,
    highlight_data: JSON.stringify(highlight),
  }, user);

  // Note: The actual delete will proceed after this
  // The spec has softDelete: { archive: true } which handles this
}

/**
 * Trigger: After highlight is resolved
 */
export async function onHighlightResolve(highlight, user, isPartial = false) {
  const field = isPartial ? 'partial_resolved' : 'resolved';
  const byField = isPartial ? 'partial_resolved_by' : 'resolved_by';
  const atField = isPartial ? 'partial_resolved_at' : 'resolved_at';

  update('highlight', highlight.id, {
    [field]: true,
    [byField]: user.id,
    [atField]: Math.floor(Date.now() / 1000),
    color: '#44BBA4', // Resolved color
  });

  create('activity_log', {
    entity_type: 'highlight',
    entity_id: highlight.id,
    action: 'resolve',
    message: `Highlight ${isPartial ? 'partially ' : ''}resolved`,
    user_email: user?.email,
  }, user);
}

// === COLLABORATOR TRIGGERS ===

/**
 * Trigger: After collaborator is added
 * From MWR: Send notification to collaborator
 */
export async function onCollaboratorCreate(collaborator, user) {
  const review = get('review', collaborator.review_id);
  const collaboratorUser = get('user', collaborator.user_id);

  if (review && collaboratorUser) {
    await queueEmail('collaborator_added', {
      review,
      collaborator: collaboratorUser,
      type: collaborator.type,
      expiresAt: collaborator.expires_at,
      recipients: 'collaborator',
    });
  }
}

// === STAGE TRANSITION VALIDATION ===

/**
 * Validate stage transition for engagement
 * From Friday: Stage transition rules
 */
export function validateStageTransition(engagement, newStage, user) {
  const stageOrder = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'];
  const currentIndex = stageOrder.indexOf(engagement.stage);
  const newIndex = stageOrder.indexOf(newStage);

  // Check if user role allows stage change
  if (!['partner', 'manager'].includes(user.role)) {
    throw new Error('Only partners and managers can change engagement stage');
  }

  // Clerks cannot change stage at all
  if (user.role === 'clerk') {
    throw new Error('Clerks cannot change engagement stage');
  }

  // Cannot change stage if engagement is pending
  if (engagement.status === 'pending') {
    throw new Error('Cannot change stage while engagement is pending');
  }

  // Close out requires partner
  if (newStage === 'close_out' && user.role !== 'partner') {
    throw new Error('Only partners can close out engagements');
  }

  // Close out validation
  if (newStage === 'close_out') {
    if (engagement.letter_auditor_status !== 'accepted' && engagement.progress > 0) {
      throw new Error('Cannot close out: Letter must be accepted or progress must be 0%');
    }
  }

  // Backward transitions allowed only for specific stages
  if (newIndex < currentIndex) {
    const allowedBackward = {
      'team_execution': ['commencement'],
      'partner_review': ['team_execution'],
    };

    if (!allowedBackward[engagement.stage]?.includes(newStage)) {
      throw new Error(`Cannot go backward from ${engagement.stage} to ${newStage}`);
    }
  }

  return true;
}

/**
 * Check if engagement should auto-transition
 * From Friday: Auto-transition when commencement_date is reached
 */
export function checkAutoTransition(engagement) {
  if (engagement.stage === 'info_gathering' && engagement.commencement_date) {
    const now = Math.floor(Date.now() / 1000);
    if (engagement.commencement_date <= now) {
      return 'commencement';
    }
  }
  return null;
}

// === RFI STATUS VALIDATION ===

/**
 * Validate RFI status change
 * From Friday: Status change rules
 */
export function validateRfiStatusChange(rfi, newStatus, user) {
  // Only auditors (not clerks) can change status
  if (user.type !== 'auditor' || user.role === 'clerk') {
    const engagement = get('engagement', rfi.engagement_id);
    // Unless clerks_can_approve is enabled
    if (!engagement?.clerks_can_approve) {
      throw new Error('Only auditors (not clerks) can change RFI status');
    }
  }

  // If marking as completed (status=1), requires files OR responses
  if (newStatus === 1) {
    const hasFiles = rfi.files_count > 0 || (rfi.files && JSON.parse(rfi.files || '[]').length > 0);
    const hasResponses = rfi.response_count > 0 || (rfi.responses && JSON.parse(rfi.responses || '[]').length > 0);

    if (!hasFiles && !hasResponses) {
      throw new Error('RFI must have files or responses before marking as completed');
    }
  }

  return true;
}

// === MAIN TRIGGER DISPATCHER ===

/**
 * Call trigger hooks for entity operations
 */
export const triggers = {
  engagement: {
    afterCreate: onEngagementCreate,
    afterUpdate: onEngagementUpdate,
    afterDelete: onEngagementDelete,
  },
  client: {
    afterUpdate: onClientUpdate,
  },
  rfi: {
    afterUpdate: onRfiUpdate,
  },
  team: {
    afterUpdate: onTeamUpdate,
  },
  review: {
    afterCreate: onReviewCreate,
    afterUpdate: onReviewUpdate,
  },
  highlight: {
    beforeDelete: onHighlightDelete,
  },
  collaborator: {
    afterCreate: onCollaboratorCreate,
  },
};

/**
 * Execute trigger for an entity operation
 */
export async function executeTrigger(entityName, operation, ...args) {
  const entityTriggers = triggers[entityName];
  if (!entityTriggers) return;

  const hook = entityTriggers[operation];
  if (!hook) return;

  try {
    await hook(...args);
  } catch (error) {
    console.error(`Trigger error [${entityName}.${operation}]:`, error.message);
    // Re-throw validation errors
    if (error.message.includes('Cannot') || error.message.includes('Only')) {
      throw error;
    }
  }
}
