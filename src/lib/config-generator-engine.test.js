import { ConfigGeneratorEngine, getConfigEngine, resetConfigEngine } from './config-generator-engine.js';

console.log('=== COMPREHENSIVE TESTING ===\n');

const engine = getConfigEngine();
engine.enableDebug(false);

let passed = 0;
let failed = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log('✓', name);
    passed++;
  } catch (e) {
    console.log('✗', name, '-', e.message);
    failed++;
  }
};

test('constructor()', () => {
  const e = new ConfigGeneratorEngine();
  if (!e) throw new Error('Failed to create instance');
});

test('generateEntitySpec()', () => {
  const spec = engine.generateEntitySpec('engagement');
  if (!spec.name || !spec.label) throw new Error('Invalid spec');
});

test('getPermissionTemplate()', () => {
  const perms = engine.getPermissionTemplate('standard_auditor');
  if (!perms.partner || !perms.manager) throw new Error('Invalid template');
});

test('generateNotificationHandler()', () => {
  const handler = engine.generateNotificationHandler('rfi_escalation');
  if (!handler.name || !handler.trigger) throw new Error('Invalid handler');
});

test('generateAutomationJob()', () => {
  const job = engine.generateAutomationJob('daily_backup');
  if (!job.name || !job.trigger) throw new Error('Invalid job');
});

test('getEntitiesForDomain()', () => {
  const entities = engine.getEntitiesForDomain('friday');
  if (!Array.isArray(entities) || entities.length === 0) throw new Error('Invalid entities');
});

test('isFeatureEnabled()', () => {
  const enabled = engine.isFeatureEnabled('engagement_letter', { domain: 'friday' });
  if (typeof enabled !== 'boolean') throw new Error('Invalid return type');
});

test('getThreshold()', () => {
  const threshold = engine.getThreshold('rfi.notification_days');
  if (!Array.isArray(threshold)) throw new Error('Invalid threshold');
});

test('getWorkflow()', () => {
  const workflow = engine.getWorkflow('engagement_lifecycle');
  if (!workflow.stages || !workflow.initial_stage) throw new Error('Invalid workflow');
});

test('getValidationRule()', () => {
  const rule = engine.getValidationRule('engagement_stage_transition');
  if (!rule.rule || !rule.description) throw new Error('Invalid rule');
});

test('getAllEntities()', () => {
  const entities = engine.getAllEntities();
  if (!Array.isArray(entities) || entities.length === 0) throw new Error('Invalid entities list');
});

test('getAllAutomations()', () => {
  const automations = engine.getAllAutomations();
  if (!Array.isArray(automations)) throw new Error('Invalid automations');
});

test('cacheSpec()', () => {
  const result = engine.cacheSpec('test_entity', { name: 'test_entity' });
  if (!result) throw new Error('Cache failed');
});

test('invalidateCache()', () => {
  const result = engine.invalidateCache();
  if (!result) throw new Error('Invalidate failed');
});

test('getRoles()', () => {
  const roles = engine.getRoles();
  if (!roles.partner || !roles.manager) throw new Error('Invalid roles');
});

test('getDomains()', () => {
  const domains = engine.getDomains();
  if (!domains.friday || !domains.mwr) throw new Error('Invalid domains');
});

test('getHighlightPalette()', () => {
  const palette = engine.getHighlightPalette();
  if (!Array.isArray(palette) || palette.length === 0) throw new Error('Invalid palette');
});

test('getSystemConfig()', () => {
  const system = engine.getSystemConfig();
  if (!system.database || !system.server) throw new Error('Invalid system config');
});

test('getIntegration()', () => {
  const integration = engine.getIntegration('google_drive');
  if (!integration.scopes) throw new Error('Invalid integration');
});

test('getDocumentTemplate()', () => {
  const template = engine.getDocumentTemplate('engagement_letter');
  if (!template.variables) throw new Error('Invalid template');
});

test('getStatusEnum()', () => {
  const statusEnum = engine.getStatusEnum('rfi_client_status');
  if (!statusEnum.pending || !statusEnum.sent) throw new Error('Invalid status enum');
});

test('Immutability check', () => {
  const spec = engine.generateEntitySpec('rfi');
  const isFrozen = Object.isFrozen(spec);
  if (!isFrozen) throw new Error('Object not frozen');
});

test('Variable resolution', () => {
  const spec = engine.generateEntitySpec('engagement');
  if (!spec.field_overrides) throw new Error('Field overrides not resolved');
});

test('Error handling for invalid entity', () => {
  try {
    engine.generateEntitySpec('nonexistent');
    throw new Error('Should have thrown error');
  } catch (e) {
    if (!e.message.includes('not found')) throw e;
  }
});

test('Singleton pattern', () => {
  const e1 = getConfigEngine();
  const e2 = getConfigEngine();
  if (e1 !== e2) throw new Error('Not singleton');
});

test('resetConfigEngine()', () => {
  resetConfigEngine();
  const e = getConfigEngine();
  if (!e) throw new Error('Failed to create new engine');
});

console.log('\n=== RESULTS ===');
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log('Total:', passed + failed);

if (failed > 0) {
  process.exit(1);
}
