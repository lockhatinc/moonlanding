import { hookEngine } from './hook-engine.js';

export class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.engine = hookEngine;
  }

  define(entityName, workflowDef) {
    this.workflows.set(entityName, workflowDef);
    return this;
  }

  before(entityName, transitionName, handler) {
    const key = `${entityName}.${transitionName}`;
    this.engine.register(key, handler, { phase: 'before' });
    return this;
  }

  after(entityName, transitionName, handler) {
    const key = `${entityName}.${transitionName}`;
    this.engine.register(key, handler, { phase: 'after' });
    return this;
  }

  guard(entityName, transitionName, validator) {
    const key = `${entityName}.${transitionName}`;
    this.engine.register(key, validator, { phase: 'guard' });
    return this;
  }

  async canTransition(entityName, fromStage, toStage, record) {
    const workflow = this.workflows.get(entityName);
    if (!workflow) return false;

    const transition = workflow.transitions[toStage];
    if (!transition) return false;

    const key = `${entityName}.${toStage}`;
    const guards = this.engine.listeners(key, 'guard');
    for (const guard of guards) {
      try {
        const result = await guard.callback(record);
        if (!result) return false;
      } catch (error) {
        console.error(`[WorkflowEngine] Guard failed:`, error.message);
        return false;
      }
    }

    return true;
  }

  async transition(entityName, record, toStage, context = {}) {
    const canTransition = await this.canTransition(entityName, record.stage, toStage, record);
    if (!canTransition) {
      throw new Error(`Cannot transition from ${record.stage} to ${toStage}`);
    }

    const key = `${entityName}.${toStage}`;
    const updated = await this.engine.transition(key, record.stage, toStage, record, context);
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
