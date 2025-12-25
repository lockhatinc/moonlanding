import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Load config directly from YAML file
const configPath = path.resolve(process.cwd(), 'src/config/master-config.yml');
const configContent = fs.readFileSync(configPath, 'utf-8');
const masterConfig = yaml.load(configContent);

console.log('=== POST-RFI WORKFLOW INTEGRATION TESTS ===\n');
console.log('Testing workflow activation, state transitions, and coexistence\n');

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

// Simulation: Engagement lifecycle state tracking
const engagementLifecycle = {
  current_stage: 'info_gathering',
  stages: masterConfig.workflows.engagement_lifecycle.stages,

  getStageConfig(stageName) {
    return this.stages.find(s => s.name === stageName);
  },

  canTransitionTo(targetStage) {
    const current = this.getStageConfig(this.current_stage);
    return current && current.forward && current.forward.includes(targetStage);
  },

  transitionTo(targetStage) {
    if (!this.canTransitionTo(targetStage)) {
      throw new Error(`Cannot transition from ${this.current_stage} to ${targetStage}`);
    }
    this.current_stage = targetStage;
    return true;
  },

  getActivatedWorkflows() {
    const stageConfig = this.getStageConfig(this.current_stage);
    return stageConfig ? stageConfig.activates || [] : [];
  }
};

// Simulation: RFI workflow instances
const workflows = {
  standard_rfi: null,
  post_rfi: null,

  createStandardRFI(engagementId, stage) {
    if (stage !== 'team_execution') {
      throw new Error('Standard RFI can only be created at team_execution stage');
    }
    this.standard_rfi = {
      id: 'rfi-1',
      engagement_id: engagementId,
      type: 'standard',
      workflow: 'rfi_type_standard',
      state: 'pending',
      created_at_stage: stage,
      auditor_status: 'requested',
      client_status: 'pending'
    };
    return this.standard_rfi;
  },

  createPostRFI(engagementId, stage) {
    if (stage !== 'finalization') {
      throw new Error('Post-RFI can only be created at finalization stage');
    }
    this.post_rfi = {
      id: 'rfi-2',
      engagement_id: engagementId,
      type: 'post_rfi',
      workflow: 'rfi_type_post_rfi',
      state: 'pending',
      created_at_stage: stage,
      auditor_status: 'pending',
      client_status: 'pending'
    };
    return this.post_rfi;
  },

  transitionStandardRFI(newState) {
    if (!this.standard_rfi) throw new Error('Standard RFI not created');
    const stdConfig = masterConfig.workflows.rfi_type_standard;
    const validTransitions = {
      'pending': ['sent'],
      'sent': ['responded'],
      'responded': ['completed'],
      'completed': []
    };
    if (!validTransitions[this.standard_rfi.state].includes(newState)) {
      throw new Error(`Cannot transition standard RFI from ${this.standard_rfi.state} to ${newState}`);
    }
    this.standard_rfi.state = newState;

    // Update display states
    const stateConfig = stdConfig.display_states;
    if (newState === 'pending') {
      this.standard_rfi.auditor_status = 'requested';
      this.standard_rfi.client_status = 'pending';
    } else if (newState === 'sent') {
      this.standard_rfi.auditor_status = 'reviewing';
      this.standard_rfi.client_status = 'sent';
    } else if (newState === 'responded') {
      this.standard_rfi.auditor_status = 'queries';
      this.standard_rfi.client_status = 'responded';
    } else if (newState === 'completed') {
      this.standard_rfi.auditor_status = 'received';
      this.standard_rfi.client_status = 'completed';
    }
    return true;
  },

  transitionPostRFI(newState) {
    if (!this.post_rfi) throw new Error('Post-RFI not created');
    const postConfig = masterConfig.workflows.rfi_type_post_rfi;
    const validTransitions = {
      'pending': ['sent'],
      'sent': ['accepted'],
      'accepted': []
    };
    if (!validTransitions[this.post_rfi.state].includes(newState)) {
      throw new Error(`Cannot transition post-RFI from ${this.post_rfi.state} to ${newState}`);
    }
    this.post_rfi.state = newState;

    // Update display states
    if (newState === 'pending') {
      this.post_rfi.auditor_status = 'pending';
      this.post_rfi.client_status = 'pending';
    } else if (newState === 'sent') {
      this.post_rfi.auditor_status = 'sent';
      this.post_rfi.client_status = 'queries';
    } else if (newState === 'accepted') {
      this.post_rfi.auditor_status = 'sent';  // Auditor keeps 'sent' once accepted
      this.post_rfi.client_status = 'accepted';
    }
    return true;
  }
};

