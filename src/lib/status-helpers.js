// STATUS HELPERS - Re-exports constants from config/constants (single source of truth)
// Plus status check functions that reduce repeated conditional logic

// Re-export all status constants from unified config (single source)
export {
  RFI_STATUS,
  RFI_CLIENT_STATUS,
  RFI_AUDITOR_STATUS,
  ENGAGEMENT_STATUS,
  ENGAGEMENT_STAGE,
  REVIEW_STATUS,
  STAGE_TRANSITIONS,
} from '@/config/constants';

import {
  RFI_STATUS,
  RFI_CLIENT_STATUS,
  ENGAGEMENT_STATUS,
  ENGAGEMENT_STAGE,
  REVIEW_STATUS,
  STAGE_TRANSITIONS,
} from '@/config/constants';

// Check helpers - reduce repeated conditional logic
export function isRfiCompleted(rfi) {
  return rfi.status === RFI_STATUS.COMPLETED || rfi.client_status === RFI_CLIENT_STATUS.COMPLETED;
}

export function isRfiPending(rfi) {
  return rfi.status === RFI_STATUS.PENDING && rfi.client_status === RFI_CLIENT_STATUS.PENDING;
}

export function isRfiResponded(rfi) {
  return rfi.client_status === RFI_CLIENT_STATUS.RESPONDED;
}

export function isEngagementCompleted(engagement) {
  return engagement.status === ENGAGEMENT_STATUS.COMPLETED || engagement.stage === ENGAGEMENT_STAGE.CLOSE_OUT;
}

export function isEngagementActive(engagement) {
  return engagement.status === ENGAGEMENT_STATUS.ACTIVE || engagement.stage === ENGAGEMENT_STAGE.TEAM_EXECUTION;
}

export function isEngagementInReview(engagement) {
  return engagement.stage === ENGAGEMENT_STAGE.PARTNER_REVIEW;
}

export function isReviewOpen(review) {
  return review.status === REVIEW_STATUS.OPEN;
}

export function isReviewClosed(review) {
  return review.status === REVIEW_STATUS.CLOSED;
}

// Status transition helpers
export function canTransitionStage(fromStage, toStage) {
  const transitions = {
    [ENGAGEMENT_STAGE.INFO_GATHERING]: ENGAGEMENT_STAGE.COMMENCEMENT,
    [ENGAGEMENT_STAGE.COMMENCEMENT]: ENGAGEMENT_STAGE.TEAM_EXECUTION,
    [ENGAGEMENT_STAGE.TEAM_EXECUTION]: ENGAGEMENT_STAGE.PARTNER_REVIEW,
    [ENGAGEMENT_STAGE.PARTNER_REVIEW]: ENGAGEMENT_STAGE.FINALIZATION,
    [ENGAGEMENT_STAGE.FINALIZATION]: ENGAGEMENT_STAGE.CLOSE_OUT,
  };
  return transitions[fromStage] === toStage;
}

export function getNextStage(currentStage) {
  const transitions = {
    [ENGAGEMENT_STAGE.INFO_GATHERING]: ENGAGEMENT_STAGE.COMMENCEMENT,
    [ENGAGEMENT_STAGE.COMMENCEMENT]: ENGAGEMENT_STAGE.TEAM_EXECUTION,
    [ENGAGEMENT_STAGE.TEAM_EXECUTION]: ENGAGEMENT_STAGE.PARTNER_REVIEW,
    [ENGAGEMENT_STAGE.PARTNER_REVIEW]: ENGAGEMENT_STAGE.FINALIZATION,
    [ENGAGEMENT_STAGE.FINALIZATION]: ENGAGEMENT_STAGE.CLOSE_OUT,
  };
  return transitions[currentStage];
}
