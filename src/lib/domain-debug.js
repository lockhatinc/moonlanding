export const DOMAIN_DEBUG = {
  loader: null,

  getCurrentDomain() {
    if (!this.loader) throw new Error('Domain loader not initialized');
    return this.loader.getCurrentDomain();
  },

  getEntitiesForDomain(domain) {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      return this.loader.getEntitiesForDomain(domain);
    } catch (e) {
      console.error(`[DOMAIN_DEBUG] Error getting entities for ${domain}:`, e.message);
      throw e;
    }
  },

  getSpecsForDomain(domain) {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      return this.loader.getSpecsForDomain(domain);
    } catch (e) {
      console.error(`[DOMAIN_DEBUG] Error getting specs for ${domain}:`, e.message);
      throw e;
    }
  },

  getFeaturesForDomain(domain) {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      return this.loader.getFeaturesForDomain(domain);
    } catch (e) {
      console.error(`[DOMAIN_DEBUG] Error getting features for ${domain}:`, e.message);
      throw e;
    }
  },

  isEntityInDomain(entity, domain) {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      return this.loader.isEntityInDomain(entity, domain);
    } catch (e) {
      console.error(`[DOMAIN_DEBUG] Error checking if ${entity} in ${domain}:`, e.message);
      return false;
    }
  },

  isFeatureInDomain(feature, domain) {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      return this.loader.isFeatureInDomain(feature, domain);
    } catch (e) {
      console.error(`[DOMAIN_DEBUG] Error checking if ${feature} in ${domain}:`, e.message);
      return false;
    }
  },

  filterDataByDomain(data) {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      return this.loader.filterDataByDomain(data);
    } catch (e) {
      console.error('[DOMAIN_DEBUG] Error filtering data by domain:', e.message);
      return data;
    }
  },

  getDomainInfo(domain) {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      return this.loader.getDomainInfo(domain);
    } catch (e) {
      console.error(`[DOMAIN_DEBUG] Error getting domain info for ${domain}:`, e.message);
      throw e;
    }
  },

  getApiBasePathForDomain(domain) {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      return this.loader.getApiBasePathForDomain(domain);
    } catch (e) {
      console.error(`[DOMAIN_DEBUG] Error getting API path for ${domain}:`, e.message);
      throw e;
    }
  },

  reload() {
    if (!this.loader) throw new Error('Domain loader not initialized');
    try {
      this.loader.reload?.();
      console.log('[DOMAIN_DEBUG] Domain mappings reloaded');
    } catch (e) {
      console.error('[DOMAIN_DEBUG] Error reloading domains:', e.message);
    }
  },

  setLoader(loader) {
    this.loader = loader;
    console.log('[DOMAIN_DEBUG] Domain loader initialized');
  },
};

export function initDomainDebug() {
  if (typeof window !== 'undefined') {
    window.__DOMAINS__ = DOMAIN_DEBUG;
    console.log('[DEBUG] Domain debug initialized: window.__DOMAINS__');
  }
}
