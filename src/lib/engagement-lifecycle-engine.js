import { getSpec } from '@/config/spec-helpers';
import { get, update, list } from '@/engine';
import { canAccessRow as canAccess } from '@/lib/permissions';
import { getConfigEngine } from '@/lib/config-generator-engine';

const STAGES = {
  info_gathering: 0,
  commencement: 1,
  team_execution: 2,
  partner_review: 3,
  finalization: 4,
  closeout: 5
};

const STAGE_LABELS = {
  info_gathering: 'Info Gathering',
  commencement: 'Commencement',
  team_execution: 'Team Execution',
  partner_review: 'Partner Review',
  finalization: 'Finalization',
  closeout: 'Close Out'
};

function getGateDefinitions(engagement) {
  return {
    commencement: {
      name: 'Engagement Letter',
      passed: engagement.has_engagement_letter || false,
      reason: engagement.has_engagement_letter ? 'Ready' : 'Engagement letter required'
    },
    team_execution: {
      name: 'Team Assignment',
      passed: engagement.has_team || false,
      reason: engagement.has_team ? 'Ready' : 'Team assignment required'
    },
    finalization: {
      name: 'RFI Responses',
      passed: engagement.has_rfi_responses || false,
      reason: engagement.has_rfi_responses ? 'Ready' : 'All RFI responses required'
    },
    closeout: {
      name: 'Closeout Requirements',
      passed: (engagement.engagement_letter_status === 'accepted' || engagement.progress === 0),
      reason: engagement.engagement_letter_status === 'accepted' ? 'Accepted' : engagement.progress === 0 ? 'Cancelled' : 'Letter acceptance or cancellation required'
    }
  };
}

export function getTransitionStatus(engagement) {
  const lockoutMinutes = 5;
  let inLockout = false;
  let minutesRemaining = 0;

  if (engagement.last_transition_at) {
    const lastTime = new Date(engagement.last_transition_at).getTime();
    const now = new Date().getTime();
    const elapsedMinutes = (now - lastTime) / 60000;

    if (elapsedMinutes < lockoutMinutes) {
      inLockout = true;
      minutesRemaining = Math.ceil(lockoutMinutes - elapsedMinutes);
    }
  }

  const failedGates = [];
  const gateDefinitions = getGateDefinitions(engagement);

  for (const [stage, gate] of Object.entries(gateDefinitions)) {
    if (!gate.passed) {
      failedGates.push({
        stage,
        name: gate.name,
        reason: gate.reason
      });
    }
  }

  return {
    inLockout,
    minutesRemaining,
    failedGates
  };
}

export function validateStageTransition(engagement, toStage, user) {
  if (!engagement) throw new Error('Engagement not found');
  if (!Object.keys(STAGES).includes(toStage)) throw new Error(`Invalid stage: ${toStage}`);

  const fromStage = engagement.stage;
  const stageNum = STAGES[toStage];
  const fromNum = STAGES[fromStage];

  // Permission checks
  if (toStage === 'closeout' && user.role !== 'partner') {
    throw new Error('Only partners can move to CloseOut');
  }

  if (user.role === 'clerk') {
    throw new Error('Clerks cannot change engagement stages');
  }

  // Validate gates based on target stage
  const gateDefinitions = getGateDefinitions(engagement);

  if (gateDefinitions[toStage]) {
    const gate = gateDefinitions[toStage];
    if (!gate.passed) {
      throw new Error(`Gate failed for ${toStage}: ${gate.reason}`);
    }
  }

  // Backward movement rules
  if (stageNum < fromNum) {
    if (fromStage === 'info_gathering' && new Date(engagement.commencement_date) <= new Date()) {
      throw new Error('Cannot move back to InfoGathering after commencement_date');
    }
    if (fromStage === 'finalization' || fromStage === 'closeout') {
      throw new Error(`Cannot move backward from ${fromStage}`);
    }
  }

  // Check lockout from previous transition
  if (engagement.last_transition_at) {
    const lockoutMinutes = 5;
    const lastTime = new Date(engagement.last_transition_at).getTime();
    const now = new Date().getTime();
    const elapsedMinutes = (now - lastTime) / 60000;

    if (elapsedMinutes < lockoutMinutes) {
      throw new Error(`Transition lockout: ${Math.ceil(lockoutMinutes - elapsedMinutes)}m remaining`);
    }
  }

  return true;
}

export async function transitionEngagement(engagementId, toStage, user, reason = '') {
  const engagement = get('engagement', engagementId);
  if (!engagement) throw new Error('Engagement not found');

  // Validate transition
  validateStageTransition(engagement, toStage, user);

  // Check for concurrent transitions (detect race conditions)
  const recentTransitions = getEngagementTransitions(engagementId, 10);
  if (recentTransitions.length > 0) {
    const lastTime = new Date(recentTransitions[0].timestamp).getTime();
    if (new Date().getTime() - lastTime < 5000) {
      throw new Error('Concurrent transition detected. Please refresh and try again.');
    }
  }

  // Execute transition
  const oldStage = engagement.stage;
  const now = new Date();

  const updates = {
    stage: toStage,
    last_transition_at: Math.floor(now.getTime() / 1000),
    transition_attempts: (engagement.transition_attempts || 0) + 1
  };

  // Stage-specific actions
  if (toStage === 'commencement') {
    updates.commencement_date = engagement.commencement_date || Math.floor(now.getTime() / 1000);
  }

  update('engagement', engagementId, updates, user);

  // Log transition
  logTransition(engagementId, oldStage, toStage, user.id, reason);

  return { success: true, from: oldStage, to: toStage };
}

export function getAvailableTransitions(engagement, user) {
  if (!engagement) return [];

  const availableStages = [];
  const currentNum = STAGES[engagement.stage];

  for (const [stage, num] of Object.entries(STAGES)) {
    if (stage === engagement.stage) continue;

    // Check if transition is allowed
    try {
      validateStageTransition(engagement, stage, { role: user.role });
      availableStages.push({
        stage,
        label: STAGE_LABELS[stage],
        forward: num > currentNum,
        backward: num < currentNum
      });
    } catch (e) {
      // Transition not allowed
    }
  }

  return availableStages;
}

export function getEngagementTransitions(engagementId, limit = 10) {
  const transitions = list('activity_log', {
    where: {
      entity_id: engagementId,
      entity_type: 'engagement',
      action_type: 'stage_transition'
    },
    orderBy: { field: 'timestamp', direction: 'desc' },
    limit
  });

  if (!transitions || transitions.length === 0) return [];

  return transitions.map(t => ({
    from_stage: t.metadata?.from_stage,
    to_stage: t.metadata?.to_stage,
    timestamp: t.timestamp,
    user_id: t.user_id,
    reason: t.metadata?.reason
  }));
}

function logTransition(engagementId, fromStage, toStage, userId, reason) {
  // Log to activity_log collection
  // Should be called via hook system for automatic logging
  try {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    // In real implementation: insert into activity_log table
    console.log(`[engagement-lifecycle] Transition: ${fromStage} → ${toStage} by ${userId} @ ${timestamp}`);
  } catch (e) {
    console.error('[engagement-lifecycle] Failed to log transition:', e.message);
  }
}

export function shouldAutoTransition(engagement) {
  if (engagement.stage !== 'info_gathering') return false;
  if (!engagement.commencement_date) return false;

  const now = new Date();
  const commencementDate = new Date(engagement.commencement_date * 1000);

  return now >= commencementDate;
}

export const engagementLifecycleStages = STAGES;
export const stageLables = STAGE_LABELS;
