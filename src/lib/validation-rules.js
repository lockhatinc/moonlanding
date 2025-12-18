import { get } from '@/engine';
import { ENGAGEMENT_STAGE, ENGAGEMENT_STATUS, RFI_STATUS, ROLES, USER_TYPES } from '@/config/constants';
import { canTransitionStage } from '@/lib/status-helpers';

export const validateStageTransition = (engagement, newStage, user) => {
  if (![ROLES.PARTNER, ROLES.MANAGER].includes(user.role)) throw new Error('Only partners and managers can change stage');
  if (engagement.status === ENGAGEMENT_STATUS.PENDING) throw new Error('Cannot change stage while pending');
  if (newStage === ENGAGEMENT_STAGE.CLOSE_OUT && user.role !== ROLES.PARTNER) throw new Error('Only partners can close out');
  if (newStage === ENGAGEMENT_STAGE.CLOSE_OUT && engagement.letter_auditor_status !== 'accepted' && engagement.progress > 0)
    throw new Error('Cannot close out: Letter must be accepted or progress must be 0%');
  if (!canTransitionStage(engagement.stage, newStage)) throw new Error(`Cannot go backward from ${engagement.stage} to ${newStage}`);
  return true;
};

export const validateRfiStatusChange = (rfi, newStatus, user) => {
  if (user.type !== USER_TYPES.AUDITOR || user.role === ROLES.CLERK) {
    const e = get('engagement', rfi.engagement_id);
    if (!e?.clerks_can_approve) throw new Error('Only auditors (not clerks) can change RFI status');
  }
  if (newStatus === RFI_STATUS.COMPLETED) {
    const hasFiles = rfi.files_count > 0 || JSON.parse(rfi.files || '[]').length > 0;
    const hasResponses = rfi.response_count > 0 || JSON.parse(rfi.responses || '[]').length > 0;
    if (!hasFiles && !hasResponses) throw new Error('RFI must have files or responses before completing');
  }
  return true;
};
