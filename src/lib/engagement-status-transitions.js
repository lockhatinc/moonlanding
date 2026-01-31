import { getConfigEngine } from '@/lib/config-generator-engine';

const config = getConfigEngine();

const STATUS_TRANSITIONS = {
  client_status: {
    pending: ['in_progress'],
    in_progress: ['responded', 'pending'],
    responded: ['completed', 'in_progress'],
    completed: []
  },
  letter_client_status: {
    pending: ['received', 'cancelled'],
    received: ['accepted', 'cancelled'],
    accepted: [],
    cancelled: []
  },
  letter_auditor_status: {
    pending: ['draft'],
    draft: ['sent'],
    sent: ['accepted', 'cancelled'],
    accepted: [],
    cancelled: []
  },
  post_rfi_client_status: {
    pending: ['received'],
    received: ['accepted', 'rejected'],
    accepted: [],
    rejected: ['received']
  },
  post_rfi_auditor_status: {
    pending: ['issued'],
    issued: ['under_review', 'cancelled'],
    under_review: ['accepted', 'needs_revision'],
    accepted: [],
    needs_revision: ['issued'],
    cancelled: []
  },
  auditor_status: {
    requested: ['in_progress'],
    in_progress: ['under_partner_review'],
    under_partner_review: ['pending_finalization', 'in_progress'],
    pending_finalization: ['completed'],
    completed: ['closed_out'],
    closed_out: []
  }
};

const STAGE_STATUS_MAPPINGS = {
  info_gathering: {
    client_status: 'pending',
    auditor_status: 'requested'
  },
  commencement: {
    client_status: 'pending',
    letter_auditor_status: 'draft',
    auditor_status: 'in_progress'
  },
  team_execution: {
    client_status: 'in_progress',
    auditor_status: 'in_progress'
  },
  partner_review: {
    auditor_status: 'under_partner_review'
  },
  finalization: {
    client_status: 'responded',
    post_rfi_auditor_status: 'issued',
    auditor_status: 'pending_finalization'
  },
  close_out: {
    client_status: 'completed',
    letter_client_status: 'accepted',
    auditor_status: 'closed_out'
  }
};

export function getStatusTransitions(statusField) {
  return STATUS_TRANSITIONS[statusField] || {};
}

export function canTransitionStatus(statusField, fromStatus, toStatus) {
  const transitions = getStatusTransitions(statusField);
  if (!transitions[fromStatus]) return false;
  return transitions[fromStatus].includes(toStatus);
}

export function validateStatusTransition(statusField, fromStatus, toStatus) {
  if (!canTransitionStatus(statusField, fromStatus, toStatus)) {
    const allowed = getStatusTransitions(statusField)[fromStatus] || [];
    return {
      valid: false,
      error: `Cannot transition ${statusField} from "${fromStatus}" to "${toStatus}". Allowed: ${allowed.join(', ') || 'none'}`
    };
  }
  return { valid: true };
}

export function getStatusOptionsForField(statusField) {
  const statusTypes = config.getConfig().engagement_status_types || {};
  return statusTypes[statusField]?.options || [];
}

export function getStatusLabelForField(statusField, statusValue) {
  const options = getStatusOptionsForField(statusField);
  const option = options.find(o => o.value === statusValue);
  return option?.label || statusValue;
}

export function getStatusColorForField(statusField, statusValue) {
  const options = getStatusOptionsForField(statusField);
  const option = options.find(o => o.value === statusValue);
  return option?.color || 'grey';
}

export function getDefaultStatusForField(statusField) {
  const transitions = getStatusTransitions(statusField);
  const statuses = Object.keys(transitions);
  return statuses[0] || 'pending';
}

export function getSuggestedStatusTransitionsAfterStageChange(fromStage, toStage) {
  const fromMappings = STAGE_STATUS_MAPPINGS[fromStage] || {};
  const toMappings = STAGE_STATUS_MAPPINGS[toStage] || {};
  
  const suggestedTransitions = {};
  
  for (const [statusField, targetStatus] of Object.entries(toMappings)) {
    const currentStatus = fromMappings[statusField];
    if (currentStatus && currentStatus !== targetStatus) {
      const canTransition = canTransitionStatus(statusField, currentStatus, targetStatus);
      suggestedTransitions[statusField] = {
        from: currentStatus,
        to: targetStatus,
        canTransition,
        reason: canTransition ? 'Stage transition' : 'Invalid transition'
      };
    }
  }
  
  return suggestedTransitions;
}

export function validateEngagementStatusConsistency(engagement) {
  const errors = [];
  const warnings = [];
  
  if (!engagement) {
    errors.push('Engagement not provided');
    return { valid: false, errors, warnings };
  }
  
  const statusFields = [
    'client_status',
    'letter_client_status',
    'letter_auditor_status',
    'post_rfi_client_status',
    'post_rfi_auditor_status',
    'auditor_status'
  ];
  
  for (const statusField of statusFields) {
    if (engagement[statusField]) {
      const validation = validateStatusTransition(
        statusField,
        engagement[statusField],
        engagement[statusField]
      );
      if (!validation.valid) {
        errors.push(`Invalid status in ${statusField}: ${engagement[statusField]}`);
      }
    }
  }
  
  const stageMappings = STAGE_STATUS_MAPPINGS[engagement.stage] || {};
  for (const [statusField, expectedStatus] of Object.entries(stageMappings)) {
    const actualStatus = engagement[statusField];
    if (actualStatus && actualStatus !== expectedStatus) {
      warnings.push(
        `${statusField} is "${actualStatus}" but stage suggests "${expectedStatus}"`
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function initializeEngagementStatuses(stage = 'info_gathering') {
  const mappings = STAGE_STATUS_MAPPINGS[stage] || {};
  const statuses = {};
  
  for (const [statusField, status] of Object.entries(mappings)) {
    statuses[statusField] = status;
  }
  
  const allStatusFields = [
    'client_status',
    'letter_client_status',
    'letter_auditor_status',
    'post_rfi_client_status',
    'post_rfi_auditor_status',
    'auditor_status'
  ];
  
  for (const statusField of allStatusFields) {
    if (!statuses[statusField]) {
      statuses[statusField] = getDefaultStatusForField(statusField);
    }
  }
  
  return statuses;
}

export function getAutoStatusTransitionsForStage(stage) {
  return STAGE_STATUS_MAPPINGS[stage] || {};
}
