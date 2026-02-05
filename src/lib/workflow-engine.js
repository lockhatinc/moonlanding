import { get, update, create } from '@/engine';
import { getConfigEngineSync } from '@/lib/config-generator-engine';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/constants';

const LOCKOUT_SECONDS = 300;
const workflowCache = new Map();

function getWorkflowDef(workflowName) {
  if (workflowCache.has(workflowName)) return workflowCache.get(workflowName);
  const config = getConfigEngineSync().getConfig();
  const wf = config?.workflows?.[workflowName];
  if (!wf) throw new Error(`Workflow "${workflowName}" not found in config`);
  const stageMap = {};
  if (wf.stages) {
    for (const stage of wf.stages) {
      stageMap[stage.name] = stage;
    }
  }
  if (wf.states) {
    for (const state of wf.states) {
      stageMap[state.name] = state;
    }
  }
  const def = { ...wf, stageMap };
  workflowCache.set(workflowName, def);
  return def;
}

export function validateTransition(workflowName, fromState, toState, user) {
  const def = getWorkflowDef(workflowName);
  const fromCfg = def.stageMap[fromState];
  const toCfg = def.stageMap[toState];
  if (!fromCfg) throw new AppError(`Invalid current state: ${fromState}`, 'INVALID_STATE', HTTP.BAD_REQUEST);
  if (!toCfg) throw new AppError(`Invalid target state: ${toState}`, 'INVALID_STATE', HTTP.BAD_REQUEST);

  const forward = fromCfg.forward || [];
  const backward = fromCfg.backward || [];
  if (!forward.includes(toState) && !backward.includes(toState)) {
    throw new AppError(`Cannot transition from "${fromState}" to "${toState}". Allowed: ${[...forward, ...backward].join(', ') || 'none'}`, 'TRANSITION_INVALID', HTTP.BAD_REQUEST);
  }

  const requiresRole = toCfg.requires_role || [];
  if (requiresRole.length > 0 && user && !requiresRole.includes(user.role)) {
    throw new AppError(`Role "${user.role}" cannot enter state "${toState}"`, 'INSUFFICIENT_PERMISSIONS', HTTP.FORBIDDEN);
  }

  if (toCfg.entry === 'partner_only' && user?.role !== 'partner') {
    throw new AppError(`Only partners can enter "${toState}"`, 'ENTRY_CONSTRAINT', HTTP.FORBIDDEN);
  }

  if (toCfg.readonly) {
    throw new AppError(`State "${toState}" is read-only`, 'STATE_READONLY', HTTP.FORBIDDEN);
  }

  return { forward: forward.includes(toState), backward: backward.includes(toState) };
}

export function getAvailableTransitions(workflowName, currentState, user, record = null) {
  const def = getWorkflowDef(workflowName);
  const currentCfg = def.stageMap[currentState];
  if (!currentCfg) return [];

  const available = [];
  const candidates = [...(currentCfg.forward || []), ...(currentCfg.backward || [])];
  const currentOrder = currentCfg.order || 0;

  for (const stateName of candidates) {
    try {
      if (record?.last_transition_at) {
        const elapsed = (Date.now() / 1000) - record.last_transition_at;
        if (elapsed < LOCKOUT_SECONDS) continue;
      }
      validateTransition(workflowName, currentState, stateName, user);
      const cfg = def.stageMap[stateName];
      available.push({
        stage: stateName,
        label: cfg.label || stateName,
        forward: (cfg.order || 0) > currentOrder,
        backward: (cfg.order || 0) < currentOrder
      });
    } catch {}
  }
  return available;
}

export function getTransitionStatus(record) {
  let inLockout = false;
  let minutesRemaining = 0;
  if (record?.last_transition_at) {
    const elapsed = (Date.now() / 1000) - record.last_transition_at;
    if (elapsed < LOCKOUT_SECONDS) {
      inLockout = true;
      minutesRemaining = Math.ceil((LOCKOUT_SECONDS - elapsed) / 60);
    }
  }
  return { inLockout, minutesRemaining, failedGates: [] };
}

