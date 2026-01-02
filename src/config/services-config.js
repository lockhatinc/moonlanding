import { apiClient } from '@/lib/api-client-unified';
import { renderingEngine } from '@/lib/rendering-engine';
import { globalPluginManager } from '@/framework';
import { engagementService } from '@/services/engagement.service';

let SERVICE_REGISTRY = null;

function initializeRegistry() {
  if (SERVICE_REGISTRY !== null) return SERVICE_REGISTRY;

  try {
    SERVICE_REGISTRY = {
      engagement: engagementService,
    };
  } catch (e) {
    SERVICE_REGISTRY = {};
    if (typeof window === 'undefined') {
      console.error('Failed to initialize service registry:', e);
    }
  }
  return SERVICE_REGISTRY;
}

export function getService(entityType) {
  const registry = initializeRegistry();
  return registry[entityType];
}

export function getAllServices() {
  const registry = initializeRegistry();
  return Object.values(registry);
}

export function getServiceRegistry() {
  return initializeRegistry();
}

export const FRAMEWORK_ENGINES = {
  api: apiClient,
  rendering: renderingEngine,
  plugins: globalPluginManager,
};

export function getEngine(name) {
  return FRAMEWORK_ENGINES[name];
}

export async function initializeServices(config = {}) {
  const { setupInterceptors = true, registerPlugins = true } = config;

  if (setupInterceptors) {
    const { setupApiInterceptors } = await import('@/lib/api-interceptors');
    setupApiInterceptors();
  }

  if (registerPlugins) {
    const plugins = [
      'FieldRendererPlugin',
      'NotificationPlugin',
      'AuditLogPlugin',
      'SearchPlugin',
      'PermissionPlugin',
    ];
    for (const pluginName of plugins) {
      try {
        globalPluginManager.activate(pluginName);
      } catch (e) {
        console.error(`Failed to activate plugin: ${pluginName}`, e);
      }
    }
  }

  return {
    services: SERVICE_REGISTRY,
    engines: FRAMEWORK_ENGINES,
    ready: true,
  };
}

export function getServiceDependencies(entityType) {
  const service = getService(entityType);
  if (!service) return null;

  return {
    service,
    api: FRAMEWORK_ENGINES.api,
    rendering: FRAMEWORK_ENGINES.rendering,
    plugins: FRAMEWORK_ENGINES.plugins,
  };
}
