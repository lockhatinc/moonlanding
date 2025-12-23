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
  CLOSE_OUT: 'close_out'
};

export const STAGE_TRANSITIONS = {
  'info_gathering': 'commencement',
  'commencement': 'team_execution',
  'team_execution': 'partner_review',
  'partner_review': 'finalization',
  'finalization': 'close_out'
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
