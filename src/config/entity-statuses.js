import { getConfigEngineSync } from '@/lib/config-generator-engine';

const _engine = () => {
  try { return getConfigEngineSync(); } catch { return null; }
};

const _createStatusAccessor = (enumName, fallback) => {
  return new Proxy(fallback, {
    get: (target, prop) => {
      if (typeof prop === 'symbol') return target[prop];
      const engine = _engine();
      if (engine) {
        try {
          const statusEnum = engine.getStatusEnum(enumName);
          if (statusEnum) {
            const key = String(prop).toLowerCase();
            if (statusEnum[key]) return key;
          }
        } catch {}
      }
      return target[prop];
    }
  });
};

export const RFI_STATUS = _createStatusAccessor('rfi_client_status', { pending: 'pending', completed: 'completed', PENDING: 0, COMPLETED: 1 });
export const RFI_CLIENT_STATUS = _createStatusAccessor('rfi_client_status', { pending: 'pending', sent: 'sent', responded: 'responded', completed: 'completed' });
export const RFI_AUDITOR_STATUS = _createStatusAccessor('rfi_auditor_status', { requested: 'requested', reviewing: 'reviewing', queries: 'queries', received: 'received' });
export const ENGAGEMENT_STATUS = _createStatusAccessor('standard_status', { pending: 'pending', active: 'active', completed: 'completed', archived: 'archived' });
export const ENGAGEMENT_STAGE = _createStatusAccessor('engagement_stage', { info_gathering: 'info_gathering', commencement: 'commencement', team_execution: 'team_execution', partner_review: 'partner_review', finalization: 'finalization', closeout: 'closeout' });
export const REVIEW_STATUS = _createStatusAccessor('review_status', { open: 'open', closed: 'closed' });
export const HIGHLIGHT_STATUS = _createStatusAccessor('highlight_status', { unresolved: 'unresolved', partially_resolved: 'partially_resolved', resolved: 'resolved' });
export const USER_STATUS = _createStatusAccessor('user_status', { active: 'active', inactive: 'inactive' });
export const LETTER_AUDITOR_STATUS = _createStatusAccessor('letter_status', { requested: 'requested', reviewing: 'reviewing', accepted: 'accepted', rejected: 'rejected' });
export const NOTIFICATION_STATUS = _createStatusAccessor('standard_status', { pending: 'pending', sent: 'sent', failed: 'failed' });
export const CHECKLIST_STATUS = _createStatusAccessor('standard_status', { pending: 'pending', in_progress: 'in_progress', completed: 'completed' });
export const CLIENT_STATUS = _createStatusAccessor('lifecycle_status', { active: 'active', inactive: 'inactive' });
export const RECORD_STATUS = _createStatusAccessor('standard_status', { deleted: 'deleted' });
export const EMAIL_STATUS = _createStatusAccessor('standard_status', { pending: 'pending', processing: 'processing', processed: 'processed', failed: 'failed' });

export const STAGE_TRANSITIONS = {
  info_gathering: 'commencement',
  commencement: 'team_execution',
  team_execution: 'partner_review',
  partner_review: 'finalization',
  finalization: 'closeout',
};
