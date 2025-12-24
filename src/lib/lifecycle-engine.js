export class LifecycleEngine {
  constructor(config = {}) {
    this.lifecycleStages = config.lifecycleStages || {};
    this.hooks = new Map();
    this.lockoutMinutes = config.lockoutMinutes || 5;
  }

  checkTransitionLockout(engagement, toStage) {
    if (!engagement.last_transition_at) {
      return { locked: false, timeRemaining: 0 };
    }

    const now = Math.floor(Date.now() / 1000);
    const lastTransitionAt = engagement.last_transition_at;
    const lockoutSeconds = this.lockoutMinutes * 60;
    const timeSinceLastTransition = now - lastTransitionAt;

    if (timeSinceLastTransition < lockoutSeconds) {
      const timeRemaining = lockoutSeconds - timeSinceLastTransition;
      return { locked: true, timeRemaining };
    }

    return { locked: false, timeRemaining: 0 };
  }

  checkConflict(currentStage, newStage, stageMeta = {}) {
    if (currentStage === newStage) {
      return { conflict: true, reason: 'already_in_target_stage' };
    }

    const inTransition = stageMeta.isTransitioning === true;
    if (inTransition) {
      return { conflict: true, reason: 'concurrent_transition_detected' };
    }

    return { conflict: false };
  }

  canTransition(entity, fromStage, toStage, user, engagement = null) {
    const stageConfig = this.lifecycleStages[entity]?.transitions?.[fromStage];
    if (!stageConfig) return false;

    const isForward = stageConfig.forward?.includes(toStage);
    const isBackward = stageConfig.backward?.includes(toStage);
    const allowed = isForward || isBackward;

    if (!allowed) return false;

    const hasRole = stageConfig.requiresRole.some(r => user?.role === r);
    if (!hasRole) return false;

    if (engagement) {
      const lockout = this.checkTransitionLockout(engagement, toStage);
      if (lockout.locked) {
        return false;
      }
    }

    return true;
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
      letterAcceptedOrCancelled: (ctx) => ctx.letter_status === 'accepted' || ctx.progress === 0,
      checklistsComplete: (ctx) => {
        if (!ctx.checklists || !Array.isArray(ctx.checklists)) return true;
        return ctx.checklists.every(c => c.all_items_done === true);
      }
    };

    const validator = validators[ruleName];
    return validator ? validator(context) : true;
  }
}

export async function checkAndTransitionEngagements(engagements, config = {}) {
  const { list, get, update, create } = await import('@/engine');
  const { getConfigEngine } = await import('@/config/system-config-loader');

  const now = Math.floor(Date.now() / 1000);
  const results = {
    total: 0,
    transitioned: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    const engine = await getConfigEngine();
    const masterConfig = engine.getConfig();
    const lifecycle = masterConfig?.workflows?.engagement_lifecycle;

    if (!lifecycle) {
      throw new Error('Engagement lifecycle workflow not found in config');
    }

    const lifecycleEngine = new LifecycleEngine({
      engagement: {
        transitions: lifecycle.stages.reduce((acc, stage) => {
          acc[stage.name] = {
            forward: stage.forward || [],
            backward: stage.backward || [],
            validation: stage.validation || [],
            requiresRole: stage.requires_role || ['partner', 'manager'],
            autoTransition: stage.auto_transition || false,
            autoTransitionOn: stage.auto_transition_trigger
          };
          return acc;
        }, {})
      }
    });

    const systemUser = { role: 'partner', email: 'system@auto-transition' };

    for (const engagement of engagements) {
      results.total++;

      try {
        const maxAttempts = config.max_attempts || 3;
        const transitionAttempts = engagement.transition_attempts || 0;

        if (transitionAttempts >= maxAttempts) {
          results.skipped++;
          console.log(`[AutoTransition] Skipping engagement ${engagement.id}: max attempts (${maxAttempts}) reached`);
          continue;
        }

        let transitioned = false;
        let targetStage = null;

        if (engagement.stage === 'info_gathering') {
          if (engagement.commencement_date && engagement.commencement_date <= now) {
            const canTransition = lifecycleEngine.canTransition('engagement', 'info_gathering', 'commencement', systemUser);

            if (canTransition) {
              const isValid = await lifecycleEngine.validateTransition('engagement', 'info_gathering', 'commencement', engagement);

              if (isValid) {
                targetStage = 'commencement';
                transitioned = true;
              } else {
                results.skipped++;
                console.log(`[AutoTransition] Engagement ${engagement.id} failed validation for commencement`);
                continue;
              }
            }
          }
        } else if (engagement.stage === 'commencement') {
          const rfis = list('rfi', { engagement_id: engagement.id });
          const allCompleted = rfis.length === 0 || rfis.every(rfi =>
            rfi.client_status === 'completed' || rfi.status === 'completed'
          );

          if (allCompleted) {
            const canTransition = lifecycleEngine.canTransition('engagement', 'commencement', 'team_execution', systemUser);

            if (canTransition) {
              const engagementContext = { ...engagement, team_id: engagement.team_id };
              const isValid = await lifecycleEngine.validateTransition('engagement', 'commencement', 'team_execution', engagementContext);

              if (isValid) {
                targetStage = 'team_execution';
                transitioned = true;
              } else {
                results.skipped++;
                console.log(`[AutoTransition] Engagement ${engagement.id} failed validation for team_execution`);
                continue;
              }
            }
          }
        }

        if (transitioned && targetStage) {
          update('engagement', engagement.id, {
            stage: targetStage,
            last_transition_check: now,
            transition_attempts: 0
          });

          await create('activity_log', {
            entity_type: 'engagement',
            entity_id: engagement.id,
            action: 'auto_transition',
            message: `Auto-transitioned from ${engagement.stage} to ${targetStage}`,
            details: JSON.stringify({
              from_stage: engagement.stage,
              to_stage: targetStage,
              trigger: engagement.stage === 'info_gathering' ? 'commencement_date_reached' : 'all_rfis_completed',
              timestamp: now
            }),
            user_email: 'system@auto-transition'
          });

          results.transitioned++;
          console.log(`[AutoTransition] Successfully transitioned engagement ${engagement.id} from ${engagement.stage} to ${targetStage}`);
        } else {
          update('engagement', engagement.id, {
            last_transition_check: now,
            transition_attempts: transitionAttempts + 1
          });
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          engagement_id: engagement.id,
          error: error.message,
          stage: engagement.stage
        });

        console.error(`[AutoTransition] Error processing engagement ${engagement.id}:`, error.message);

        try {
          update('engagement', engagement.id, {
            last_transition_check: now,
            transition_attempts: (engagement.transition_attempts || 0) + 1
          });
        } catch (updateError) {
          console.error(`[AutoTransition] Failed to update engagement ${engagement.id} after error:`, updateError.message);
        }
      }
    }

  } catch (error) {
    console.error('[AutoTransition] Fatal error:', error.message);
    results.errors.push({ error: error.message, fatal: true });
  }

  return results;
}

export default LifecycleEngine;
