export const HELPERS = {
  config: null,
  domains: null,
  engine: null,

  async init(configEngine, domainLoader) {
    this.engine = configEngine;
    this.config = configEngine?.getConfig() || {};
    this.domains = domainLoader;
  },

  status() {
    return {
      configLoaded: !!this.config && Object.keys(this.config).length > 0,
      engineReady: !!this.engine,
      domainsReady: !!this.domains,
      entities: Object.keys(this.config.entities || {}).length,
      roles: Object.keys(this.config.roles || {}).length,
      permissions: Object.keys(this.config.permission_templates || {}).length,
      workflows: Object.keys(this.config.workflows || {}).length,
      thresholds: Object.keys(this.config.thresholds || {}).length,
      automations: Object.keys(this.config.automations || {}).length,
    };
  },

  quickTest() {
    console.log('=== QUICK SYSTEM TEST ===');
    const status = this.status();
    console.log('System Status:', status);

    try {
      console.log('\n1. Testing Config Generator...');
      const engagementSpec = this.engine.generateEntitySpec('engagement');
      console.log('   ✓ engagement spec generated:', { fields: engagementSpec.fields.length });

      console.log('\n2. Testing Permission Templates...');
      const perms = this.engine.getPermissionTemplate('standard_auditor');
      console.log('   ✓ standard_auditor template loaded:', Object.keys(perms).length, 'roles');

      console.log('\n3. Testing Domain Loader...');
      const fridayEntities = this.domains.getEntitiesForDomain('friday');
      const mwrEntities = this.domains.getEntitiesForDomain('mwr');
      console.log('   ✓ friday entities:', fridayEntities.length);
      console.log('   ✓ mwr entities:', mwrEntities.length);

      console.log('\n4. Testing Thresholds...');
      const rfiDays = this.engine.getThreshold('rfi', 'notification_days');
      console.log('   ✓ RFI notification days:', rfiDays);

      console.log('\n✓ All quick tests passed!');
      return true;
    } catch (e) {
      console.error('\n✗ Test failed:', e.message);
      return false;
    }
  },

  debugEntity(entityName) {
    console.log(`\n=== DEBUGGING ENTITY: ${entityName} ===`);
    try {
      const spec = this.engine.generateEntitySpec(entityName);
      console.log('Name:', spec.name);
      console.log('Label:', spec.label);
      console.log('Fields:', spec.fields.length);
      console.log('Field names:', spec.fields.map(f => f.name));
      console.log('Required fields:', spec.fields.filter(f => f.required).map(f => f.name));
      console.log('Validation rules:', spec.validation || 'none');
      console.log('Full spec:', spec);
      return spec;
    } catch (e) {
      console.error(`Error debugging ${entityName}:`, e.message);
      return null;
    }
  },

  debugDomains() {
    console.log('\n=== DEBUGGING DOMAINS ===');
    try {
      console.log('\nFRIDAY Entities:');
      const friday = this.domains.getEntitiesForDomain('friday');
      console.table(friday.map((e, i) => ({ '#': i + 1, entity: e })));

      console.log('\nMWR Entities:');
      const mwr = this.domains.getEntitiesForDomain('mwr');
      console.table(mwr.map((e, i) => ({ '#': i + 1, entity: e })));

      console.log('\nFRIDAY Features:');
      const fridayFeatures = this.domains.getFeaturesForDomain('friday');
      console.log(Object.keys(fridayFeatures).filter(f => fridayFeatures[f]));

      console.log('\nMWR Features:');
      const mwrFeatures = this.domains.getFeaturesForDomain('mwr');
      console.log(Object.keys(mwrFeatures).filter(f => mwrFeatures[f]));
    } catch (e) {
      console.error('Error debugging domains:', e.message);
    }
  },

  debugPermissions(templateName) {
    console.log(`\n=== DEBUGGING PERMISSION TEMPLATE: ${templateName} ===`);
    try {
      const template = this.engine.getPermissionTemplate(templateName);
      console.log('Template:', template);
      for (const [role, actions] of Object.entries(template)) {
        console.log(`${role}:`, actions);
      }
      return template;
    } catch (e) {
      console.error(`Error debugging ${templateName}:`, e.message);
      return null;
    }
  },

  debugThresholds(category) {
    console.log(`\n=== DEBUGGING THRESHOLDS: ${category} ===`);
    try {
      const thresholds = this.config.thresholds?.[category];
      if (!thresholds) {
        console.error(`Category "${category}" not found`);
        return null;
      }
      console.table(thresholds);
      return thresholds;
    } catch (e) {
      console.error('Error debugging thresholds:', e.message);
      return null;
    }
  },

  debugWorkflow(workflowName) {
    console.log(`\n=== DEBUGGING WORKFLOW: ${workflowName} ===`);
    try {
      const workflow = this.engine.getWorkflow(workflowName);
      console.log('Workflow:', workflow);
      if (workflow.states) {
        console.log('\nStates:', workflow.states.map(s => s.name || s.value));
      }
      if (workflow.transitions) {
        console.log('\nTransitions:');
        console.table(workflow.transitions);
      }
      return workflow;
    } catch (e) {
      console.error('Error debugging workflow:', e.message);
      return null;
    }
  },

  listAll(section) {
    const label = section.toUpperCase();
    console.log(`\n=== ALL ${label} ===`);
    const items = this.config[section] || {};
    const list = Object.keys(items);
    console.table(list.map((item, i) => ({ '#': i + 1, name: item })));
    return list;
  },

  testEntityGeneration() {
    console.log('\n=== TESTING ALL ENTITY GENERATION ===');
    const entities = this.engine.getAllEntities();
    const results = [];

    for (const entity of entities) {
      try {
        const spec = this.engine.generateEntitySpec(entity.name);
        results.push({
          entity: entity.name,
          status: '✓',
          fields: spec.fields.length,
          required: spec.fields.filter(f => f.required).length,
        });
      } catch (e) {
        results.push({
          entity: entity.name,
          status: '✗',
          error: e.message,
        });
      }
    }

    console.table(results);
    const passed = results.filter(r => r.status === '✓').length;
    console.log(`\nResult: ${passed}/${entities.length} entities generated successfully`);
    return results;
  },

  inspectMasterConfig() {
    console.log('\n=== MASTER CONFIG STRUCTURE ===');
    const sections = Object.keys(this.config);
    console.table(sections.map((section, i) => ({
      '#': i + 1,
      section,
      items: Array.isArray(this.config[section])
        ? this.config[section].length
        : typeof this.config[section] === 'object'
          ? Object.keys(this.config[section]).length
          : 'N/A',
    })));
    return sections;
  },
};

export function initDebugHelpers() {
  if (typeof window !== 'undefined') {
    window.__HELPERS__ = HELPERS;
    console.log('[DEBUG] Helper functions initialized: window.__HELPERS__');
    console.log('[QUICK START] Run: window.__HELPERS__.quickTest()');
  }
}
