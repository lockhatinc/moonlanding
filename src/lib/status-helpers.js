import { getConfigEngineSync } from '@/lib/config-generator-engine.js';

let _cachedConfig = null;

function getCachedConfig() {
  if (!_cachedConfig) {
    try {
      const engine = getConfigEngineSync();
      _cachedConfig = engine.getConfig();
    } catch {
      return null;
    }
  }
  return _cachedConfig;
}

function buildEnumFromWorkflow(workflowName) {
  const stages = getCachedConfig()?.workflows?.[workflowName]?.stages;
  if (!stages) return null;
  const result = {};
  for (const stage of stages) {
    const name = typeof stage === 'string' ? stage : stage.name;
    result[name.toUpperCase()] = name;
  }
  return result;
}

export const ENGAGEMENT_STATUS = { PENDING: 'pending', ACTIVE: 'active', COMPLETED: 'completed', ARCHIVED: 'archived' };
export const ENGAGEMENT_STAGE = { INFO_GATHERING: 'info_gathering', COMMENCEMENT: 'commencement', TEAM_EXECUTION: 'team_execution', PARTNER_REVIEW: 'partner_review', FINALIZATION: 'finalization', CLOSE_OUT: 'closeout' };
export const STAGE_TRANSITIONS = { info_gathering: 'commencement', commencement: 'team_execution', team_execution: 'partner_review', partner_review: 'finalization', finalization: 'closeout' };

export const RFI_STATUS = { PENDING: 'pending', COMPLETED: 'completed' };
export const RFI_CLIENT_STATUS = { PENDING: 'pending', SENT: 'sent', RESPONDED: 'responded', COMPLETED: 'completed' };
export const RFI_AUDITOR_STATUS = { REQUESTED: 'requested', REVIEWING: 'reviewing', QUERIES: 'queries', RECEIVED: 'received' };

export const REVIEW_STATUS = { OPEN: 'open', IN_PROGRESS: 'in_progress', CLOSED: 'closed', ARCHIVED: 'archived' };
export const REVIEW_STAGE = { INITIAL: 'initial', IN_REVIEW: 'in_review', FINALIZED: 'finalized' };

export const HIGHLIGHT_STATUS = { OPEN: 'open', UNRESOLVED: 'unresolved', PARTIALLY_RESOLVED: 'partially_resolved', RESOLVED: 'resolved' };
export const CHECKLIST_STATUS = { PENDING: 'pending', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' };
export const TENDER_STATUS = { OPEN: 'open', CLOSED: 'closed' };
export const TENDER_PRIORITY = { NORMAL: 'normal', HIGH: 'high', CRITICAL: 'critical' };

export const LETTER_AUDITOR_STATUS = { DRAFT: 'draft', SENT: 'sent', SIGNED: 'signed', COMPLETED: 'completed' };
export const LETTER_CLIENT_STATUS = { PENDING: 'pending', RECEIVED: 'received', SIGNED: 'signed', COMPLETED: 'completed' };

export const USER_STATUS = { ACTIVE: 'active', INACTIVE: 'inactive', SUSPENDED: 'suspended' };
export const USER_TYPES = { AUDITOR: 'auditor', CLIENT: 'client' };
export const ROLES = { PARTNER: 'partner', MANAGER: 'manager', CLERK: 'clerk', CLIENT_ADMIN: 'client_admin', CLIENT_USER: 'client_user' };

export const STATUS_LABELS = {
  ...Object.fromEntries(Object.entries(ENGAGEMENT_STATUS).map(([, v]) => [v, v.charAt(0).toUpperCase() + v.slice(1)])),
  ...Object.fromEntries(Object.entries(RFI_CLIENT_STATUS).map(([, v]) => [v, v.charAt(0).toUpperCase() + v.slice(1)])),
  ...Object.fromEntries(Object.entries(RFI_AUDITOR_STATUS).map(([, v]) => [v, v.charAt(0).toUpperCase() + v.slice(1)])),
  ...Object.fromEntries(Object.entries(REVIEW_STATUS).map(([, v]) => [v, v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())])),
  ...Object.fromEntries(Object.entries(HIGHLIGHT_STATUS).map(([, v]) => [v, v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())])),
};

export function getEngagementStages() {
  return buildEnumFromWorkflow('engagement_lifecycle') || ENGAGEMENT_STAGE;
}

export function getRfiStates() {
  return buildEnumFromWorkflow('rfi_type_standard') || RFI_STATUS;
}

export function getReviewStages() {
  return buildEnumFromWorkflow('review_lifecycle') || REVIEW_STAGE;
}

export function getStageTransitions() {
  const stages = getCachedConfig()?.workflows?.engagement_lifecycle?.stages;
  if (!stages) return STAGE_TRANSITIONS;
  const result = {};
  for (let i = 0; i < stages.length - 1; i++) {
    const cur = typeof stages[i] === 'string' ? stages[i] : stages[i].name;
    const nxt = typeof stages[i + 1] === 'string' ? stages[i + 1] : stages[i + 1].name;
    result[cur] = nxt;
  }
  return result;
}

export function isValidTransition(entityType, from, to) {
  if (entityType === 'engagement') {
    const transitions = getStageTransitions();
    return transitions[from] === to;
  }
  if (entityType === 'review') {
    const allowed = { open: ['in_progress', 'closed'], in_progress: ['closed', 'open'], closed: ['archived', 'open'] };
    return (allowed[from] || []).includes(to);
  }
  return false;
}

export function getStatusLabel(value) {
  return STATUS_LABELS[value] || value;
}

export function clearCachedConfig() {
  _cachedConfig = null;
}
