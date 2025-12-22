export const ENTITY_OPERATIONS = {
  recreation: {
    deepCopyFields: [
      'title',
      'description',
      'client_id',
      'start_date',
      'end_date',
      'status',
      'stage',
      'assigned_to',
      'attachments',
      'metadata',
    ],
    excludeFields: [
      'id',
      'created_at',
      'updated_at',
      'created_by',
      'resolved_at',
      'resolved_by',
    ],
  },

  emailEvents: {
    'engagement.created': {
      template: 'engagement_info_gathering',
      recipients: 'client_users',
      async: true,
    },
    'engagement.stage_changed': {
      template: 'stage_transition_notification',
      recipients: 'assigned_team',
      async: true,
    },
    'review.completed': {
      template: 'review_completion_notice',
      recipients: 'engagement_assigned',
      async: true,
    },
    'highlight.created': {
      template: 'highlight_added_notification',
      recipients: 'review_assigned',
      async: false,
    },
    'rfi.created': {
      template: 'rfi_request_notification',
      recipients: 'client_users',
      async: true,
    },
  },

  entityTypes: [
    'engagement',
    'review',
    'highlight',
    'response',
    'message',
    'rfi',
    'checklist',
    'user',
  ],

  workflowStages: {
    engagement: [
      'planning',
      'team_execution',
      'client_intake',
      'review_and_finalization',
      'closed',
    ],
    review: [
      'draft',
      'in_progress',
      'completed',
    ],
  },

  statusTransitions: {
    engagement: {
      pending: ['active', 'cancelled'],
      active: ['pending', 'completed', 'cancelled'],
      completed: ['pending', 'cancelled'],
      cancelled: ['pending'],
    },
    review: {
      draft: ['in_progress', 'cancelled'],
      in_progress: ['draft', 'completed'],
      completed: ['draft'],
    },
    highlight: {
      pending: ['resolved', 'rejected'],
      resolved: ['pending'],
      rejected: ['pending'],
    },
  },

  allowedFieldUpdates: {
    engagement: {
      planning: ['assigned_to', 'description'],
      team_execution: ['progress', 'assigned_to'],
      client_intake: ['status'],
      review_and_finalization: ['status'],
      closed: [],
    },
  },
};

export function getEmailEventTemplate(eventName) {
  return ENTITY_OPERATIONS.emailEvents[eventName];
}

export function canTransitionStage(entityType, fromStage, toStage) {
  const stages = ENTITY_OPERATIONS.workflowStages[entityType];
  if (!stages) return false;
  const fromIndex = stages.indexOf(fromStage);
  const toIndex = stages.indexOf(toStage);
  return fromIndex >= 0 && toIndex > fromIndex;
}

export function canTransitionStatus(entityType, fromStatus, toStatus) {
  const transitions = ENTITY_OPERATIONS.statusTransitions[entityType];
  if (!transitions || !transitions[fromStatus]) return false;
  return transitions[fromStatus].includes(toStatus);
}

export function canUpdateField(entityType, stage, field) {
  const allowed = ENTITY_OPERATIONS.allowedFieldUpdates[entityType]?.[stage];
  return allowed ? allowed.includes(field) : true;
}

export function getRecreationFields(entityType = 'engagement') {
  return ENTITY_OPERATIONS.recreation.deepCopyFields;
}

export function getExcludedFields(entityType = 'engagement') {
  return ENTITY_OPERATIONS.recreation.excludeFields;
}
