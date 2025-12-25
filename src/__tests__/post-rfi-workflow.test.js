import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Load config directly from YAML file
const configPath = path.resolve(process.cwd(), 'src/config/master-config.yml');
const configContent = fs.readFileSync(configPath, 'utf-8');
const masterConfig = yaml.load(configContent);

console.log('=== POST-RFI WORKFLOW TESTS ===\n');

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

const assert = (condition, message) => {
  if (!condition) throw new Error(message || 'Assertion failed');
};

// Test 35: Post-RFI is distinct workflow from standard RFI
console.log('\n--- TEST 35: Post-RFI distinct from standard RFI ---\n');

test('RFI entity definition exists', () => {
  const rfiEntity = masterConfig.entities?.rfi;
  assert(rfiEntity, 'RFI entity not found in config');
  console.log('  [INFO] RFI entity found');
});

test('RFI entity has variants section with post_rfi', () => {
  const rfiEntity = masterConfig.entities?.rfi;
  assert(rfiEntity?.variants, 'RFI entity should have variants');
  assert(rfiEntity?.variants?.post_rfi, 'RFI variants should include post_rfi');
  console.log('  [INFO] RFI has post_rfi variant');
});

test('post_rfi variant has different workflow from standard', () => {
  const rfiEntity = masterConfig.entities?.rfi;
  const standardWorkflow = rfiEntity?.workflow;
  const postRfiWorkflow = rfiEntity?.variants?.post_rfi?.workflow;
  assert(postRfiWorkflow && postRfiWorkflow !== standardWorkflow,
    `post_rfi workflow (${postRfiWorkflow}) should differ from standard (${standardWorkflow})`);
  console.log(`  [INFO] Standard workflow: ${standardWorkflow}`);
  console.log(`  [INFO] Post-RFI workflow: ${postRfiWorkflow}`);
});

test('post_rfi variant activates at finalization stage', () => {
  const rfiEntity = masterConfig.entities?.rfi;
  const activationStage = rfiEntity?.variants?.post_rfi?.activates_at_stage;
  assert(activationStage === 'finalization',
    `post_rfi should activate at 'finalization', got '${activationStage}'`);
  console.log(`  [INFO] post_rfi activates at stage: ${activationStage}`);
});

test('Standard RFI workflow (rfi_type_standard) has correct states', () => {
  const standardWorkflow = masterConfig.workflows?.rfi_type_standard;
  assert(standardWorkflow, 'rfi_type_standard workflow not found');
  assert(standardWorkflow.type === 'standard', 'workflow type should be "standard"');
  assert(Array.isArray(standardWorkflow.internal_states), 'internal_states should be array');
  assert(standardWorkflow.internal_states.includes('pending'), 'should have pending state');
  assert(standardWorkflow.internal_states.includes('sent'), 'should have sent state');
  assert(standardWorkflow.internal_states.includes('responded'), 'should have responded state');
  console.log(`  [INFO] Standard RFI states: ${standardWorkflow.internal_states.join(', ')}`);
  console.log(`  [INFO] Standard RFI auditor display states: ${standardWorkflow.display_states.auditor.join(', ')}`);
});

test('Post-RFI workflow (rfi_type_post_rfi) has different states than standard', () => {
  const postRfiWorkflow = masterConfig.workflows?.rfi_type_post_rfi;
  assert(postRfiWorkflow, 'rfi_type_post_rfi workflow not found');
  assert(postRfiWorkflow.type === 'post_rfi', 'workflow type should be "post_rfi"');
  assert(Array.isArray(postRfiWorkflow.internal_states), 'internal_states should be array');
  assert(postRfiWorkflow.internal_states.includes('pending'), 'should have pending state');
  assert(postRfiWorkflow.internal_states.includes('sent'), 'should have sent state');
  assert(postRfiWorkflow.internal_states.includes('accepted'), 'should have accepted state');
  assert(!postRfiWorkflow.internal_states.includes('responded'), 'should NOT have responded state (differs from standard)');
  console.log(`  [INFO] Post-RFI states: ${postRfiWorkflow.internal_states.join(', ')}`);
  console.log(`  [INFO] Post-RFI auditor display states: ${postRfiWorkflow.display_states.auditor.join(', ')}`);
  console.log(`  [INFO] Post-RFI client display states: ${postRfiWorkflow.display_states.client.join(', ')}`);
});

test('Finalization stage activates post_rfi workflow', () => {
  const lifecycle = masterConfig.workflows?.engagement_lifecycle;
  const finalizationStage = lifecycle?.stages?.find(s => s.name === 'finalization');
  assert(finalizationStage, 'finalization stage not found');
  assert(Array.isArray(finalizationStage?.activates), 'finalization stage should have activates list');
  assert(finalizationStage.activates.includes('post_rfi'), 'finalization should activate post_rfi');
  console.log(`  [INFO] Finalization stage activates: ${finalizationStage.activates.join(', ')}`);
});

