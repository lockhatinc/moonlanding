// Dynamic status constant access from ConfigGeneratorEngine
// These are now loaded from master-config.yml status_enums at runtime
// This file is server-side only and should not be bundled with client code

let _cachedEngine = null;

const _getConfigEngine = () => {
  // Lazy-load config engine on first access (server-side only)
  if (typeof window !== 'undefined') {
    // Client-side: return null to use fallback values
    return null;
  }

  if (!_cachedEngine) {
    try {
      // This dynamic require pattern works on server-side only
      // webpackIgnore: true prevents webpack from trying to bundle this on client side
      const configModule = eval('require')('@/lib/config-generator-engine');
      _cachedEngine = configModule.getConfigEngine();
    } catch (err) {
      // Config engine not available yet, will use fallback values
    }
  }
  return _cachedEngine;
};

const _createStatusProxy = (enumName, fallbackValue) => {
  return new Proxy(fallbackValue, {
    get: (target, prop) => {
      try {
        const engine = _getConfigEngine();
        if (engine) {
          const statusEnum = engine.getStatusEnum(enumName);
          if (statusEnum) {
            const key = String(prop).toLowerCase();
            return statusEnum[key] ? key : target[prop];
          }
        }
      } catch (err) {
        // Silently fall through to fallback
      }
      return target[prop];
    }
  });
};

// Fallback values for when config is not available
const _RFI_STATUS_FALLBACK = {
  PENDING: 0,
  COMPLETED: 1,
  pending: 'pending',
  completed: 'completed',
};

const _RFI_CLIENT_STATUS_FALLBACK = {
  PENDING: 'pending',
  SENT: 'sent',
  RESPONDED: 'responded',
  COMPLETED: 'completed',
  pending: 'pending',
  sent: 'sent',
  responded: 'responded',
  completed: 'completed',
};

const _RFI_AUDITOR_STATUS_FALLBACK = {
  REQUESTED: 'requested',
  REVIEWING: 'reviewing',
  QUERIES: 'queries',
  RECEIVED: 'received',
  requested: 'requested',
  reviewing: 'reviewing',
  queries: 'queries',
  received: 'received',
};

const _ENGAGEMENT_STATUS_FALLBACK = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  pending: 'pending',
  active: 'active',
  completed: 'completed',
  archived: 'archived',
};

const _ENGAGEMENT_STAGE_FALLBACK = {
  INFO_GATHERING: 'info_gathering',
  COMMENCEMENT: 'commencement',
  TEAM_EXECUTION: 'team_execution',
  PARTNER_REVIEW: 'partner_review',
  FINALIZATION: 'finalization',
  CLOSEOUT: 'closeout',
  info_gathering: 'info_gathering',
  commencement: 'commencement',
  team_execution: 'team_execution',
  partner_review: 'partner_review',
  finalization: 'finalization',
  closeout: 'closeout',
};

const _REVIEW_STATUS_FALLBACK = {
  OPEN: 'open',
  CLOSED: 'closed',
  open: 'open',
  closed: 'closed',
};

const _HIGHLIGHT_STATUS_FALLBACK = {
  UNRESOLVED: 'unresolved',
  PARTIALLY_RESOLVED: 'partially_resolved',
  RESOLVED: 'resolved',
  unresolved: 'unresolved',
  partially_resolved: 'partially_resolved',
  resolved: 'resolved',
};

const _USER_STATUS_FALLBACK = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  active: 'active',
  inactive: 'inactive',
};

const _LETTER_AUDITOR_STATUS_FALLBACK = {
  REQUESTED: 'requested',
  REVIEWING: 'reviewing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  requested: 'requested',
  reviewing: 'reviewing',
  accepted: 'accepted',
  rejected: 'rejected',
};

const _NOTIFICATION_STATUS_FALLBACK = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  pending: 'pending',
  sent: 'sent',
  failed: 'failed',
};

const _CHECKLIST_STATUS_FALLBACK = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
};

const _CLIENT_STATUS_FALLBACK = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  active: 'active',
  inactive: 'inactive',
};

const _RECORD_STATUS_FALLBACK = {
  DELETED: 'deleted',
  deleted: 'deleted',
};

const _EMAIL_STATUS_FALLBACK = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
  pending: 'pending',
  processing: 'processing',
  processed: 'processed',
  failed: 'failed',
};

// Export proxies that dynamically load from config
export const RFI_STATUS = _createStatusProxy('rfi_client_status', _RFI_STATUS_FALLBACK);

export const RFI_CLIENT_STATUS = _createStatusProxy('rfi_client_status', _RFI_CLIENT_STATUS_FALLBACK);

export const RFI_AUDITOR_STATUS = _createStatusProxy('rfi_auditor_status', _RFI_AUDITOR_STATUS_FALLBACK);

export const ENGAGEMENT_STATUS = _createStatusProxy('standard_status', _ENGAGEMENT_STATUS_FALLBACK);

export const ENGAGEMENT_STAGE = _createStatusProxy('engagement_stage', _ENGAGEMENT_STAGE_FALLBACK);

export const REVIEW_STATUS = _createStatusProxy('review_status', _REVIEW_STATUS_FALLBACK);

export const HIGHLIGHT_STATUS = _createStatusProxy('highlight_status', _HIGHLIGHT_STATUS_FALLBACK);

export const USER_STATUS = _createStatusProxy('user_status', _USER_STATUS_FALLBACK);

export const LETTER_AUDITOR_STATUS = _createStatusProxy('letter_status', _LETTER_AUDITOR_STATUS_FALLBACK);

export const NOTIFICATION_STATUS = _createStatusProxy('standard_status', _NOTIFICATION_STATUS_FALLBACK);

export const CHECKLIST_STATUS = _createStatusProxy('standard_status', _CHECKLIST_STATUS_FALLBACK);

export const CLIENT_STATUS = _createStatusProxy('lifecycle_status', _CLIENT_STATUS_FALLBACK);

export const RECORD_STATUS = _createStatusProxy('standard_status', _RECORD_STATUS_FALLBACK);

export const EMAIL_STATUS = _createStatusProxy('standard_status', _EMAIL_STATUS_FALLBACK);

export const STAGE_TRANSITIONS = {
  'info_gathering': 'commencement',
  'commencement': 'team_execution',
  'team_execution': 'partner_review',
  'partner_review': 'finalization',
  'finalization': 'closeout'
};
