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

    'review_status.open': 'yellow',
    'review_status.closed': 'green',
    'review_status.archived': 'gray',

    'highlight_status.unresolved': 'red',
    'highlight_status.partially_resolved': 'yellow',
    'highlight_status.resolved': 'green',

    'severity.low': 'green',
    'severity.medium': 'yellow',
    'severity.high': 'red',
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