test('Standard RFI activates in team_execution stage, not finalization', () => {
  const lifecycle = masterConfig.workflows?.engagement_lifecycle;
  const teamExecutionStage = lifecycle?.stages?.find(s => s.name === 'team_execution');
  const finalizationStage = lifecycle?.stages?.find(s => s.name === 'finalization');
  assert(teamExecutionStage?.activates?.includes('rfi_workflow'),
    'team_execution should activate rfi_workflow');
  assert(!finalizationStage?.activates?.includes('rfi_workflow'),
    'finalization should NOT activate rfi_workflow (only post_rfi)');
  console.log(`  [INFO] Standard RFI activated in: team_execution stage`);
  console.log(`  [INFO] Post-RFI activated in: finalization stage`);
});

// Test 36: Post-RFI auditor states (Pending, Sent)
console.log('\n--- TEST 36: Post-RFI auditor states (Pending, Sent) ---\n');

test('Post-RFI auditor display states include Pending and Sent', () => {
  const postRfiWorkflow = masterConfig.workflows?.rfi_type_post_rfi;
  const auditorStates = postRfiWorkflow?.display_states?.auditor || [];
  assert(auditorStates.includes('pending'), 'auditor states should include pending');
  assert(auditorStates.includes('sent'), 'auditor states should include sent');
  console.log(`  [INFO] Post-RFI auditor states: ${auditorStates.join(', ')}`);
});

test('Post-RFI has no escalation thresholds (unlike standard)', () => {
  const postRfiWorkflow = masterConfig.workflows?.rfi_type_post_rfi;
  const escalationThresholds = postRfiWorkflow?.notifications?.escalation_thresholds || [];
  assert(Array.isArray(escalationThresholds), 'escalation_thresholds should be array');
  assert(escalationThresholds.length === 0, 'post_rfi should not have escalation thresholds');
  console.log(`  [INFO] Post-RFI escalation thresholds: none (${escalationThresholds.length} items)`);
});

test('Standard RFI has escalation thresholds', () => {
  const standardWorkflow = masterConfig.workflows?.rfi_type_standard;
  const escalationThresholds = standardWorkflow?.notifications?.escalation_thresholds || [];
  assert(Array.isArray(escalationThresholds), 'escalation_thresholds should be array');
  assert(escalationThresholds.length > 0, 'standard rfi should have escalation thresholds');
  console.log(`  [INFO] Standard RFI escalation thresholds: ${escalationThresholds.join(', ')} days`);
});

test('Standard RFI uses rfi_type_standard workflow in entity definition', () => {
  const rfiEntity = masterConfig.entities?.rfi;
  assert(rfiEntity?.workflow === 'rfi_type_standard',
    `RFI workflow should be rfi_type_standard, got ${rfiEntity?.workflow}`);
  console.log(`  [INFO] Standard RFI uses workflow: ${rfiEntity.workflow}`);
});

// Test 37: Post-RFI client states (Pending, Queries, Accepted)
console.log('\n--- TEST 37: Post-RFI client states (Pending, Queries, Accepted) ---\n');

test('Post-RFI client display states include Pending, Queries, Accepted', () => {
  const postRfiWorkflow = masterConfig.workflows?.rfi_type_post_rfi;
  const clientStates = postRfiWorkflow?.display_states?.client || [];
  assert(clientStates.includes('pending'), 'client states should include pending');
  assert(clientStates.includes('queries'), 'client states should include queries');
  assert(clientStates.includes('accepted'), 'client states should include accepted');
  console.log(`  [INFO] Post-RFI client states: ${clientStates.join(', ')}`);
});

test('Standard RFI client states differ from post-RFI', () => {
  const standardWorkflow = masterConfig.workflows?.rfi_type_standard;
  const postRfiWorkflow = masterConfig.workflows?.rfi_type_post_rfi;
  const standardClientStates = standardWorkflow?.display_states?.client || [];
  const postRfiClientStates = postRfiWorkflow?.display_states?.client || [];

  console.log(`  [INFO] Standard RFI client states: ${standardClientStates.join(', ')}`);
  console.log(`  [INFO] Post-RFI client states: ${postRfiClientStates.join(', ')}`);

  const standardSet = new Set(standardClientStates);
  const postRfiSet = new Set(postRfiClientStates);
  const hasDifference = [...standardSet].some(s => !postRfiSet.has(s)) ||
                        [...postRfiSet].some(s => !standardSet.has(s));
  assert(hasDifference, 'post-rfi and standard rfi should have different client state sets');
});

