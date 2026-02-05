import { get, update, list, create } from '@/engine';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/constants';

let cachedStages = null;

function getLifecycleConfig() {
  if (cachedStages) return cachedStages;
  const configEngine = getConfigEngine();
  const config = configEngine.getConfig();
  const workflow = config?.workflows?.engagement_lifecycle;
  if (!workflow?.stages) throw new Error('engagement_lifecycle workflow not found in config');
  cachedStages = {};
  for (const stage of workflow.stages) {
    cachedStages[stage.name] = {
      label: stage.label,
      order: stage.order,
      color: stage.color,
      forward: stage.forward || [],
      backward: stage.backward || [],
      requiresRole: stage.requires_role || ['partner', 'manager'],
      validation: stage.validation || [],
      readonly: stage.readonly || false,
      autoTransition: stage.auto_transition || false,
      autoTransitionTrigger: stage.auto_transition_trigger || null,
      entry: stage.entry || 'default',
      locks: stage.locks || [],
      activates: stage.activates || []
    };
  }
  return cachedStages;
}

export function getStageLabels() {
  const stages = getLifecycleConfig();
  const labels = {};
  for (const [name, cfg] of Object.entries(stages)) labels[name] = cfg.label;
  return labels;
}

export const STAGE_LABELS = new Proxy({}, {
  get(_, prop) { return getStageLabels()[prop]; }
});

export function validateStageTransition(engagement, toStage, user) {
  if (!engagement) throw new Error('Engagement not found');
  const stages = getLifecycleConfig();
  if (!stages[toStage]) throw new Error(`Invalid stage: ${toStage}`);

  const fromStage = engagement.stage;
  const fromCfg = stages[fromStage];
  const toCfg = stages[toStage];

  if (!fromCfg) throw new Error(`Current stage invalid: ${fromStage}`);

  const isForward = fromCfg.forward.includes(toStage);
  const isBackward = fromCfg.backward.includes(toStage);
  if (!isForward && !isBackward) {
    throw new Error(`Invalid stage transition from "${fromStage}" to "${toStage}". Allowed: ${[...fromCfg.forward, ...fromCfg.backward].join(', ') || 'none'}`);
  }

  if (toCfg.requiresRole.length > 0 && !toCfg.requiresRole.includes(user?.role)) {
    if (user?.role === 'clerk') throw new Error('Clerks cannot change engagement stages');
    throw new Error(`Only ${toCfg.requiresRole.join('/')} can move to ${toStage}`);
  }

  if (toCfg.entry === 'partner_only' && user?.role !== 'partner') {
    throw new Error(`Only partners can enter "${toStage}" stage`);
  }

  if (engagement.last_transition_at) {
    const lockoutMinutes = 5;
    const elapsed = (Date.now() / 1000) - engagement.last_transition_at;
    if (elapsed < lockoutMinutes * 60) {
      throw new Error(`Transition lockout: ${Math.ceil(lockoutMinutes - elapsed / 60)}m remaining`);
    }
  }

  return true;
}

export function transitionEngagement(engagementId, toStage, user, reason = '') {
  const engagement = get('engagement', engagementId);
  if (!engagement) throw new Error('Engagement not found');
  validateStageTransition(engagement, toStage, user);

  const oldStage = engagement.stage;
  const nowSec = Math.floor(Date.now() / 1000);

  const updates = {
    stage: toStage,
    last_transition_at: nowSec,
    transition_attempts: 0
  };
  if (toStage === 'commencement' && !engagement.commencement_date) {
    updates.commencement_date = nowSec;
  }

  update('engagement', engagementId, updates, user);

  try {
    create('activity_log', {
      entity_type: 'engagement', entity_id: engagementId,
      action: 'stage_transition',
      message: `Stage transitioned: ${oldStage} -> ${toStage}`,
      details: JSON.stringify({ from: oldStage, to: toStage, reason, user_role: user?.role }),
      user_email: user?.email
    }, user);
  } catch (e) {
    console.error('[lifecycle] Failed to log transition:', e.message);
  }

  return { success: true, from: oldStage, to: toStage };
}

