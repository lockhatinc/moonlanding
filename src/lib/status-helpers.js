import {
  RFI_STATUS,
  RFI_CLIENT_STATUS,
  ENGAGEMENT_STATUS,
  ENGAGEMENT_STAGE,
  REVIEW_STATUS,
  STAGE_TRANSITIONS,
  LETTER_AUDITOR_STATUS,
  REPEAT_INTERVALS,
} from '@/config/constants';

export {
  RFI_STATUS,
  RFI_CLIENT_STATUS,
  ENGAGEMENT_STATUS,
  ENGAGEMENT_STAGE,
  REVIEW_STATUS,
  STAGE_TRANSITIONS,
  LETTER_AUDITOR_STATUS,
  REPEAT_INTERVALS,
};

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

export function canTransitionStage(fromStage, toStage) {
  return STAGE_TRANSITIONS[fromStage] === toStage;
}

export function getNextStage(currentStage) {
  return STAGE_TRANSITIONS[currentStage];
}
