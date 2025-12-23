export class LifecycleEngine {
  constructor(config = {}) {
    this.lifecycleStages = config.lifecycleStages || {};
    this.hooks = new Map();
  }

  canTransition(entity, fromStage, toStage, user) {
    const stageConfig = this.lifecycleStages[entity]?.transitions?.[fromStage];
    if (!stageConfig) return false;

    const isForward = stageConfig.forward?.includes(toStage);
    const isBackward = stageConfig.backward?.includes(toStage);
    const allowed = isForward || isBackward;

    if (!allowed) return false;

    const hasRole = stageConfig.requiresRole.some(r => user?.role === r);
    return hasRole;
  }

  async validateTransition(entity, fromStage, toStage, context) {
    const stageConfig = this.lifecycleStages[entity]?.transitions?.[toStage];
    if (!stageConfig?.validation) return true;

    for (const validationRule of stageConfig.validation) {
      const isValid = await this.runValidator(validationRule, context);
      if (!isValid) return false;
    }
    return true;
  }

  getAvailableTransitions(entity, currentStage, user) {
    const stageConfig = this.lifecycleStages[entity]?.transitions?.[currentStage];
    if (!stageConfig) return [];

    const available = [...(stageConfig.forward || []), ...(stageConfig.backward || [])];

    if (stageConfig.requiresRole && !stageConfig.requiresRole.includes(user?.role)) {
      return [];
    }

    return available;
  }

  isAutoTransitionEnabled(entity, fromStage) {
    return this.lifecycleStages[entity]?.transitions?.[fromStage]?.autoTransition || false;
  }

  getAutoTransitionTrigger(entity, fromStage) {
    return this.lifecycleStages[entity]?.transitions?.[fromStage]?.autoTransitionOn;
  }

  isReadOnly(entity, stage) {
    return this.lifecycleStages[entity]?.transitions?.[stage]?.readonly || false;
  }

  registerHook(name, handler) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name).push(handler);
    return this;
  }

  async executeHook(name, context) {
    const handlers = this.hooks.get(name) || [];
    for (const handler of handlers) {
      await handler(context);
    }
  }

  async runValidator(ruleName, context) {
    const validators = {
      hasBasicInfo: (ctx) => !!ctx.name && !!ctx.client_id,
      hasEngagementLetter: (ctx) => !!ctx.letter_status,
      hasTeam: (ctx) => !!ctx.team_id,
      reviewsComplete: (ctx) => !!ctx.reviews_complete,
      letterAcceptedOrCancelled: (ctx) => ctx.letter_status === 'accepted' || ctx.progress === 0
    };

    const validator = validators[ruleName];
    return validator ? validator(context) : true;
  }
}

export default LifecycleEngine;
