export class HookExecutor {
  constructor(registry) {
    this.registry = registry;
    this.handlers = new Map();
  }

  registerHandler(name, callback) {
    this.handlers.set(name, callback);
    return this;
  }

  getHandler(name) {
    return this.handlers.get(name);
  }

  async execute(name, data = {}, options = {}) {
    const { phase = null, serial = false, fallthrough = true, context = {} } = options;
    const hooks = this.registry.get(name, phase);

    if (hooks.length === 0) {
      return { success: true, data, context };
    }

    let result = data;
    let errors = [];

    for (const hook of hooks) {
      try {
        if (serial) {
          result = await hook.callback(result, context);
        } else {
          await hook.callback(result, context);
        }

        if (hook.once) {
          this.registry.unregister(name, hook.callback, phase);
        }
      } catch (error) {
        console.error(`[HookExecutor] Hook "${name}" error:`, error.message);
        errors.push(error);
        if (!fallthrough) throw error;
      }
    }

    return { success: errors.length === 0, data: serial ? result : data, errors, context };
  }

  async executeSerial(name, data = {}, options = {}) {
    return this.execute(name, data, { ...options, serial: true });
  }

  async executePhases(name, data, phases = ['before', 'handle', 'after'], context = {}) {
    let result = data;

    for (const phase of phases) {
      if (phase === 'handle') {
        const handler = this.getHandler(name);
        if (handler) {
          try {
            result = await handler(result, context);
          } catch (error) {
            console.error(`[HookExecutor] Handler "${name}" error:`, error.message);
            throw error;
          }
        }
      } else {
        const res = await this.executeSerial(name, result, { phase, context, fallthrough: phase !== 'after' });
        result = res.data;
        if (!res.success && phase !== 'after') throw new Error(`Phase "${phase}" failed`);
      }
    }

    return result;
  }

  async transition(name, fromState, toState, data, context = {}) {
    const transitionKey = `${name}.${toState}`;
    const guards = this.registry.get(`${transitionKey}:guard`);

    for (const guard of guards) {
      try {
        const result = await guard.callback(data, context);
        if (!result) {
          throw new Error(`Guard failed for transition to "${toState}"`);
        }
      } catch (error) {
        console.error(`[HookExecutor] Guard "${transitionKey}" failed:`, error.message);
        throw error;
      }
    }

    const res = await this.executeSerial(name, { ...data, toState }, {
      phase: 'before',
      context: { ...context, transition: transitionKey }
    });

    const result = { ...res.data, stage: toState };

    await this.executeSerial(name, result, {
      phase: 'after',
      context: { ...context, transition: transitionKey }
    });

    return result;
  }
}