test('Post-RFI requires file upload OR text response', () => {
  const postRfiWorkflow = masterConfig.workflows?.rfi_type_post_rfi;
  const requiresCompletion = postRfiWorkflow?.requires_completion;
  assert(requiresCompletion, 'post_rfi should define requires_completion');
  assert(typeof requiresCompletion === 'string', 'requires_completion should be a string');
  assert(requiresCompletion.includes('OR') || requiresCompletion === 'file_upload OR text_response',
    `completion should require 'file_upload OR text_response', got '${requiresCompletion}'`);
  console.log(`  [INFO] Post-RFI requires completion: ${requiresCompletion}`);
});

test('Standard RFI also requires file upload OR text response', () => {
  const standardWorkflow = masterConfig.workflows?.rfi_type_standard;
  const requiresCompletion = standardWorkflow?.requires_completion;
  assert(requiresCompletion, 'standard rfi should define requires_completion');
  assert(requiresCompletion.includes('OR') || requiresCompletion === 'file_upload OR text_response',
    `completion should require 'file_upload OR text_response', got '${requiresCompletion}'`);
  console.log(`  [INFO] Standard RFI requires completion: ${requiresCompletion}`);
});

test('Post-RFI has no deadline warnings (unlike standard)', () => {
  const postRfiWorkflow = masterConfig.workflows?.rfi_type_post_rfi;
  const deadlineWarnings = postRfiWorkflow?.notifications?.deadline_warnings || [];
  assert(Array.isArray(deadlineWarnings), 'deadline_warnings should be array');
  assert(deadlineWarnings.length === 0, 'post_rfi should not have deadline warnings');
  console.log(`  [INFO] Post-RFI deadline warnings: none (${deadlineWarnings.length} items)`);
});

test('Standard RFI has deadline warnings', () => {
  const standardWorkflow = masterConfig.workflows?.rfi_type_standard;
  const deadlineWarnings = standardWorkflow?.notifications?.deadline_warnings || [];
  assert(Array.isArray(deadlineWarnings), 'deadline_warnings should be array');
  assert(deadlineWarnings.length > 0, 'standard rfi should have deadline warnings');
  console.log(`  [INFO] Standard RFI deadline warnings: ${deadlineWarnings.join(', ')} days`);
});

// Test workflow activation and lifecycle
console.log('\n--- TEST: Workflow activation at lifecycle stages ---\n');

test('Engagement lifecycle has finalization stage with post_rfi activation', () => {
  const lifecycle = masterConfig.workflows?.engagement_lifecycle;
  assert(lifecycle, 'engagement_lifecycle not found');
  assert(Array.isArray(lifecycle?.stages), 'stages should be array');

  const stages = lifecycle.stages || [];
  const finalization = stages.find(s => s.name === 'finalization');
  assert(finalization, 'finalization stage not found');
  assert(Array.isArray(finalization?.activates), 'finalization should have activates array');
  assert(finalization.activates.length > 0, 'finalization should activate at least one workflow');
  assert(finalization.activates.includes('post_rfi'), 'finalization should activate post_rfi');
  console.log(`  [INFO] Finalization stage order: ${finalization.order}`);
  console.log(`  [INFO] Finalization activates: ${finalization.activates.join(', ')}`);
});

test('Post-RFI uses same permission template as standard RFI', () => {
  const rfiEntity = masterConfig.entities?.rfi;
  const standardPermTemplate = rfiEntity?.permission_template;
  const postRfiPermTemplate = rfiEntity?.variants?.post_rfi?.permission_template;
  const expectedTemplate = 'client_response';

  assert(standardPermTemplate === expectedTemplate,
    `standard should use ${expectedTemplate}, got ${standardPermTemplate}`);
  assert(postRfiPermTemplate === expectedTemplate || !postRfiPermTemplate,
    `post_rfi should inherit or explicitly use ${expectedTemplate}`);
  console.log(`  [INFO] Standard RFI permission template: ${standardPermTemplate}`);
  console.log(`  [INFO] Post-RFI permission template: ${postRfiPermTemplate || '(inherited: ' + standardPermTemplate + ')'}`);
});

test('Post-RFI feature is enabled in features config', () => {
  const postRfiFeature = masterConfig.features?.post_rfi;
  assert(postRfiFeature, 'post_rfi feature not found in config');
  assert(postRfiFeature.enabled === true, 'post_rfi feature should be enabled');
  assert(postRfiFeature.domain === 'friday', 'post_rfi should be in friday domain');
  assert(postRfiFeature.workflow_stage === 'finalization', 'post_rfi should activate at finalization stage');
  console.log(`  [INFO] Post-RFI feature enabled: ${postRfiFeature.enabled}`);
  console.log(`  [INFO] Post-RFI domain: ${postRfiFeature.domain}`);
  console.log(`  [INFO] Post-RFI workflow stage: ${postRfiFeature.workflow_stage}`);
  console.log(`  [INFO] Post-RFI description: ${postRfiFeature.description}`);
});

// Summary
console.log('\n=== TEST RESULTS ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
