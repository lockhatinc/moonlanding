export const THEME = {
  colors: {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#0ea5e9',
  },

  badges: {
    green: { bg: '#d3f9d8', text: '#2f9e44' },
    yellow: { bg: '#fff3bf', text: '#f59e0b' },
    red: { bg: '#ffe0e0', text: '#ef4444' },
    blue: { bg: '#e7f5ff', text: '#3b82f6' },
    gray: { bg: '#f1f3f5', text: '#495057' },
    amber: { bg: '#fff8e1', text: '#ff6b35' },
  },

  highlightColors: {
    default: '#B0B0B0',
    scrolled_to: '#7F7EFF',
    partner_note: '#FF4141',
    resolved: '#44BBA4',
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
    'engagement_stage.close_out': 'green',

    'review_status.active': 'blue',
    'review_status.open': 'yellow',
    'review_status.closed': 'green',
    'review_status.archived': 'gray',

    'letter_status.requested': 'blue',
    'letter_status.reviewing': 'amber',
    'letter_status.accepted': 'green',
    'letter_status.rejected': 'red',

    'highlight_status.unresolved': 'red',
    'highlight_status.partially_resolved': 'yellow',
    'highlight_status.resolved': 'green',

    'flag_status.open': 'red',
    'flag_status.in_progress': 'blue',
    'flag_status.resolved': 'green',

    'flag_type.query': 'blue',
    'flag_type.issue': 'red',
    'flag_type.missed_deadline': 'orange',
    'flag_type.high_priority': 'red',
    'flag_type.note': 'gray',

    'flag_severity.low': 'green',
    'flag_severity.medium': 'yellow',
    'flag_severity.high': 'red',

    'rfi_status.waiting': 'yellow',
    'rfi_status.completed': 'green',

    'rfi_client_status.pending': 'yellow',
    'rfi_client_status.sent': 'blue',
    'rfi_client_status.responded': 'amber',
    'rfi_client_status.completed': 'green',

    'rfi_auditor_status.requested': 'red',
    'rfi_auditor_status.reviewing': 'blue',
    'rfi_auditor_status.queries': 'amber',
    'rfi_auditor_status.received': 'green',

    'post_rfi_status.pending': 'yellow',
    'post_rfi_status.sent': 'blue',
    'post_rfi_status.queries': 'amber',
    'post_rfi_status.accepted': 'green',

    'severity.low': 'green',
    'severity.medium': 'yellow',
    'severity.high': 'red',

    'template_status.active': 'green',
    'template_status.archived': 'gray',

    'collaborator_role.owner': 'red',
    'collaborator_role.reviewer': 'blue',
    'collaborator_role.viewer': 'gray',

    'collaborator_type.permanent': 'green',
    'collaborator_type.temporary': 'amber',

    'roles.partner': 'red',
    'roles.manager': 'blue',
    'roles.clerk': 'gray',
    'roles.auditor': 'amber',
    'roles.client': 'green',

    'user_status.active': 'green',
    'user_status.inactive': 'gray',

    'repeat_interval.once': 'gray',
    'repeat_interval.monthly': 'blue',
    'repeat_interval.yearly': 'green',
  },

  styles: {
    input: {
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '14px',
    },

    button: {
      padding: '10px 20px',
      borderRadius: '4px',
      backgroundColor: '#3b82f6',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
    },

    tableCell: {
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '14px',
    },

    badge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
    },

    searchIcon: {
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
    },

    formSection: {
      marginBottom: '16px',
      padding: '12px',
      borderRadius: '4px',
      border: '1px solid #eee',
    },
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
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    },
  },
};
