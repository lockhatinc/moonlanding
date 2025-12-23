import { ConfigGeneratorEngine, getConfigEngine } from './config-generator-engine.js';

const engine = getConfigEngine();

const engagementSpec = engine.generateEntitySpec('engagement');

console.log(engagementSpec);

const permissions = engine.getPermissionTemplate('standard_auditor');
console.log(permissions);

const workflow = engine.getWorkflow('engagement_lifecycle');
console.log(workflow);

const threshold = engine.getThreshold('rfi.notification_days');
console.log(threshold);

const entities = engine.getEntitiesForDomain('friday');
console.log(entities);

const isEnabled = engine.isFeatureEnabled('engagement_letter', {
  domain: 'friday',
  stage: 'commencement',
});
console.log(isEnabled);

const job = engine.generateAutomationJob('daily_backup');
console.log(job);

const handler = engine.generateNotificationHandler('rfi_escalation');
console.log(handler);

const rule = engine.getValidationRule('engagement_stage_transition');
console.log(rule);

const allEntities = engine.getAllEntities();
console.log(allEntities);

const allAutomations = engine.getAllAutomations();
console.log(allAutomations);

engine.cacheSpec('custom_entity', {
  name: 'custom_entity',
  label: 'Custom Entity',
});

engine.invalidateCache();

engine.enableDebug(true);
const spec = engine.generateEntitySpec('rfi');
console.log(spec);

const roles = engine.getRoles();
console.log(roles);

const domains = engine.getDomains();
console.log(domains);

const palette = engine.getHighlightPalette();
console.log(palette);

const system = engine.getSystemConfig();
console.log(system);

const integration = engine.getIntegration('google_drive');
console.log(integration);

const template = engine.getDocumentTemplate('engagement_letter');
console.log(template);

const statusEnum = engine.getStatusEnum('rfi_client_status');
console.log(statusEnum);