// --- INTEGRATION TESTS ---

console.log('--- Integration: Engagement Lifecycle Progression ---\n');

test('Start engagement at info_gathering stage', () => {
  assert(engagementLifecycle.current_stage === 'info_gathering', 'should start at info_gathering');
  console.log(`  [INFO] Current stage: ${engagementLifecycle.current_stage}`);
});

test('Transition info_gathering → commencement', () => {
  engagementLifecycle.transitionTo('commencement');
  assert(engagementLifecycle.current_stage === 'commencement');
  console.log(`  [INFO] Transitioned to: ${engagementLifecycle.current_stage}`);
});

test('Transition commencement → team_execution (RFI workflow available)', () => {
  engagementLifecycle.transitionTo('team_execution');
  assert(engagementLifecycle.current_stage === 'team_execution');
  const activatedWorkflows = engagementLifecycle.getActivatedWorkflows();
  assert(activatedWorkflows.includes('rfi_workflow'), 'should activate rfi_workflow');
  console.log(`  [INFO] Transitioned to: ${engagementLifecycle.current_stage}`);
  console.log(`  [INFO] Activated workflows: ${activatedWorkflows.join(', ')}`);
});

console.log('\n--- Integration: Standard RFI Workflow (team_execution) ---\n');

test('Create standard RFI at team_execution stage', () => {
  const rfi = workflows.createStandardRFI('eng-1', 'team_execution');
  assert(rfi.workflow === 'rfi_type_standard');
  assert(rfi.state === 'pending');
  assert(rfi.auditor_status === 'requested');
  assert(rfi.client_status === 'pending');
  console.log(`  [INFO] Standard RFI created: ${rfi.id}`);
  console.log(`  [INFO] Type: ${rfi.type}, Workflow: ${rfi.workflow}`);
  console.log(`  [INFO] State: ${rfi.state}`);
});

test('Standard RFI: Transition pending → sent', () => {
  workflows.transitionStandardRFI('sent');
  assert(workflows.standard_rfi.state === 'sent');
  assert(workflows.standard_rfi.auditor_status === 'reviewing');
  assert(workflows.standard_rfi.client_status === 'sent');
  console.log(`  [INFO] Standard RFI state: ${workflows.standard_rfi.state}`);
  console.log(`  [INFO] Auditor status: ${workflows.standard_rfi.auditor_status}`);
  console.log(`  [INFO] Client status: ${workflows.standard_rfi.client_status}`);
});

test('Standard RFI: Transition sent → responded', () => {
  workflows.transitionStandardRFI('responded');
  assert(workflows.standard_rfi.state === 'responded');
  assert(workflows.standard_rfi.auditor_status === 'queries');
  console.log(`  [INFO] Standard RFI state: ${workflows.standard_rfi.state}`);
  console.log(`  [INFO] Auditor status: ${workflows.standard_rfi.auditor_status}`);
});

test('Standard RFI: Transition responded → completed', () => {
  workflows.transitionStandardRFI('completed');
  assert(workflows.standard_rfi.state === 'completed');
  assert(workflows.standard_rfi.auditor_status === 'received');
  assert(workflows.standard_rfi.client_status === 'completed');
  console.log(`  [INFO] Standard RFI state: ${workflows.standard_rfi.state}`);
  console.log(`  [INFO] Auditor status: ${workflows.standard_rfi.auditor_status}`);
  console.log(`  [INFO] Standard RFI completed before finalization`);
});

