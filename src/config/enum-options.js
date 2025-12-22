export const STANDARD_STATUS_OPTIONS = {
  pending: { label: 'Pending', color: 'yellow' },
  active: { label: 'Active', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  archived: { label: 'Archived', color: 'gray' },
};

export const LIFECYCLE_STATUS_OPTIONS = {
  pending: { label: 'Pending', color: 'yellow' },
  active: { label: 'Active', color: 'blue' },
  inactive: { label: 'Inactive', color: 'gray' },
};

export const SEVERITY_OPTIONS = {
  low: { label: 'Low', color: 'green' },
  medium: { label: 'Medium', color: 'yellow' },
  high: { label: 'High', color: 'red' },
};

export const PRIORITY_OPTIONS = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'blue' },
  high: { label: 'High', color: 'orange' },
  urgent: { label: 'Urgent', color: 'red' },
};

export const RFI_CLIENT_STATUS_OPTIONS = {
  pending: { label: 'Pending', color: 'yellow' },
  sent: { label: 'Sent', color: 'blue' },
  responded: { label: 'Responded', color: 'amber' },
  completed: { label: 'Completed', color: 'green' },
};

export const RFI_AUDITOR_STATUS_OPTIONS = {
  requested: { label: 'Requested', color: 'red' },
  reviewing: { label: 'Reviewing', color: 'blue' },
  queries: { label: 'Queries', color: 'amber' },
  received: { label: 'Received', color: 'green' },
};

export const HIGHLIGHT_STATUS_OPTIONS = {
  unresolved: { label: 'Unresolved', color: 'red' },
  partially_resolved: { label: 'Partially Resolved', color: 'yellow' },
  resolved: { label: 'Resolved', color: 'green' },
};

export const REVIEW_STATUS_OPTIONS = {
  open: { label: 'Open', color: 'yellow' },
  closed: { label: 'Closed', color: 'green' },
};

export const RFI_STATUS_OPTIONS = {
  waiting: { label: 'Waiting', color: 'yellow' },
  completed: { label: 'Completed', color: 'green' },
};

export const ENGAGEMENT_STAGE_OPTIONS = {
  info_gathering: { label: 'Info Gathering', color: 'blue' },
  commencement: { label: 'Commencement', color: 'blue' },
  team_execution: { label: 'Team Execution', color: 'amber' },
  partner_review: { label: 'Partner Review', color: 'amber' },
  finalization: { label: 'Finalization', color: 'green' },
  close_out: { label: 'Close Out', color: 'green' },
};
