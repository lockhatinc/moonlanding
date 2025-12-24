export const JOBS_CONFIG = {
  dailyBackup: {
    name: 'daily_backup',
    schedule: '0 2 * * *',
    description: 'Export database to backup',
  },

  dailyUserSync: {
    name: 'daily_user_sync',
    schedule: '0 3 * * *',
    description: 'Sync users from Google Workspace',
  },

  dailyEngagementCheck: {
    name: 'daily_engagement_check',
    schedule: '0 4 * * *',
    description: 'Auto-transition engagements',
  },

  dailyRfiNotifications: {
    name: 'daily_rfi_notifications',
    schedule: '0 5 * * *',
    description: 'RFI deadline notifications',
    config: { days_before: [7, 3, 1, 0] },
  },

  dailyRfiEscalation: {
    name: 'daily_rfi_escalation',
    schedule: '0 5 * * *',
    description: 'RFI escalation notifications for outstanding RFIs',
    config: { escalation_thresholds: [3, 7, 14] },
  },

  dailyConsolidatedNotifications: {
    name: 'daily_consolidated_notifications',
    schedule: '0 6 * * *',
    description: 'Daily digest to managers/clerks',
  },

  dailyTenderNotifications: {
    name: 'daily_tender_notifications',
    schedule: '0 9 * * *',
    description: 'Tender deadline notifications',
  },

  dailyTenderMissed: {
    name: 'daily_tender_missed',
    schedule: '0 10 * * *',
    description: 'Mark missed tender deadlines',
  },

  dailyCollaboratorExpiryNotifications: {
    name: 'daily_collaborator_expiry_notifications',
    schedule: '0 7 * * *',
    description: 'Send 7-day expiry warnings to collaborators',
    config: { days_before_expiry: 7 },
  },

  dailyTempAccessCleanup: {
    name: 'daily_temp_access_cleanup',
    schedule: '0 0 * * *',
    description: 'Remove expired collaborators',
  },

  weeklyChecklistPdfs: {
    name: 'weekly_checklist_pdfs',
    schedule: '0 8 * * 1',
    description: 'Weekly checklist PDF reports',
  },

  weeklyClientEmails: {
    name: 'weekly_client_emails',
    schedule: '0 9 * * 1',
    description: 'Weekly client engagement summaries',
    config: { include_individual: true, include_admin_master: true },
  },

  yearlyEngagementRecreation: {
    name: 'yearly_engagement_recreation',
    schedule: '0 0 1 1 *',
    description: 'Yearly engagement recreation',
    recreationInterval: 'yearly',
  },

  monthlyEngagementRecreation: {
    name: 'monthly_engagement_recreation',
    schedule: '0 0 1 * *',
    description: 'Monthly engagement recreation',
    recreationInterval: 'monthly',
  },

  hourlyEmailProcessing: {
    name: 'hourly_email_processing',
    schedule: '0 * * * *',
    description: 'Process email queue',
  },

  hourlyEmailAllocation: {
    name: 'hourly_email_allocation',
    schedule: '15 * * * *',
    description: 'Auto-allocate unallocated emails',
    config: {
      min_confidence: 70,
      batch_size: 50,
    },
  },
};
