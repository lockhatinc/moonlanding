export const PALETTE = {
  blue:   { 100: '#e7f5ff', 200: '#d0ebff', 300: '#a5d8ff', 400: '#74c0fc', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
  green:  { 100: '#d3f9d8', 200: '#b2f2bb', 300: '#8ce99a', 400: '#69db7c', 500: '#10b981' },
  red:    { 100: '#ffe0e0', 200: '#ffc9c9', 300: '#ffa8a8', 400: '#ff6b6b', 500: '#ef4444' },
  orange: { 100: '#fff4e6', 200: '#ffe8cc', 300: '#ffd8a8', 400: '#ffa94d', 500: '#f59e0b' },
  purple: { 100: '#f3d9fa', 200: '#eebefa', 300: '#d9a4f5', 400: '#b57bee', 500: '#7f7eff' },
  white:  { 100: '#ffffff', 200: '#f8f9fa', 300: '#f1f3f5', 400: '#e9ecef', 500: '#dee2e6', 600: '#ced4da' },
  gray:   { 500: '#495057', 600: '#343a40', 700: '#212529' },
};

export const THEME = {
  colors: {
    primary: PALETTE.blue[500],
    success: PALETTE.green[500],
    warning: PALETTE.orange[500],
    error: PALETTE.red[500],
    info: '#0ea5e9',
  },

  badges: {
    green:  { bg: PALETTE.green[100],  text: '#2f9e44' },
    yellow: { bg: '#fff3bf',           text: PALETTE.orange[500] },
    red:    { bg: PALETTE.red[100],    text: PALETTE.red[500] },
    blue:   { bg: PALETTE.blue[100],   text: PALETTE.blue[500] },
    gray:   { bg: PALETTE.white[300],  text: PALETTE.gray[500] },
    amber:  { bg: PALETTE.orange[100], text: '#ff6b35' },
    purple: { bg: PALETTE.purple[100], text: PALETTE.purple[500] },
  },

  colorMappings: {
    'engagement_status.pending': 'yellow',
    'engagement_status.active': 'blue',
    'engagement_status.completed': 'green',
    'engagement_status.archived': 'gray',
    'engagement_stage.info_gathering': 'blue',
    'engagement_stage.commencement': 'blue',
    'engagement_stage.team_execution': 'amber',
    'engagement_stage.partner_review': 'amber',
    'engagement_stage.finalization': 'green',
    'engagement_stage.closeout': 'green',

    'review_status.open': 'yellow',
    'review_status.in_progress': 'blue',
    'review_status.closed': 'green',
    'review_status.archived': 'gray',
    'review_stage.initial': 'blue',
    'review_stage.in_review': 'amber',
    'review_stage.finalized': 'green',

    'highlight_status.open': 'red',
    'highlight_status.unresolved': 'red',
    'highlight_status.partially_resolved': 'yellow',
    'highlight_status.resolved': 'green',
    'highlight_color.grey': 'gray',
    'highlight_color.green': 'green',
    'highlight_color.red': 'red',
    'highlight_color.purple': 'purple',

    'checklist_status.pending': 'yellow',
    'checklist_status.in_progress': 'blue',
    'checklist_status.completed': 'green',

    'tender_status.open': 'yellow',
    'tender_status.closed': 'gray',
    'tender_priority.critical': 'red',
    'tender_priority.high': 'amber',
    'tender_priority.normal': 'blue',

    'rfi_client_status.pending': 'yellow',
    'rfi_client_status.sent': 'blue',
    'rfi_client_status.responded': 'amber',
    'rfi_client_status.completed': 'green',
    'rfi_auditor_status.requested': 'yellow',
    'rfi_auditor_status.reviewing': 'blue',
    'rfi_auditor_status.queries': 'amber',
    'rfi_auditor_status.received': 'green',

    'user_status.active': 'green',
    'user_status.inactive': 'gray',
    'user_status.suspended': 'red',

    'severity.low': 'green',
    'severity.medium': 'yellow',
    'severity.high': 'red',
  },

  display: {
    textPreview: 200,
    textareaPreview: 100,
    jsonPreview: 50,
    dateFormat: 'locale',
    timeFormat: 'locale',
    decimalPlaces: 2,
    truncationChar: '...',
    renderMode: 'badge',
  },

  fonts: {
    family: 'system-ui, -apple-system, sans-serif',
    sizes: { xs: '12px', sm: '14px', md: '16px', lg: '18px', xl: '20px' },
  },
};

export function getStatusColor(entity, status) {
  return THEME.colorMappings[`${entity}_status.${status}`] || 'gray';
}

export function getStageColor(entity, stage) {
  return THEME.colorMappings[`${entity}_stage.${stage}`] || 'gray';
}

export function getSeverityColor(severity) {
  return THEME.colorMappings[`severity.${severity}`] || 'gray';
}

export function getBadgeStyle(colorName) {
  const badge = THEME.badges[colorName] || THEME.badges.gray;
  return `background:${badge.bg};color:${badge.text};padding:4px 8px;border-radius:4px;font-size:12px;font-weight:500`;
}

export function getStatusBadgeStyle(entity, status) {
  return getBadgeStyle(getStatusColor(entity, status));
}

export function getColorMapping(key, value) {
  return THEME.colorMappings[`${key}.${value}`] || 'gray';
}
