import { ConfigGeneratorEngine, setConfigEngine } from '@/lib/config-generator-engine';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

if (typeof window !== 'undefined') {
  throw new Error('system-config-loader is server-side only and should not be bundled with client code');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const log = (msg, data) => {
  const prefix = '[SystemConfigLoader]';
  if (data) console.log(`${prefix} ${msg}`, data);
  else console.log(`${prefix} ${msg}`);
};

const logError = (msg, error) => {
  console.error(`[SystemConfigLoader] ERROR ${msg}`, error.message || error);
};

export class SystemConfigLoader {
  static async load(customConfig = null) {
    try {
      if (customConfig) {
        log('Initializing with custom config');
        const generator = new ConfigGeneratorEngine(customConfig);
        setConfigEngine(generator);

        // Populate specs object for database migration and other uses
        const { specs } = await import('@/config/spec-helpers');
        for (const entityName of generator.getAllEntities()) {
          specs[entityName] = generator.generateEntitySpec(entityName);
        }
        log('Specs object populated', { specCount: Object.keys(specs).length });

        const { registerEntityHandlers } = await import('@/lib/events-engine.js');
        registerEntityHandlers();
        log('Entity event handlers registered');

        log('Custom config loaded successfully', {
          entities: Object.keys(customConfig.entities || {}).length,
          roles: Object.keys(customConfig.roles || {}).length,
          domains: Object.keys(customConfig.domains || {}).length,
        });
        return { config: customConfig, generator };
      }

      const projectRoot = path.join(__dirname, '../..');
      const configPath = path.join(projectRoot, 'src/config/master-config.yml');
      log('Loading master-config.yml from', configPath);

      if (!fs.existsSync(configPath)) {
        throw new Error(`File not found: ${configPath}`);
      }
      log('File exists, reading content');

      const fileContent = fs.readFileSync(configPath, 'utf8');
      log('File read successfully', { bytes: fileContent.length });

      const config = yaml.load(fileContent);
      log('YAML parsed successfully');

      if (!config || typeof config !== 'object') {
        throw new Error('master-config.yml is empty or not a valid YAML object');
      }

      log('Config validation passed', {
        sections: Object.keys(config),
        roles: Object.keys(config.roles || {}).length,
        entities: Object.keys(config.entities || {}).length,
        workflows: Object.keys(config.workflows || {}).length,
        domains: Object.keys(config.domains || {}).length,
        thresholds: Object.keys(config.thresholds || {}).length,
      });

      const generator = new ConfigGeneratorEngine(config);
      setConfigEngine(generator);

      // Populate specs object for database migration and other uses
      const { specs } = await import('@/config/spec-helpers');
      for (const entityName of generator.getAllEntities()) {
        specs[entityName] = generator.generateEntitySpec(entityName);
      }
      log('Specs object populated', { specCount: Object.keys(specs).length });

      try {
        const { registerEntityHandlers } = await import('../lib/events-engine.js');
        registerEntityHandlers();
        log('Entity event handlers registered');
      } catch (hookError) {
        log('Warning: Could not register entity handlers', hookError.message);
      }

      log('ConfigGeneratorEngine initialized and set as global');
      log('System config loading complete', {
        totalEntities: generator.getAllEntities().length,
        permissionTemplates: Object.keys(config.permission_templates || {}).length,
        automationJobs: Object.keys(config.automations || {}).length,
      });

      return { config, generator };
    } catch (error) {
      logError('Failed to load system config', error);
      throw error;
    }
  }
}

let _systemInstance = null;

export async function initializeSystemConfig(customConfig = null) {
  if (!_systemInstance) {
    _systemInstance = await SystemConfigLoader.load(customConfig);
  }
  return _systemInstance;
}

export function getSystemConfig() {
  if (!_systemInstance) {
    throw new Error('System config not initialized. Call initializeSystemConfig() first.');
  }
  return _systemInstance;
}

export async function reloadSystemConfig() {
  _systemInstance = null;
  return await initializeSystemConfig();
}

export default SystemConfigLoader;