export function getAvailableTransitions(engagement, user) {
  if (!engagement) return [];
  const stages = getLifecycleConfig();
  const currentCfg = stages[engagement.stage];
  if (!currentCfg) return [];

  const available = [];
  const currentOrder = currentCfg.order;

  for (const stageName of [...currentCfg.forward, ...currentCfg.backward]) {
    try {
      validateStageTransition(engagement, stageName, user);
      const cfg = stages[stageName];
      available.push({
        stage: stageName,
        label: cfg.label,
        forward: cfg.order > currentOrder,
        backward: cfg.order < currentOrder
      });
    } catch (e) {}
  }
  return available;
}

export function getTransitionStatus(engagement) {
  let inLockout = false;
  let minutesRemaining = 0;

  if (engagement.last_transition_at) {
    const elapsed = (Date.now() / 1000) - engagement.last_transition_at;
    if (elapsed < 300) {
      inLockout = true;
      minutesRemaining = Math.ceil((300 - elapsed) / 60);
    }
  }

  return { inLockout, minutesRemaining, failedGates: [] };
}

export function shouldAutoTransition(engagement) {
  if (engagement.stage !== 'info_gathering' || !engagement.commencement_date) return false;
  return Date.now() / 1000 >= engagement.commencement_date;
}

export function registerEngagementStageHooks(hookEngine) {
  hookEngine.register('update:engagement:before', async (context) => {
    const { entity, data, user, prev } = context;
    if (entity !== 'engagement' || !data.stage || data.stage === prev.stage) return context;

    const fromStage = prev.stage;
    const toStage = data.stage;
    const stages = getLifecycleConfig();

    const fromCfg = stages[fromStage];
    const toCfg = stages[toStage];
    if (!fromCfg || !toCfg) throw new AppError(`Invalid stage transition`, 'STAGE_TRANSITION_INVALID', HTTP.BAD_REQUEST);

    const isForward = fromCfg.forward.includes(toStage);
    const isBackward = fromCfg.backward.includes(toStage);
    if (!isForward && !isBackward) {
      throw new AppError(`Invalid transition from "${fromStage}" to "${toStage}"`, 'STAGE_TRANSITION_INVALID', HTTP.BAD_REQUEST);
    }

    if (toCfg.requiresRole.length > 0 && !toCfg.requiresRole.includes(user?.role)) {
      throw new AppError(`Role ${user?.role} cannot enter stage ${toStage}`, 'INSUFFICIENT_PERMISSIONS', HTTP.FORBIDDEN);
    }

    if (toCfg.entry === 'partner_only' && user?.role !== 'partner') {
      throw new AppError(`Only partners can enter "${toStage}"`, 'STAGE_ENTRY_CONSTRAINT', HTTP.FORBIDDEN);
    }

    if (user?.role === 'clerk') {
      const clerksCanApprove = prev.clerks_can_approve === true || prev.clerks_can_approve === 1;
      if (!clerksCanApprove) {
        throw new AppError('Clerks cannot change engagement stage unless clerksCanApprove is enabled', 'INSUFFICIENT_PERMISSIONS', HTTP.FORBIDDEN);
      }
    }

    if (toCfg.readonly && Object.keys(data).length > 1) {
      throw new AppError(`Stage "${toStage}" is read-only`, 'STAGE_READONLY', HTTP.FORBIDDEN);
    }

    try {
      create('activity_log', {
        entity_type: 'engagement', entity_id: context.id,
        action: 'stage_transition',
        message: `Stage transitioned: ${fromStage} -> ${toStage}`,
        details: JSON.stringify({ from: fromStage, to: toStage, user_role: user?.role }),
        user_email: user?.email
      }, user);
    } catch (e) {
      console.error('[lifecycle] Failed to log stage change:', e.message);
    }

    return context;
  }, { priority: 100, name: 'engagement-stage-validator' });

  console.log('[HOOKS] Registered engagement lifecycle engine');
}
