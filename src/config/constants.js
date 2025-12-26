export {
  ROLES,
  USER_TYPES,
  REPEAT_INTERVALS,
  COLORS,
  BADGE_COLORS_MANTINE,
} from './domain-constants.js';

export {
  RFI_STATUS,
  RFI_CLIENT_STATUS,
  RFI_AUDITOR_STATUS,
  ENGAGEMENT_STATUS,
  ENGAGEMENT_STAGE,
  REVIEW_STATUS,
  HIGHLIGHT_STATUS,
  USER_STATUS,
  LETTER_AUDITOR_STATUS,
  NOTIFICATION_STATUS,
  CHECKLIST_STATUS,
  CLIENT_STATUS,
  RECORD_STATUS,
  EMAIL_STATUS,
  STAGE_TRANSITIONS,
} from './entity-statuses.js';

export {
  HTTP,
  ERRORS,
  GOOGLE_SCOPES,
  GOOGLE_APIS,
} from './api-constants.js';

export {
  SQL_TYPES,
  DISPLAY,
  VALIDATION,
} from './data-constants.js';

export {
  LOG_PREFIXES,
} from './messages-config.js';

export const HIGHLIGHT_PALETTE = {
  grey: { color: '#B0B0B0', label: 'Unresolved', status: 'open' },
  green: { color: '#44BBA4', label: 'Resolved', status: 'resolved' },
  red: { color: '#FF4141', label: 'Priority', status: 'high_priority' },
  purple: { color: '#7F7EFF', label: 'Active Focus', status: 'scrolled_to' }
};
