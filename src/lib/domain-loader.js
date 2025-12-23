import { ConfigGeneratorEngine } from '@/lib/config-generator-engine';

const log = (msg, data) => {
  const prefix = '[DomainLoader]';
  if (data) console.log(`${prefix} ${msg}`, data);
  else console.log(`${prefix} ${msg}`);
};

export class DomainLoader {
  constructor(configGeneratorEngine) {
    if (!configGeneratorEngine || !(configGeneratorEngine instanceof ConfigGeneratorEngine)) {
      throw new Error('[DomainLoader] Constructor requires ConfigGeneratorEngine instance');
    }
    this.engine = configGeneratorEngine;
    this.validDomains = ['friday', 'mwr'];
    this.defaultDomain = 'friday';
    log('Initialized', {
      validDomains: this.validDomains,
      defaultDomain: this.defaultDomain,
    });
  }

  getEntitiesForDomain(domainName) {
    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[DomainLoader] getEntitiesForDomain: domainName must be a non-empty string');
    }

    const normalizedDomain = domainName.toLowerCase();

    if (!this.validDomains.includes(normalizedDomain)) {
      throw new Error(`[DomainLoader] Invalid domain: ${domainName}. Valid domains: ${this.validDomains.join(', ')}`);
    }

    try {
      const entities = this.engine.getEntitiesForDomain(normalizedDomain);
      return [...entities];
    } catch (error) {
      console.error('[DomainLoader] getEntitiesForDomain error:', error.message);
      throw error;
    }
  }

  getSpecsForDomain(domainName) {
    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[DomainLoader] getSpecsForDomain: domainName must be a non-empty string');
    }

    const normalizedDomain = domainName.toLowerCase();

    if (!this.validDomains.includes(normalizedDomain)) {
      throw new Error(`[DomainLoader] Invalid domain: ${domainName}. Valid domains: ${this.validDomains.join(', ')}`);
    }

    const entities = this.getEntitiesForDomain(normalizedDomain);
    const specs = [];

    for (const entityName of entities) {
      try {
        const spec = this.engine.generateEntitySpec(entityName);
        specs.push(spec);
      } catch (error) {
        console.error(`[DomainLoader] Failed to generate spec for ${entityName}:`, error.message);
      }
    }

    return specs;
  }

  getFeaturesForDomain(domainName) {
    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[DomainLoader] getFeaturesForDomain: domainName must be a non-empty string');
    }

    const normalizedDomain = domainName.toLowerCase();

    if (!this.validDomains.includes(normalizedDomain)) {
      throw new Error(`[DomainLoader] Invalid domain: ${domainName}. Valid domains: ${this.validDomains.join(', ')}`);
    }

    const config = this.engine.getConfig();

    if (!config.domains || !config.domains[normalizedDomain]) {
      return [];
    }

    const domainConfig = config.domains[normalizedDomain];
    const features = domainConfig.features || {};

    return Object.keys(features).filter(key => features[key] === true);
  }

  isEntityInDomain(entityName, domainName) {
    if (!entityName || typeof entityName !== 'string') {
      throw new Error('[DomainLoader] isEntityInDomain: entityName must be a non-empty string');
    }

    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[DomainLoader] isEntityInDomain: domainName must be a non-empty string');
    }

    const normalizedDomain = domainName.toLowerCase();
    const normalizedEntity = entityName.toLowerCase();

    if (!this.validDomains.includes(normalizedDomain)) {
      return false;
    }

    try {
      const entities = this.getEntitiesForDomain(normalizedDomain);
      return entities.map(e => e.toLowerCase()).includes(normalizedEntity);
    } catch (error) {
      console.error('[DomainLoader] isEntityInDomain error:', error.message);
      return false;
    }
  }

  isFeatureInDomain(featureName, domainName) {
    if (!featureName || typeof featureName !== 'string') {
      throw new Error('[DomainLoader] isFeatureInDomain: featureName must be a non-empty string');
    }

    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[DomainLoader] isFeatureInDomain: domainName must be a non-empty string');
    }

    const normalizedDomain = domainName.toLowerCase();
    const normalizedFeature = featureName.toLowerCase();

    if (!this.validDomains.includes(normalizedDomain)) {
      return false;
    }

    try {
      const features = this.getFeaturesForDomain(normalizedDomain);
      return features.map(f => f.toLowerCase()).includes(normalizedFeature);
    } catch (error) {
      console.error('[DomainLoader] isFeatureInDomain error:', error.message);
      return false;
    }
  }

  filterDataByDomain(data, domainName, entityName) {
    if (!data) {
      return data;
    }

    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[DomainLoader] filterDataByDomain: domainName must be a non-empty string');
    }

    if (!entityName || typeof entityName !== 'string') {
      throw new Error('[DomainLoader] filterDataByDomain: entityName must be a non-empty string');
    }

    const normalizedDomain = domainName.toLowerCase();
    const normalizedEntity = entityName.toLowerCase();

    if (!this.isEntityInDomain(normalizedEntity, normalizedDomain)) {
      throw new Error(`[DomainLoader] Entity ${entityName} not in domain ${domainName}`);
    }

    if (Array.isArray(data)) {
      return data.map(item => this._filterDataItem(item, normalizedDomain, normalizedEntity));
    }

    return this._filterDataItem(data, normalizedDomain, normalizedEntity);
  }

  _filterDataItem(item, domainName, entityName) {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const config = this.engine.getConfig();
    const domainConfig = config.domains?.[domainName];

    if (!domainConfig) {
      return item;
    }

    const filteredItem = { ...item };

    const excludeFieldsByDomain = {
      friday: [],
      mwr: []
    };

    const excludeFields = excludeFieldsByDomain[domainName] || [];

    for (const field of excludeFields) {
      delete filteredItem[field];
    }

    return filteredItem;
  }

  getDomainInfo(domainName) {
    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[DomainLoader] getDomainInfo: domainName must be a non-empty string');
    }

    const normalizedDomain = domainName.toLowerCase();

    if (!this.validDomains.includes(normalizedDomain)) {
      throw new Error(`[DomainLoader] Invalid domain: ${domainName}. Valid domains: ${this.validDomains.join(', ')}`);
    }

    const config = this.engine.getConfig();

    if (!config.domains || !config.domains[normalizedDomain]) {
      throw new Error(`[DomainLoader] Domain ${domainName} not found in config`);
    }

    const domainConfig = config.domains[normalizedDomain];
    const entities = this.getEntitiesForDomain(normalizedDomain);
    const features = this.getFeaturesForDomain(normalizedDomain);

    return {
      name: normalizedDomain,
      label: domainConfig.label || normalizedDomain,
      description: domainConfig.description || '',
      enabled: domainConfig.enabled !== false,
      primary_color: domainConfig.primary_color || '#3B82F6',
      icon: domainConfig.icon || 'Circle',
      features,
      entities
    };
  }

  getCurrentDomain(request) {
    if (!request) {
      return this.defaultDomain;
    }

    try {
      const url = new URL(request.url);
      const domainParam = url.searchParams.get('domain');

      if (!domainParam) {
        return this.defaultDomain;
      }

      const normalizedDomain = domainParam.toLowerCase();

      if (!this.validDomains.includes(normalizedDomain)) {
        console.warn(`[DomainLoader] Invalid domain parameter: ${domainParam}, using default: ${this.defaultDomain}`);
        return this.defaultDomain;
      }

      return normalizedDomain;
    } catch (error) {
      console.error('[DomainLoader] getCurrentDomain error:', error.message);
      return this.defaultDomain;
    }
  }

  getApiBasePathForDomain(domainName) {
    if (!domainName || typeof domainName !== 'string') {
      throw new Error('[DomainLoader] getApiBasePathForDomain: domainName must be a non-empty string');
    }

    const normalizedDomain = domainName.toLowerCase();

    if (!this.validDomains.includes(normalizedDomain)) {
      throw new Error(`[DomainLoader] Invalid domain: ${domainName}. Valid domains: ${this.validDomains.join(', ')}`);
    }

    return `/api/${normalizedDomain}`;
  }

  getValidDomains() {
    return [...this.validDomains];
  }

  getDefaultDomain() {
    return this.defaultDomain;
  }
}

let globalDomainLoader = null;

export function getDomainLoader() {
  if (!globalDomainLoader) {
    const { getConfigEngine } = require('@/lib/config-generator-engine');
    const engine = getConfigEngine();
    globalDomainLoader = new DomainLoader(engine);
  }
  return globalDomainLoader;
}

export function resetDomainLoader() {
  globalDomainLoader = null;
}