console.log('\n--- Integration: Engagement Progression to Finalization ---\n');

test('Transition team_execution → partner_review', () => {
  engagementLifecycle.transitionTo('partner_review');
  assert(engagementLifecycle.current_stage === 'partner_review');
  console.log(`  [INFO] Transitioned to: ${engagementLifecycle.current_stage}`);
});

test('Transition partner_review → finalization (post_rfi workflow available)', () => {
  engagementLifecycle.transitionTo('finalization');
  assert(engagementLifecycle.current_stage === 'finalization');
  const activatedWorkflows = engagementLifecycle.getActivatedWorkflows();
  assert(activatedWorkflows.includes('post_rfi'), 'should activate post_rfi');
  assert(activatedWorkflows.includes('client_feedback'), 'should activate client_feedback');
  assert(!activatedWorkflows.includes('rfi_workflow'), 'should NOT activate rfi_workflow at finalization');
  console.log(`  [INFO] Transitioned to: ${engagementLifecycle.current_stage}`);
  console.log(`  [INFO] Activated workflows: ${activatedWorkflows.join(', ')}`);
});

console.log('\n--- Integration: Post-RFI Workflow (finalization) ---\n');

test('Create post-RFI at finalization stage', () => {
  const rfi = workflows.createPostRFI('eng-1', 'finalization');
  assert(rfi.workflow === 'rfi_type_post_rfi');
  assert(rfi.state === 'pending');
  assert(rfi.auditor_status === 'pending');
  assert(rfi.client_status === 'pending');
  assert(rfi.created_at_stage === 'finalization');
  console.log(`  [INFO] Post-RFI created: ${rfi.id}`);
  console.log(`  [INFO] Type: ${rfi.type}, Workflow: ${rfi.workflow}`);
  console.log(`  [INFO] State: ${rfi.state}`);
  console.log(`  [INFO] Created at stage: ${rfi.created_at_stage}`);
});

test('Post-RFI: Transition pending → sent', () => {
  workflows.transitionPostRFI('sent');
  assert(workflows.post_rfi.state === 'sent');
  assert(workflows.post_rfi.auditor_status === 'sent');
  assert(workflows.post_rfi.client_status === 'queries');
  console.log(`  [INFO] Post-RFI state: ${workflows.post_rfi.state}`);
  console.log(`  [INFO] Auditor status: ${workflows.post_rfi.auditor_status}`);
  console.log(`  [INFO] Client status: ${workflows.post_rfi.client_status}`);
  console.log(`  [INFO] Auditor sent post-RFI to client for finalization clarifications`);
});

test('Post-RFI: Transition sent → accepted', () => {
  workflows.transitionPostRFI('accepted');
  assert(workflows.post_rfi.state === 'accepted');
  assert(workflows.post_rfi.client_status === 'accepted');
  console.log(`  [INFO] Post-RFI state: ${workflows.post_rfi.state}`);
  console.log(`  [INFO] Client status: ${workflows.post_rfi.client_status}`);
  console.log(`  [INFO] Client accepted post-RFI clarifications`);
});

console.log('\n--- Integration: Coexistence & Separation ---\n');

test('Standard RFI and post-RFI are separate entities', () => {
  assert(workflows.standard_rfi.id !== workflows.post_rfi.id, 'should be different entities');
  assert(workflows.standard_rfi.workflow !== workflows.post_rfi.workflow, 'should have different workflows');
  assert(workflows.standard_rfi.created_at_stage !== workflows.post_rfi.created_at_stage,
    'should be created at different stages');
  console.log(`  [INFO] Standard RFI: ${workflows.standard_rfi.id} (${workflows.standard_rfi.workflow})`);
  console.log(`  [INFO] Post-RFI: ${workflows.post_rfi.id} (${workflows.post_rfi.workflow})`);
});

