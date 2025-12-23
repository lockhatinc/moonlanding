export const CONFIG_DEBUG = {
  engine: null,
  domainLoader: null,

  status() {
    if (!this.engine) return { initialized: false, error: 'Engine not initialized' };
    try {
      const config = this.engine.getConfig();
      return {
        initialized: true,
        configPath: '/src/config/master-config.yml',
        entityCount: this.engine.getAllEntities().length,
        domainCount: this.engine.getDomains() ? Object.keys(this.engine.getDomains()).length : 0,
        roles: Object.keys(this.engine.getRoles()),
        permissions: this.engine.config?.permission_templates ? Object.keys(this.engine.config.permission_templates) : [],
      };
    } catch (e) {
      return { initialized: true, error: e.message };
    }
  },

  getConfig() {
    if (!this.engine) throw new Error('Engine not initialized');
    return this.engine.getConfig();
  },

  generateEntitySpec(name) {
    if (!this.engine) throw new Error('Engine not initialized');
    try {
      return this.engine.generateEntitySpec(name);
    } catch (e) {
      console.error(`[CONFIG_DEBUG] Error generating spec for ${name}:`, e.message);
      throw e;
    }
  },

  getPermissionTemplate(name) {
    if (!this.engine) throw new Error('Engine not initialized');
    try {
      return this.engine.getPermissionTemplate(name);
    } catch (e) {
      console.error(`[CONFIG_DEBUG] Error getting permission template ${name}:`, e.message);
      throw e;
    }
  },

  getThreshold(category, key) {
    if (!this.engine) throw new Error('Engine not initialized');
    try {
      return this.engine.getThreshold(category, key);
    } catch (e) {
      console.error(`[CONFIG_DEBUG] Error getting threshold ${category}.${key}:`, e.message);
      throw e;
    }
  },

  getWorkflow(name) {
    if (!this.engine) throw new Error('Engine not initialized');
    try {
      return this.engine.getWorkflow(name);
    } catch (e) {
      console.error(`[CONFIG_DEBUG] Error getting workflow ${name}:`, e.message);
      throw e;
    }
  },

  getValidationRule(entityName) {
    if (!this.engine) throw new Error('Engine not initialized');
    try {
      return this.engine.getValidationRule(entityName);
    } catch (e) {
      console.error(`[CONFIG_DEBUG] Error getting validation rule for ${entityName}:`, e.message);
      throw e;
    }
  },

  getNotificationHandler(eventType) {
    if (!this.engine) throw new Error('Engine not initialized');
    try {
      return this.engine.getNotificationHandler(eventType);
    } catch (e) {
      console.error(`[CONFIG_DEBUG] Error getting notification handler ${eventType}:`, e.message);
      throw e;
    }
  },

  getAutomationJob(jobName) {
    if (!this.engine) throw new Error('Engine not initialized');
    try {
      return this.engine.getAutomationJob(jobName);
    } catch (e) {
      console.error(`[CONFIG_DEBUG] Error getting automation job ${jobName}:`, e.message);
      throw e;
    }
  },

  getAllEntities() {
    if (!this.engine) throw new Error('Engine not initialized');
    return this.engine.getAllEntities().map(e => e.name);
  },

  getAllDomains() {
    if (!this.engine) throw new Error('Engine not initialized');
    return this.engine.getDomains() ? Object.keys(this.engine.getDomains()) : [];
  },

  getStatusEnum(name) {
    if (!this.engine) throw new Error('Engine not initialized');
    try {
      return this.engine.getStatusEnum(name);
    } catch (e) {
      console.error(`[CONFIG_DEBUG] Error getting status enum ${name}:`, e.message);
      throw e;
    }
  },

  invalidateCache() {
    if (!this.engine) throw new Error('Engine not initialized');
    this.engine.specCache.clear();
    console.log('[CONFIG_DEBUG] Cache invalidated');
  },

  setEngine(engine) {
    this.engine = engine;
    console.log('[CONFIG_DEBUG] Engine initialized');
  },

  setDomainLoader(loader) {
    this.domainLoader = loader;
    console.log('[CONFIG_DEBUG] Domain loader initialized');
  },

  get config() {
    return this.engine?.getConfig() || {};
  },
};

export function initConfigDebug() {
  if (typeof window !== 'undefined') {
    window.__CONFIG__ = CONFIG_DEBUG;
    console.log('[DEBUG] Config debug initialized: window.__CONFIG__');
  }
}
