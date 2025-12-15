// Status and enum helpers - consolidates magic numbers and status checks
// Replaces scattered hardcoded status checks throughout events, recreation, and validation code

// RFI Status constants
export const RFI_STATUS = {
  PENDING: 0,
  COMPLETED: 1,
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

// Engagement Status constants
export const ENGAGEMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const ENGAGEMENT_STAGE = {
  INFO_GATHERING: 'info_gathering',
  COMMENCEMENT: 'commencement',
  TEAM_EXECUTION: 'team_execution',
  PARTNER_REVIEW: 'partner_review',
  FINALIZATION: 'finalization',
  CLOSE_OUT: 'close_out',
};

// Review Status constants
export const REVIEW_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
};

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
