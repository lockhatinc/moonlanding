import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.cache.has(key);
  }
}

export class ConfigGeneratorEngine {
  constructor(masterConfig) {
    if (!masterConfig) {
      throw new Error('[ConfigGeneratorEngine] masterConfig is required. Pass parsed config from system-config-loader.');
    }
    this.masterConfig = this._deepFreeze(masterConfig);
    this.specCache = new LRUCache(100);
    this.debugMode = false;
  }

  _getConfig() {
    if (!this.masterConfig) {
      throw new Error('[ConfigGeneratorEngine] Config not initialized');
    }
    return this.masterConfig;
  }

  _deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return Object.freeze(obj.map(item => this._deepFreeze(item)));
    }

    const frozen = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        frozen[key] = this._deepFreeze(obj[key]);
      }
    }

    return Object.freeze(frozen);
  }

  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this._deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this._deepClone(obj[key]);
      }
    }

    return cloned;
  }

  _resolveVariableReferences(value, config) {
    if (typeof value !== 'string') {
      return value;
    }

    if (!value.startsWith('$')) {
      return value;
    }

    const path = value.slice(1).split('.');
    let current = config;

    for (const segment of path) {
      if (current === null || current === undefined) {
        console.warn(`[ConfigGeneratorEngine] Variable reference ${value} resolved to null/undefined`);
        return null;
      }

      const arrayMatch = segment.match(/^(\w+)\[(\d+|\*)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        current = current[arrayName];

        if (!Array.isArray(current)) {
          console.warn(`[ConfigGeneratorEngine] Expected array at ${arrayName}, got ${typeof current}`);
          return null;
        }

        if (index === '*') {
          return current;
        }

        current = current[parseInt(index, 10)];
      } else {
        current = current[segment];
      }
    }

    return current;
  }

  _recursiveResolve(obj, config) {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this._resolveVariableReferences(obj, config);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this._recursiveResolve(item, config));
    }

    if (typeof obj === 'object') {
      const resolved = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          resolved[key] = this._recursiveResolve(obj[key], config);
        }
      }
      return resolved;
    }

    return obj;
  }

  _mergeObjects(base, override) {
    if (!override || typeof override !== 'object' || Array.isArray(override)) {
      return override;
    }

    const merged = this._deepClone(base);

    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (typeof override[key] === 'object' && !Array.isArray(override[key]) &&
            typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
          merged[key] = this._mergeObjects(merged[key], override[key]);
        } else {
          merged[key] = this._deepClone(override[key]);
        }
      }
    }

    return merged;
  }

  generateEntitySpec(entityName) {
    if (!entityName || typeof entityName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] generateEntitySpec: entityName must be a non-empty string');
    }

    const cacheKey = `spec:${entityName}`;
    const cached = this.specCache.get(cacheKey);

    if (cached) {
      if (this.debugMode) {
        console.log(`[ConfigGeneratorEngine] Returning cached spec for ${entityName}`);
      }
      return this._deepFreeze(this._deepClone(cached));
    }

    const config = this._getConfig();

    let actualEntityName = entityName;
    let entityDef = config.entities?.[entityName];

    if (!entityDef) {
      const match = Object.keys(config.entities || {}).find(key => {
        const def = config.entities[key];
        const plural = def.label_plural || def.label || key;
        return plural.toLowerCase() === entityName.toLowerCase();
      });

      if (match) {
        actualEntityName = match;
        entityDef = config.entities[match];
      }
    }

    if (!entityDef) {
      throw new Error(`[ConfigGeneratorEngine] Entity "${entityName}" not found in master config`);
    }

    entityDef = this._deepClone(entityDef);

    const childrenObj = {};
    if (entityDef.children && Array.isArray(entityDef.children)) {
      entityDef.children.forEach(childName => {
        childrenObj[childName] = { entity: childName };
      });
    }

    const spec = {
      name: actualEntityName,
      label: entityDef.label || actualEntityName,
      labelPlural: entityDef.label_plural || entityDef.label || entityName,
      icon: entityDef.icon || 'Circle',
      order: entityDef.order || 999,
      parent: entityDef.parent || null,
      children: childrenObj,
      computed_fields: entityDef.computed_fields || [],
      has_timeline: entityDef.has_timeline || false,
      has_roles: entityDef.has_roles || [],
      has_pdf_viewer: entityDef.has_pdf_viewer || false,
      has_collaboration: entityDef.has_collaboration || false,
      has_tender_tracking: entityDef.has_tender_tracking || false,
      has_notifications: entityDef.has_notifications || false,
      has_authentication: entityDef.has_authentication || false,
      has_google_sync: entityDef.has_google_sync || false,
      recreation_enabled: entityDef.recreation_enabled || false,
      recreation_intervals: entityDef.recreation_intervals || [],
      immutable: entityDef.immutable || false,
      immutable_strategy: entityDef.immutable_strategy || null,
      state_machine: entityDef.state_machine || false,
      row_access: entityDef.row_access || null,
      entityDef: entityDef,
    };

    if (entityDef.permission_template) {
      const permissionMatrix = this.getPermissionTemplate(entityDef.permission_template);
      spec.permissions = permissionMatrix;
    }

    if (entityDef.workflow) {
      const workflow = this.getWorkflow(entityDef.workflow);
      spec.workflow = workflow;
      spec.workflowDef = workflow;
    }

    if (entityDef.field_overrides) {
      spec.field_overrides = this._recursiveResolve(entityDef.field_overrides, config);
      spec.fields = this._generateFieldsFromOverrides(spec.field_overrides);
    }

    if (entityDef.fields) {
      if (!spec.fields) spec.fields = {};
      const resolvedEntityFields = this._recursiveResolve(entityDef.fields, config);
      for (const [fieldName, fieldDef] of Object.entries(resolvedEntityFields)) {
        if (spec.fields[fieldName]) {
          spec.fields[fieldName] = { ...fieldDef, ...spec.fields[fieldName] };
        } else {
          spec.fields[fieldName] = fieldDef;
        }
      }
    }

    if (!spec.fields) {
      spec.fields = this._generateDefaultFields(entityName);
    }

    spec.fields = this._ensureFieldLabels(spec.fields);

    spec.options = this._buildEnumOptions(spec.fields, spec.workflow, config);

    if (entityDef.variants) {
      spec.variants = this._deepClone(entityDef.variants);
    }

    const resolvedSpec = this._recursiveResolve(spec, config);
    const frozenSpec = this._deepFreeze(resolvedSpec);

    this.specCache.set(cacheKey, frozenSpec);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Generated and cached spec for ${entityName}`);
    }

    return this._deepFreeze(this._deepClone(frozenSpec));
  }

  getPermissionTemplate(templateName) {
    if (!templateName || typeof templateName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getPermissionTemplate: templateName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.permission_templates || !config.permission_templates[templateName]) {
      throw new Error(`[ConfigGeneratorEngine] Permission template "${templateName}" not found`);
    }

    const template = config.permission_templates[templateName];
    const cloned = this._deepClone(template);

    return this._deepFreeze(cloned);
  }

  generateNotificationHandler(notificationName) {
    if (!notificationName || typeof notificationName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] generateNotificationHandler: notificationName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.notifications || !config.notifications[notificationName]) {
      throw new Error(`[ConfigGeneratorEngine] Notification "${notificationName}" not found`);
    }

    const notificationDef = this._deepClone(config.notifications[notificationName]);
    const resolved = this._recursiveResolve(notificationDef, config);

    const handler = {
      name: notificationName,
      description: resolved.description || '',
      trigger: resolved.trigger,
      thresholds: resolved.thresholds || [],
      recipients: resolved.recipients || [],
      template: resolved.template,
      enabled: resolved.enabled !== false,
      batch: resolved.batch || false,
      channels: this._extractChannels(resolved.recipients),
    };

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Generated notification handler for ${notificationName}`);
    }

    return this._deepFreeze(handler);
  }

  _extractChannels(recipients) {
    const channels = new Set();

    if (!Array.isArray(recipients)) {
      return [];
    }

    for (const recipient of recipients) {
      if (recipient.channels && Array.isArray(recipient.channels)) {
        recipient.channels.forEach(ch => channels.add(ch));
      }
    }

    return Array.from(channels);
  }

  generateAutomationJob(scheduleName) {
    if (!scheduleName || typeof scheduleName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] generateAutomationJob: scheduleName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.automation || !config.automation.schedules) {
      throw new Error('[ConfigGeneratorEngine] No automation schedules found in master config');
    }

    const schedule = config.automation.schedules.find(s => s.name === scheduleName);

    if (!schedule) {
      throw new Error(`[ConfigGeneratorEngine] Automation schedule "${scheduleName}" not found`);
    }

    const scheduleDef = this._deepClone(schedule);
    const resolved = this._recursiveResolve(scheduleDef, config);

    const job = {
      name: resolved.name,
      trigger: resolved.trigger,
      description: resolved.description || '',
      action: resolved.action,
      entity: resolved.entity || null,
      enabled: resolved.enabled !== false,
      rule: resolved.rule || null,
      filter: resolved.filter || null,
      config: resolved.config || {},
      recipients: resolved.recipients || [],
      integration: resolved.integration || null,
      timezone: resolved.timezone || 'UTC',
    };

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Generated automation job for ${scheduleName}`);
    }

    return this._deepFreeze(job);
  }

  getEntitiesForDomain(domainName) {
    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getEntitiesForDomain: domainName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.domains || !config.domains[domainName]) {
      throw new Error(`[ConfigGeneratorEngine] Domain "${domainName}" not found`);
    }

    const domain = config.domains[domainName];
    const entities = domain.entities || [];

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved ${entities.length} entities for domain ${domainName}`);
    }

    return [...entities];
  }

  isFeatureEnabled(featureName, context = {}) {
    if (!featureName || typeof featureName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] isFeatureEnabled: featureName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.features || !config.features[featureName]) {
      if (this.debugMode) {
        console.warn(`[ConfigGeneratorEngine] Feature "${featureName}" not found, defaulting to disabled`);
      }
      return false;
    }

    const feature = config.features[featureName];

    if (feature.enabled === false) {
      return false;
    }

    if (feature.deprecated === true) {
      console.warn(`[ConfigGeneratorEngine] Feature "${featureName}" is deprecated`);
      return false;
    }

    if (feature.domain && context.domain && feature.domain !== context.domain) {
      return false;
    }

    if (feature.workflow_stage && context.stage && feature.workflow_stage !== context.stage) {
      return false;
    }

    if (feature.roles && context.role && !feature.roles.includes(context.role)) {
      return false;
    }

    if (feature.requires && Array.isArray(feature.requires)) {
      for (const requirement of feature.requires) {
        if (context.features && !context.features.includes(requirement)) {
          return false;
        }
      }
    }

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Feature "${featureName}" is enabled for context`, context);
    }

    return true;
  }

  getThreshold(path) {
    if (!path || typeof path !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getThreshold: path must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.thresholds) {
      throw new Error('[ConfigGeneratorEngine] No thresholds found in master config');
    }

    const segments = path.split('.');
    let current = config.thresholds;

    for (const segment of segments) {
      if (current === null || current === undefined) {
        throw new Error(`[ConfigGeneratorEngine] Threshold path "${path}" not found (stopped at "${segment}")`);
      }

      current = current[segment];
    }

    if (current === undefined) {
      throw new Error(`[ConfigGeneratorEngine] Threshold path "${path}" not found`);
    }

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved threshold for ${path}:`, current);
    }

    if (typeof current === 'object' && current !== null) {
      return this._deepFreeze(this._deepClone(current));
    }

    return current;
  }

  getWorkflow(workflowName) {
    if (!workflowName || typeof workflowName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getWorkflow: workflowName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.workflows || !config.workflows[workflowName]) {
      throw new Error(`[ConfigGeneratorEngine] Workflow "${workflowName}" not found`);
    }

    const workflow = this._deepClone(config.workflows[workflowName]);
    const resolved = this._recursiveResolve(workflow, config);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved workflow ${workflowName}`);
    }

    return this._deepFreeze(resolved);
  }

  getValidationRule(ruleName) {
    if (!ruleName || typeof ruleName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getValidationRule: ruleName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.validation || !config.validation[ruleName]) {
      throw new Error(`[ConfigGeneratorEngine] Validation rule "${ruleName}" not found`);
    }

    const rule = this._deepClone(config.validation[ruleName]);
    const resolved = this._recursiveResolve(rule, config);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved validation rule ${ruleName}`);
    }

    return this._deepFreeze(resolved);
  }

  getAllEntities() {
    const config = this._getConfig();

    if (!config.entities) {
      return [];
    }

    const entityNames = Object.keys(config.entities);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved ${entityNames.length} entity names`);
    }

    return entityNames.sort();
  }

  getAllAutomations() {
    const config = this._getConfig();

    if (!config.automation || !config.automation.schedules) {
      return [];
    }

    const schedules = this._deepClone(config.automation.schedules);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved ${schedules.length} automation schedules`);
    }

    return schedules;
  }

  cacheSpec(entityName, spec) {
    if (!entityName || typeof entityName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] cacheSpec: entityName must be a non-empty string');
    }

    if (!spec || typeof spec !== 'object') {
      throw new Error('[ConfigGeneratorEngine] cacheSpec: spec must be an object');
    }

    const cacheKey = `spec:${entityName}`;
    const frozen = this._deepFreeze(spec);

    this.specCache.set(cacheKey, frozen);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Cached spec for ${entityName}`);
    }

    return true;
  }

  invalidateCache() {
    this.specCache.clear();
    this.masterConfig = null;

    if (this.debugMode) {
      console.log('[ConfigGeneratorEngine] Cache invalidated');
    }

    return true;
  }

  enableDebug(enabled = true) {
    this.debugMode = enabled;
    return this;
  }

  getConfig() {
    return this._deepFreeze(this._deepClone(this._getConfig()));
  }

  getRoles() {
    const config = this._getConfig();

    if (!config.roles) {
      return {};
    }

    return this._deepFreeze(this._deepClone(config.roles));
  }

  getWorkflowStages(workflowName) {
    if (!workflowName || typeof workflowName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getWorkflowStages: workflowName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.workflows || !config.workflows[workflowName]) {
      if (this.debugMode) {
        console.warn(`[ConfigGeneratorEngine] Workflow "${workflowName}" not found`);
      }
      return [];
    }

    const workflow = config.workflows[workflowName];

    if (!workflow.stages || !Array.isArray(workflow.stages)) {
      return [];
    }

    const stageNames = workflow.stages.map(s => typeof s === 'string' ? s : s.name);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved ${stageNames.length} stages for workflow ${workflowName}`);
    }

    return stageNames;
  }

  getStageConfig(workflowName, stageName) {
    if (!workflowName || typeof workflowName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getStageConfig: workflowName must be a non-empty string');
    }

    if (!stageName || typeof stageName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getStageConfig: stageName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.workflows || !config.workflows[workflowName]) {
      if (this.debugMode) {
        console.warn(`[ConfigGeneratorEngine] Workflow "${workflowName}" not found`);
      }
      return null;
    }

    const workflow = config.workflows[workflowName];

    if (!workflow.stages || !Array.isArray(workflow.stages)) {
      return null;
    }

    const stageConfig = workflow.stages.find(s => (typeof s === 'string' ? s : s.name) === stageName);

    if (!stageConfig) {
      if (this.debugMode) {
        console.warn(`[ConfigGeneratorEngine] Stage "${stageName}" not found in workflow "${workflowName}"`);
      }
      return null;
    }

    const result = typeof stageConfig === 'string' ? { name: stageConfig } : this._deepClone(stageConfig);
    const resolved = this._recursiveResolve(result, config);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved stage config for ${workflowName}.${stageName}`);
    }

    return this._deepFreeze(resolved);
  }

  getRepeatIntervals() {
    const config = this._getConfig();

    const defaults = {
      once: 'once',
      monthly: 'monthly',
      yearly: 'yearly',
    };

    if (!config.repeat_intervals) {
      return defaults;
    }

    const intervals = this._deepClone(config.repeat_intervals);

    if (this.debugMode) {
      console.log('[ConfigGeneratorEngine] Retrieved repeat intervals');
    }

    return this._deepFreeze(intervals);
  }

  getDomains() {
    const config = this._getConfig();

    if (!config.domains) {
      return {};
    }

    return this._deepFreeze(this._deepClone(config.domains));
  }

  getHighlightPalette() {
    const config = this._getConfig();

    if (!config.highlights || !config.highlights.palette) {
      return [];
    }

    return this._deepFreeze(this._deepClone(config.highlights.palette));
  }

  getSystemConfig() {
    const config = this._getConfig();

    if (!config.system) {
      return {};
    }

    return this._deepFreeze(this._deepClone(config.system));
  }

  getIntegration(integrationName) {
    if (!integrationName || typeof integrationName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getIntegration: integrationName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.integrations || !config.integrations[integrationName]) {
      throw new Error(`[ConfigGeneratorEngine] Integration "${integrationName}" not found`);
    }

    const integration = this._deepClone(config.integrations[integrationName]);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved integration ${integrationName}`);
    }

    return this._deepFreeze(integration);
  }

  getDocumentTemplate(templateName) {
    if (!templateName || typeof templateName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getDocumentTemplate: templateName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.document_generation || !config.document_generation.templates ||
        !config.document_generation.templates[templateName]) {
      throw new Error(`[ConfigGeneratorEngine] Document template "${templateName}" not found`);
    }

    const template = this._deepClone(config.document_generation.templates[templateName]);
    const resolved = this._recursiveResolve(template, config);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved document template ${templateName}`);
    }

    return this._deepFreeze(resolved);
  }

  getStatusEnum(enumName) {
    if (!enumName || typeof enumName !== 'string') {
      throw new Error('[ConfigGeneratorEngine] getStatusEnum: enumName must be a non-empty string');
    }

    const config = this._getConfig();

    if (!config.status_enums || !config.status_enums[enumName]) {
      throw new Error(`[ConfigGeneratorEngine] Status enum "${enumName}" not found`);
    }

    const statusEnum = this._deepClone(config.status_enums[enumName]);

    if (this.debugMode) {
      console.log(`[ConfigGeneratorEngine] Retrieved status enum ${enumName}`);
    }

    return this._deepFreeze(statusEnum);
  }

  _generateFieldsFromOverrides(fieldOverrides) {
    const fields = { id: { type: 'id', required: true } };

    for (const [fieldName, fieldDef] of Object.entries(fieldOverrides)) {
      fields[fieldName] = { ...fieldDef };
    }

    fields.created_at = { type: 'timestamp', auto: 'now', required: true };
    fields.updated_at = { type: 'timestamp', auto: 'update' };
    fields.created_by = { type: 'ref', ref: 'user', auto: 'user' };

    return fields;
  }

  _generateDefaultFields(entityName) {
    return {
      id: { type: 'id', label: 'ID', required: true, list: true },
      name: { type: 'text', label: 'Name', required: true, list: true, search: true },
      created_at: { type: 'timestamp', label: 'Created At', auto: 'now', required: true, list: true },
      updated_at: { type: 'timestamp', label: 'Updated At', auto: 'update', list: true },
      created_by: { type: 'ref', label: 'Created By', ref: 'user', auto: 'user' },
    };
  }

  _buildEnumOptions(fields, workflow, config) {
    const options = {};

    for (const [fieldKey, fieldDef] of Object.entries(fields || {})) {
      if (fieldDef.type === 'enum' && fieldDef.options) {
        const optionsRef = fieldDef.options;

        if (typeof optionsRef === 'string' && (optionsRef.includes('workflow') || optionsRef.includes('stages'))) {
          if (workflow && workflow.stages && Array.isArray(workflow.stages)) {
            options[optionsRef] = workflow.stages.map(stage => ({
              value: stage.name,
              label: stage.label || stage.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              color: stage.color || 'blue'
            }));
          } else {
            console.warn(`[ConfigGeneratorEngine] _buildEnumOptions: No workflow.stages found for ${optionsRef}`);
            options[optionsRef] = [];
          }
        } else if (Array.isArray(fieldDef.options)) {
          options[fieldKey] = fieldDef.options.map(opt => {
            if (typeof opt === 'string') {
              return { value: opt, label: opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), color: 'blue' };
            }
            return { value: opt.value, label: opt.label || opt.value, color: opt.color || 'blue' };
          });
        } else if (config.status_enums && config.status_enums[optionsRef]) {
          const statusEnum = config.status_enums[optionsRef];
          options[optionsRef] = Object.entries(statusEnum).map(([value, data]) => ({
            value,
            label: data.label || value,
            color: data.color || 'gray'
          }));
        } else {
          console.warn(`[ConfigGeneratorEngine] _buildEnumOptions: Unknown options reference ${optionsRef} for field ${fieldKey}`);
          options[optionsRef] = [];
        }
      }
    }

    return options;
  }

  _ensureFieldLabels(fields) {
    if (!fields || typeof fields !== 'object') {
      return fields;
    }

    const result = {};
    for (const [key, field] of Object.entries(fields)) {
      if (!field || typeof field !== 'object') {
        result[key] = field;
        continue;
      }

      if (!field.label) {
        result[key] = {
          ...field,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        };
      } else {
        result[key] = field;
      }
    }
    return result;
  }
}

// Use global scope to persist across module instances in Next.js
const getGlobalScope = () => {
  if (typeof global === 'undefined') {
    throw new Error('[ConfigGeneratorEngine] Cannot access global scope outside Node.js');
  }
  return global;
};

export async function getConfigEngine() {
  const g = getGlobalScope();
  if (!g.__configEngine__) {
    try {
      const { initializeSystemConfig } = await import('@/config/system-config-loader');
      await initializeSystemConfig();
    } catch (error) {
      console.error('[ConfigGeneratorEngine] Failed to lazy-initialize global engine:', error.message);
      throw error;
    }
    if (!g.__configEngine__) {
      throw new Error('[ConfigGeneratorEngine] Global engine still not initialized after lazy init');
    }
  }
  return g.__configEngine__;
}

export function setConfigEngine(engine) {
  if (!engine || !(engine instanceof ConfigGeneratorEngine)) {
    throw new Error('[ConfigGeneratorEngine] setConfigEngine requires a ConfigGeneratorEngine instance');
  }
  const g = getGlobalScope();
  g.__configEngine__ = engine;
}

export function resetConfigEngine() {
  const g = getGlobalScope();
  g.__configEngine__ = null;
}

export function getConfigEngineSync() {
  const g = getGlobalScope();
  if (!g.__configEngine__) {
    try {
      const projectRoot = path.join(__dirname, '../..');
      const configPath = path.join(projectRoot, 'src/config/master-config.yml');
      if (!fs.existsSync(configPath)) {
        throw new Error(`[ConfigGeneratorEngine] master-config.yml not found at ${configPath}`);
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent);

      if (!config) {
        throw new Error('[ConfigGeneratorEngine] Failed to parse master-config.yml');
      }

      g.__configEngine__ = new ConfigGeneratorEngine(config);
      console.log('[ConfigGeneratorEngine] Lazy-initialized from master-config.yml');
    } catch (error) {
      console.error('[ConfigGeneratorEngine] Lazy-init failed:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }
  return g.__configEngine__;
}
