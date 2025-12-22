export const JOB_TEMPLATES = {
  engagement_recreation: {
    name: 'Engagement Recreation',
    description: 'Recreate engagement for next period',
    cron: '0 0 1 * *',
    handler: 'recreateEngagements',
    timeout: 30000,
    retries: 3,
    async: true,
    config: {
      entityType: 'engagement',
      filter: { status: 'active' },
    },
  },
  rfi_deadline_check: {
    name: 'RFI Deadline Check',
    description: 'Check RFI deadlines and send notifications',
    cron: '0 9 * * *',
    handler: 'checkRFIDeadlines',
    timeout: 15000,
    retries: 2,
    async: true,
    config: {
      thresholdDays: 7,
      notifyAll: true,
    },
  },
  engagement_status_update: {
    name: 'Engagement Status Update',
    description: 'Auto-update engagement status based on progress',
    cron: '0 * * * *',
    handler: 'updateEngagementStatus',
    timeout: 20000,
    retries: 2,
    async: true,
    config: {
      progressThreshold: 90,
      autoComplete: true,
    },
  },
  data_cleanup: {
    name: 'Data Cleanup',
    description: 'Clean up soft-deleted records older than 90 days',
    cron: '0 2 * * 0',
    handler: 'cleanupDeletedRecords',
    timeout: 60000,
    retries: 1,
    async: true,
    config: {
      retentionDays: 90,
      batchSize: 100,
    },
  },
  cache_refresh: {
    name: 'Cache Refresh',
    description: 'Refresh critical caches',
    cron: '0 */6 * * *',
    handler: 'refreshCaches',
    timeout: 10000,
    retries: 2,
    async: true,
    config: {
      targets: ['specs', 'permissions', 'enums'],
    },
  },
  report_generation: {
    name: 'Report Generation',
    description: 'Generate periodic reports',
    cron: '0 0 * * 0',
    handler: 'generateReports',
    timeout: 120000,
    retries: 1,
    async: true,
    config: {
      formats: ['pdf', 'csv'],
      emailTo: 'reports@company.com',
    },
  },
  sync_external_data: {
    name: 'Sync External Data',
    description: 'Sync data from external systems',
    cron: '*/30 * * * *',
    handler: 'syncExternalData',
    timeout: 30000,
    retries: 3,
    async: true,
    config: {
      systems: ['google_drive', 'external_api'],
    },
  },
  notification_digest: {
    name: 'Notification Digest',
    description: 'Send daily notification digests',
    cron: '0 8 * * *',
    handler: 'sendNotificationDigest',
    timeout: 15000,
    retries: 2,
    async: true,
    config: {
      frequency: 'daily',
      maxItems: 20,
    },
  },
};

export function getJobTemplate(name) {
  return JOB_TEMPLATES[name];
}

export function getAllJobTemplates() {
  return Object.values(JOB_TEMPLATES);
}

export function getJobsBySchedule(pattern) {
  return Object.entries(JOB_TEMPLATES)
    .filter(([_, job]) => job.cron === pattern)
    .map(([name, job]) => ({ name, ...job }));
}

export function getAsyncJobs() {
  return Object.entries(JOB_TEMPLATES)
    .filter(([_, job]) => job.async)
    .map(([name, job]) => ({ name, ...job }));
}