export function transition(entityType, entityId, workflowName, toState, user, reason = '') {
  const record = get(entityType, entityId);
  if (!record) throw new AppError(`${entityType} not found`, 'NOT_FOUND', HTTP.NOT_FOUND);

  const stateField = getStateField(workflowName);
  const fromState = record[stateField];

  if (record.last_transition_at) {
    const elapsed = (Date.now() / 1000) - record.last_transition_at;
    if (elapsed < LOCKOUT_SECONDS) {
      throw new AppError(`Transition lockout: ${Math.ceil((LOCKOUT_SECONDS - elapsed) / 60)}m remaining`, 'LOCKOUT', HTTP.BAD_REQUEST);
    }
  }

  validateTransition(workflowName, fromState, toState, user);

  const updates = {
    [stateField]: toState,
    last_transition_at: Math.floor(Date.now() / 1000),
    transition_attempts: 0
  };

  update(entityType, entityId, updates, user);

  try {
    create('activity_log', {
      entity_type: entityType,
      entity_id: entityId,
      action: 'state_transition',
      message: `${stateField}: ${fromState} -> ${toState}`,
      details: JSON.stringify({ from: fromState, to: toState, reason, user_role: user?.role }),
      user_email: user?.email
    }, user);
  } catch (e) {
    console.error('[workflow-engine] Failed to log transition:', e.message);
  }

  return { success: true, from: fromState, to: toState };
}

export function getStateField(workflowName) {
  if (workflowName === 'engagement_lifecycle') return 'stage';
  return 'status';
}

export function getStageLabels(workflowName) {
  const def = getWorkflowDef(workflowName);
  const labels = {};
  for (const [name, cfg] of Object.entries(def.stageMap)) {
    labels[name] = cfg.label || name;
  }
  return labels;
}

export const STAGE_LABELS = new Proxy({}, {
  get(_, prop) { return getStageLabels('engagement_lifecycle')[prop]; }
});

export function shouldAutoTransition(record) {
  if (record.stage !== 'info_gathering' || !record.commencement_date) return false;
  return Date.now() / 1000 >= record.commencement_date;
}

export function isReadonly(workflowName, state) {
  const def = getWorkflowDef(workflowName);
  return def.stageMap[state]?.readonly === true;
}

export function getStateLocks(workflowName, state) {
  const def = getWorkflowDef(workflowName);
  return def.stageMap[state]?.locks || [];
}

export function getStateActions(workflowName, state) {
  const def = getWorkflowDef(workflowName);
  return def.stageMap[state]?.actions || [];
}

export function clearWorkflowCache() {
  workflowCache.clear();
}

export function registerWorkflowHooks(hookEngine) {
  hookEngine.register('update:engagement:before', async (context) => {
    const { entity, data, user, prev } = context;
    if (entity !== 'engagement' || !data.stage || data.stage === prev.stage) return context;

    const fromState = prev.stage;
    const toState = data.stage;

    validateTransition('engagement_lifecycle', fromState, toState, user);

    if (user?.role === 'clerk') {
      const clerksCanApprove = prev.clerks_can_approve === true || prev.clerks_can_approve === 1;
      if (!clerksCanApprove) {
        throw new AppError('Clerks cannot change engagement stage unless clerksCanApprove is enabled', 'INSUFFICIENT_PERMISSIONS', HTTP.FORBIDDEN);
      }
    }

    try {
      create('activity_log', {
        entity_type: 'engagement', entity_id: context.id,
        action: 'stage_transition',
        message: `Stage transitioned: ${fromState} -> ${toState}`,
        details: JSON.stringify({ from: fromState, to: toState, user_role: user?.role }),
        user_email: user?.email
      }, user);
    } catch (e) {
      console.error('[workflow-engine] Failed to log stage change:', e.message);
    }

    return context;
  }, { priority: 100, name: 'workflow-stage-validator' });

  console.log('[HOOKS] Registered universal workflow engine');
}
