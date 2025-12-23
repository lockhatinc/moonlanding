import { getConfigEngine } from './src/lib/config-generator-engine.js';

const engine = getConfigEngine();

console.log('\n┌─────────────────────────────────────────────────────────┐');
console.log('│         ConfigGeneratorEngine - Live Demo              │');
console.log('└─────────────────────────────────────────────────────────┘\n');

console.log('📦 Loading master-config.yml...');
const entities = engine.getAllEntities();
console.log(`   ✓ Loaded ${entities.length} entities\n`);

console.log('🔧 Generating entity spec for "engagement"...');
const spec = engine.generateEntitySpec('engagement');
console.log('   ✓ Generated spec:');
console.log('     - Name:', spec.name);
console.log('     - Label:', spec.label);
console.log('     - Has permissions:', !!spec.permissions);
console.log('     - Has workflow:', !!spec.workflow);
console.log('     - Children:', spec.children.join(', '));
console.log('');

console.log('🔐 Loading permission template "standard_auditor"...');
const perms = engine.getPermissionTemplate('standard_auditor');
console.log('   ✓ Permissions for roles:');
console.log('     - Partner:', perms.partner.slice(0, 3).join(', '), '...');
console.log('     - Manager:', perms.manager.slice(0, 3).join(', '), '...');
console.log('');

console.log('📊 Getting threshold "rfi.notification_days"...');
const threshold = engine.getThreshold('rfi.notification_days');
console.log('   ✓ Threshold:', threshold.join(', '), 'days');
console.log('');

console.log('🔄 Getting workflow "engagement_lifecycle"...');
const workflow = engine.getWorkflow('engagement_lifecycle');
console.log('   ✓ Workflow:');
console.log('     - Initial stage:', workflow.initial_stage);
console.log('     - Final stage:', workflow.final_stage);
console.log('     - Total stages:', workflow.stages.length);
console.log('');

console.log('🎨 Getting domain entities...');
const friday = engine.getEntitiesForDomain('friday');
const mwr = engine.getEntitiesForDomain('mwr');
console.log('   ✓ Friday domain:', friday.slice(0, 4).join(', '), '...');
console.log('   ✓ MWR domain:', mwr.slice(0, 4).join(', '), '...');
console.log('');

console.log('🚀 Checking feature "engagement_letter"...');
const enabled = engine.isFeatureEnabled('engagement_letter', { domain: 'friday' });
console.log('   ✓ Feature enabled:', enabled);
console.log('');

console.log('⏰ Getting automation jobs...');
const automations = engine.getAllAutomations();
console.log('   ✓ Total jobs:', automations.length);
console.log('     -', automations[0].name, '(' + automations[0].trigger + ')');
console.log('     -', automations[1].name, '(' + automations[1].trigger + ')');
console.log('');

console.log('✨ Performance test (1000 cached reads)...');
const start = Date.now();
for (let i = 0; i < 1000; i++) {
  engine.generateEntitySpec('engagement');
}
const elapsed = Date.now() - start;
console.log(`   ✓ 1000 reads in ${elapsed}ms (${(elapsed/1000).toFixed(2)}ms avg)`);
console.log('');

console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│                  Demo Complete! ✅                       │');
console.log('└─────────────────────────────────────────────────────────┘\n');
