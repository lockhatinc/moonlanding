import { get, create } from '@/engine';
import { ENGAGEMENT_STAGE, ENGAGEMENT_STATUS, RFI_STATUS, ROLES, USER_TYPES, LETTER_AUDITOR_STATUS } from '@/config/constants';
import { canTransitionStage } from '@/lib/status-helpers';
import { safeJsonParse } from '@/lib/safe-json';

const logActivity = (t, id, act, msg, u, d) =>
  create('activity_log', { entity_type: t, entity_id: id, action: act, message: msg, details: d ? JSON.stringify(d) : null, user_email: u?.email }, u);

export const validateStageTransition = (engagement, newStage, user) => {
  const currentStage = engagement.stage;
  const userRole = user.role;

  if (engagement.status === ENGAGEMENT_STATUS.PENDING) {
    const error = 'Cannot change stage while engagement is pending';
    logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
      from: currentStage,
      to: newStage,
      reason: 'engagement_pending'
    });
    throw new Error(error);
  }

  const isPartner = userRole === ROLES.PARTNER;
  const isManager = userRole === ROLES.MANAGER;
  const isClerk = userRole === ROLES.CLERK;
  const clerksCanApprove = engagement.clerks_can_approve === true || engagement.clerks_can_approve === 1;

  if (newStage === ENGAGEMENT_STAGE.PARTNER_REVIEW) {
    if (!isPartner && !isManager) {
      const error = 'Only partners and managers can move to partner_review stage';
      logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
        from: currentStage,
        to: newStage,
        reason: 'insufficient_role',
        required_role: 'partner or manager',
        user_role: userRole
      });
      throw new Error(error);
    }
    if (isClerk) {
      const error = 'Clerks cannot move engagement to partner_review stage';
      logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
        from: currentStage,
        to: newStage,
        reason: 'clerk_restricted'
      });
      throw new Error(error);
    }
  }

  if (newStage === ENGAGEMENT_STAGE.FINALIZATION) {
    if (!isPartner) {
      const error = 'Only partners can move to finalization stage';
      logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
        from: currentStage,
        to: newStage,
        reason: 'partner_only',
        user_role: userRole
      });
      throw new Error(error);
    }
  }

  if (newStage === ENGAGEMENT_STAGE.CLOSE_OUT) {
    if (!isPartner) {
      const error = 'Only partners can close out engagements';
      logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
        from: currentStage,
        to: newStage,
        reason: 'partner_exclusive',
        user_role: userRole
      });
      throw new Error(error);
    }
    if (engagement.letter_auditor_status !== LETTER_AUDITOR_STATUS.ACCEPTED && engagement.progress > 0) {
      const error = 'Cannot close out: Letter must be accepted or progress must be 0%';
      logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
        from: currentStage,
        to: newStage,
        reason: 'letter_not_accepted',
        letter_status: engagement.letter_auditor_status,
        progress: engagement.progress
      });
      throw new Error(error);
    }
  }

  if (newStage === ENGAGEMENT_STAGE.COMMENCEMENT ||
      newStage === ENGAGEMENT_STAGE.TEAM_EXECUTION) {
    if (isClerk && !clerksCanApprove) {
      const error = `Clerks cannot move to ${newStage} stage unless clerksCanApprove is enabled`;
      logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
        from: currentStage,
        to: newStage,
        reason: 'clerk_approval_disabled',
        clerks_can_approve: clerksCanApprove
      });
      throw new Error(error);
    }
  }

  if (isClerk && !isPartner && !isManager && !clerksCanApprove) {
    const error = 'Clerks cannot change engagement stage unless clerksCanApprove is enabled';
    logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
      from: currentStage,
      to: newStage,
      reason: 'clerk_general_restriction',
      clerks_can_approve: clerksCanApprove
    });
    throw new Error(error);
  }

  if (!canTransitionStage(currentStage, newStage)) {
    const error = `Invalid stage transition from ${currentStage} to ${newStage}`;
    logActivity('engagement', engagement.id, 'stage_transition_denied', error, user, {
      from: currentStage,
      to: newStage,
      reason: 'invalid_transition_path'
    });
    throw new Error(error);
  }

  return true;
};

export const validateRfiStatusChange = (rfi, newStatus, user) => {
  if (user.type !== USER_TYPES.AUDITOR || user.role === ROLES.CLERK) {
    const e = get('engagement', rfi.engagement_id);
    if (!e?.clerks_can_approve) throw new Error('Only auditors (not clerks) can change RFI status');
  }
  if (newStatus === RFI_STATUS.COMPLETED) {
    const hasFiles = rfi.files_count > 0 || safeJsonParse(rfi.files, []).length > 0;
    const hasResponses = rfi.response_count > 0 || safeJsonParse(rfi.responses, []).length > 0;
    if (!hasFiles && !hasResponses) throw new Error('RFI must have files or responses before completing');
  }
  return true;
};