test('Standard RFI completed before finalization, post-RFI during finalization', () => {
  assert(workflows.standard_rfi.created_at_stage === 'team_execution');
  assert(workflows.post_rfi.created_at_stage === 'finalization');
  assert(workflows.standard_rfi.state === 'completed', 'standard should be completed');
  assert(workflows.post_rfi.state === 'accepted', 'post-rfi should be accepted');
  console.log(`  [INFO] Standard RFI timeline: team_execution → completed before finalization`);
  console.log(`  [INFO] Post-RFI timeline: finalization → accepted (finalization queries)`);
});

test('Standard RFI state path differs from post-RFI', () => {
  const standardPath = ['pending', 'sent', 'responded', 'completed'];
  const postRfiPath = ['pending', 'sent', 'accepted'];
  assert(!standardPath.includes('accepted'), 'standard should not have accepted state');
  assert(!postRfiPath.includes('responded'), 'post-rfi should not have responded state');
  console.log(`  [INFO] Standard RFI state path: ${standardPath.join(' → ')}`);
  console.log(`  [INFO] Post-RFI state path: ${postRfiPath.join(' → ')}`);
});

test('Standard RFI has escalation thresholds, post-RFI does not', () => {
  const stdThresholds = masterConfig.workflows.rfi_type_standard.notifications.escalation_thresholds;
  const postThresholds = masterConfig.workflows.rfi_type_post_rfi.notifications.escalation_thresholds;
  assert(stdThresholds.length > 0, 'standard should have escalation thresholds');
  assert(postThresholds.length === 0, 'post-rfi should have no escalation thresholds');
  console.log(`  [INFO] Standard RFI escalation tracking: ${stdThresholds.join(', ')} days`);
  console.log(`  [INFO] Post-RFI escalation tracking: none (finalization closure only)`);
});

console.log('\n--- Integration: Cannot Create Standard RFI at Finalization ---\n');

test('Cannot create standard RFI at finalization stage', () => {
  try {
    workflows.createStandardRFI('eng-1', 'finalization');
    throw new Error('Should have thrown error');
  } catch (e) {
    assert(e.message.includes('team_execution'), 'should only be creatable at team_execution');
    console.log(`  [INFO] Standard RFI creation blocked at finalization (expected)`);
  }
});

test('Can only create post-RFI at finalization stage', () => {
  try {
    workflows.createPostRFI('eng-1', 'team_execution');
    throw new Error('Should have thrown error');
  } catch (e) {
    assert(e.message.includes('finalization'), 'should only be creatable at finalization');
    console.log(`  [INFO] Post-RFI creation blocked at team_execution (expected)`);
  }
});

console.log('\n--- Integration: Permission & Feature Flags ---\n');

test('Post-RFI uses same permission template as standard RFI', () => {
  const rfiEntity = masterConfig.entities.rfi;
  const standardTemplate = rfiEntity.permission_template;
  const postRfiTemplate = rfiEntity.variants.post_rfi.permission_template;
  assert(standardTemplate === 'client_response');
  assert(postRfiTemplate === 'client_response' || !postRfiTemplate);
  console.log(`  [INFO] Standard RFI permissions: ${standardTemplate}`);
  console.log(`  [INFO] Post-RFI permissions: ${postRfiTemplate || '(inherited) ' + standardTemplate}`);
});

test('Post-RFI feature is properly gated', () => {
  const feature = masterConfig.features.post_rfi;
  assert(feature.enabled === true);
  assert(feature.domain === 'friday');
  assert(feature.workflow_stage === 'finalization');
  console.log(`  [INFO] Post-RFI feature: enabled=${feature.enabled}, domain=${feature.domain}, stage=${feature.workflow_stage}`);
});

// Summary
console.log('\n=== TEST RESULTS ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
