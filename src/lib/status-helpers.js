import { getConfigEngineSync } from './config-generator-engine.js';

let _cachedConfig = null;

function getCachedConfig() {
  if (!_cachedConfig) {
    try {
      const engine = getConfigEngineSync();
      _cachedConfig = engine.getConfig();
    } catch (error) {
      console.warn('[status-helpers] Config engine not available, using fallback enums');
      return null;
    }
  }
  return _cachedConfig;
}

function buildEnumFromWorkflow(workflowName) {
  const config = getCachedConfig();
  if (!config?.workflows?.[workflowName]?.stages) {
    return null;
  }

  const stages = config.workflows[workflowName].stages;
  const result = {};

  for (const stage of stages) {
    const stageName = typeof stage === 'string' ? stage : stage.name;
    result[stageName.toUpperCase()] = stageName;
  }

  return result;
}

function buildStateEnumFromWorkflow(workflowName, stateType = 'internal_states') {
  const config = getCachedConfig();
  if (!config?.workflows?.[workflowName]?.[stateType]) {
    return null;
  }

  const states = config.workflows[workflowName][stateType];
  const result = {};

  for (const state of states) {
    const stateValue = typeof state === 'string' ? state : state;
    result[stateValue.toUpperCase()] = stateValue;
  }

  return result;
}

export const ENGAGEMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const RFI_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed'
};

export const ENGAGEMENT_STAGE = {
  INFO_GATHERING: 'info_gathering',
  COMMENCEMENT: 'commencement',
  TEAM_EXECUTION: 'team_execution',
  PARTNER_REVIEW: 'partner_review',
  FINALIZATION: 'finalization',
  CLOSE_OUT: 'closeout'
};

export const STAGE_TRANSITIONS = {
  'info_gathering': 'commencement',
  'commencement': 'team_execution',
  'team_execution': 'partner_review',
  'partner_review': 'finalization',
  'finalization': 'closeout'
};

export const RFI_CLIENT_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  RESPONDED: 'responded',
  COMPLETED: 'completed',
};

export const RFI_AUDITOR_STATUS = {
  REQUESTED: 'requested',
  REVIEWING: 'reviewing',
  QUERIES: 'queries',
  RECEIVED: 'received',
};

export const RFI_CLIENT_STATUS_OPTIONS = {
  pending: 'Pending',
  sent: 'Sent',
  responded: 'Responded',
  completed: 'Completed'
};

export const RFI_AUDITOR_STATUS_OPTIONS = {
  requested: 'Requested',
  reviewing: 'Reviewing',
  queries: 'Queries',
  received: 'Received'
};

export function getEngagementStages() {
  const fromConfig = buildEnumFromWorkflow('engagement_lifecycle');
  return fromConfig || ENGAGEMENT_STAGE;
}

export function getRfiStates(stateType = 'internal_states') {
  const fromConfig = buildStateEnumFromWorkflow('rfi_type_standard', stateType);
  return fromConfig || RFI_STATUS;
}

export function getStageTransitions() {
  const config = getCachedConfig();
  if (!config?.workflows?.engagement_lifecycle?.stages) {
    return STAGE_TRANSITIONS;
  }

  const result = {};
  const stages = config.workflows.engagement_lifecycle.stages;

  for (let i = 0; i < stages.length - 1; i++) {
    const current = typeof stages[i] === 'string' ? stages[i] : stages[i].name;
    const next = typeof stages[i + 1] === 'string' ? stages[i + 1] : stages[i + 1].name;
    result[current] = next;
  }

  return result;
}

export function clearCachedConfig() {
  _cachedConfig = null;
}
