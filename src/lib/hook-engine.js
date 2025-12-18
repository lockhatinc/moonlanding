import { HookRegistry } from './hook-registry';
import { HookHistory } from './hook-history';
import { HookExecutor } from './hook-executor';
import { PluginRegistry } from './hook-plugins';

export class HookEngine {
  constructor() {
    this.registry = new HookRegistry();
    this.history = new HookHistory();
    this.executor = new HookExecutor(this.registry);
    this.plugins = new PluginRegistry(this.registry, this.executor);
  }

  register(name, callback, options = {}) {
    this.registry.register(name, callback, options);
    return this;
  }

  on(name, callback, options = {}) {
    return this.register(name, callback, options);
  }

  once(name, callback, options = {}) {
    return this.register(name, callback, { ...options, once: true });
  }

  unregister(name, callback, phase = null) {
    this.registry.unregister(name, callback, phase);
    return this;
  }

  off(name, callback) {
    return this.unregister(name, callback);
  }

  removeAllHooks(name = null, phase = null) {
    this.registry.removeAll(name, phase);
    return this;
  }

  registerHandler(name, callback) {
    this.executor.registerHandler(name, callback);
    return this;
  }

  getHandler(name) {
    return this.executor.getHandler(name);
  }

  registerPlugin(name, definition = {}) {
    this.plugins.register(name, definition);
    return this;
  }

  unregisterPlugin(name) {
    this.plugins.unregister(name);
    return this;
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  listPlugins() {
    return this.plugins.list();
  }

  async execute(name, data = {}, options = {}) {
    this.history.record(name, data);
    return this.executor.execute(name, data, options);
  }

  async executeSerial(name, data = {}, options = {}) {
    return this.executor.executeSerial(name, data, options);
  }

  async executePhases(name, data, phases = ['before', 'handle', 'after'], context = {}) {
    return this.executor.executePhases(name, data, phases, context);
  }

  async transition(name, fromState, toState, data, context = {}) {
    return this.executor.transition(name, fromState, toState, data, context);
  }

  listenerCount(name, phase = null) {
    return this.registry.count(name, phase);
  }

  listeners(name, phase = null) {
    return this.registry.get(name, phase);
  }

  hookNames() {
    return this.registry.names();
  }

  getHistory(name = null) {
    return this.history.get(name);
  }

  clearHistory() {
    this.history.clear();
    return this;
  }

  setMaxListeners(n) {
    this.registry.setMaxListeners(n);
    return this;
  }

  createPluginAPI() {
    return {
      register: this.register.bind(this),
      on: this.on.bind(this),
      registerHandler: this.registerHandler.bind(this),
      execute: this.execute.bind(this),
      executeSerial: this.executeSerial.bind(this),
      executePhases: this.executePhases.bind(this),
      getPlugin: this.getPlugin.bind(this),
    };
  }
}

export const hookEngine = new HookEngine();

export async function executeHook(name, data = {}, options = {}) {
  return hookEngine.execute(name, data, options);
}

export async function executeHookSerial(name, data = {}, options = {}) {
  return hookEngine.executeSerial(name, data, options);
}
