const configCache = new Map();

export async function loadSpec(entity) {
  if (configCache.has(`spec:${entity}`)) {
    return configCache.get(`spec:${entity}`);
  }
  try {
    const module = await import(`./entities/${entity}.config.js`);
    const spec = module[`${entity}Spec`];
    configCache.set(`spec:${entity}`, spec);
    return spec;
  } catch (e) {
    console.error(`[ConfigLoader] Failed to load spec for ${entity}:`, e.message);
    return null;
  }
}

export async function loadAllSpecs() {
  if (configCache.has('specs:all')) {
    return configCache.get('specs:all');
  }
  const specs = {};
  const entities = ['user', 'engagement', 'client', 'client-user', 'team', 'review', 'highlight', 'response', 'checklist', 'rfi', 'message', 'file', 'email'];
  for (const entity of entities) {
    specs[entity] = await loadSpec(entity);
  }
  configCache.set('specs:all', specs);
  return specs;
}

export async function loadConfig(modulePath) {
  if (configCache.has(modulePath)) {
    return configCache.get(modulePath);
  }
  try {
    const module = await import(modulePath);
    const config = module.default || Object.values(module)[0];
    configCache.set(modulePath, config);
    return config;
  } catch (e) {
    console.error(`[ConfigLoader] Failed to load ${modulePath}:`, e.message);
    return null;
  }
}

export function clearCache() {
  configCache.clear();
}
