export class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.hooks = {
      before: new Map(),
      after: new Map(),
      guard: new Map(),
    };
  }

  define(entityName, workflowDef) {
    this.workflows.set(entityName, workflowDef);
    return this;
  }

  before(entityName, transitionName, handler) {
    const key = `${entityName}.${transitionName}`;
    if (!this.hooks.before.has(key)) this.hooks.before.set(key, []);
    this.hooks.before.get(key).push(handler);
    return this;
  }

  after(entityName, transitionName, handler) {
    const key = `${entityName}.${transitionName}`;
    if (!this.hooks.after.has(key)) this.hooks.after.set(key, []);
    this.hooks.after.get(key).push(handler);
    return this;
  }

  guard(entityName, transitionName, validator) {
    const key = `${entityName}.${transitionName}`;
    if (!this.hooks.guard.has(key)) this.hooks.guard.set(key, []);
    this.hooks.guard.get(key).push(validator);
    return this;
  }

  async canTransition(entityName, fromStage, toStage, record) {
    const workflow = this.workflows.get(entityName);
    if (!workflow) return false;

    const transition = workflow.transitions[toStage];
    if (!transition) return false;

    const guards = this.hooks.guard.get(`${entityName}.${toStage}`) || [];
    for (const guard of guards) {
      const result = await guard(record);
      if (!result) return false;
    }

    return true;
  }

  async transition(entityName, record, toStage, context = {}) {
    const canTransition = await this.canTransition(entityName, record.stage, toStage, record);
    if (!canTransition) {
      throw new Error(`Cannot transition from ${record.stage} to ${toStage}`);
    }

    const beforeHooks = this.hooks.before.get(`${entityName}.${toStage}`) || [];
    for (const hook of beforeHooks) {
      await hook(record, context);
    }

    const updated = { ...record, stage: toStage };

    const afterHooks = this.hooks.after.get(`${entityName}.${toStage}`) || [];
    for (const hook of afterHooks) {
      await hook(updated, context);
    }

    return updated;
  }

  getAvailableTransitions(entityName, currentStage) {
    const workflow = this.workflows.get(entityName);
    if (!workflow) return [];

    const available = [];
    for (const [stageName, transition] of Object.entries(workflow.transitions)) {
      if (transition.from?.includes(currentStage) || transition.from === currentStage) {
        available.push({ to: stageName, ...transition });
      }
    }
    return available;
  }

  generateActions(entityName, workflow) {
    const actions = {};
    for (const [stageName] of Object.entries(workflow.transitions)) {
      const actionName = `moveTo${stageName.charAt(0).toUpperCase()}${stageName.slice(1)}`;
      actions[actionName] = async (recordId, context) => {
        return this.transition(entityName, recordId, stageName, context);
      };
    }
    return actions;
  }
}

export const workflow = new WorkflowEngine();

export function defineWorkflow(entityName, def) {
  workflow.define(entityName, def);
  return def;
}
