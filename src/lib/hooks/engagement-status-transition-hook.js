import {
  getSuggestedStatusTransitionsAfterStageChange,
  validateStatusTransition,
  getAutoStatusTransitionsForStage,
  validateEngagementStatusConsistency
} from '@/lib/engagement-status-transitions';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

export async function handleEngagementStatusTransitions(context) {
  const { entity, id, data, prev } = context;

  if (entity !== 'engagement' || !data.stage || data.stage === prev.stage) {
    return context;
  }

  const fromStage = prev.stage;
  const toStage = data.stage;

  console.log(`[STATUS_TRANSITION] Engagement ${id}: ${fromStage} → ${toStage}`);

  const suggestedTransitions = getSuggestedStatusTransitionsAfterStageChange(fromStage, toStage);
  
  const autoTransitions = getAutoStatusTransitionsForStage(toStage);

  const updates = {};

  for (const [statusField, targetStatus] of Object.entries(autoTransitions)) {
    const currentStatus = data[statusField] || prev[statusField];
    
    if (currentStatus === undefined) {
      updates[statusField] = targetStatus;
    } else if (currentStatus !== targetStatus) {
      const validation = validateStatusTransition(statusField, currentStatus, targetStatus);
      
      if (validation.valid) {
        updates[statusField] = targetStatus;
        console.log(`[STATUS_TRANSITION] Auto-transitioning ${statusField}: ${currentStatus} → ${targetStatus}`);
      } else {
        console.warn(`[STATUS_TRANSITION] Cannot auto-transition ${statusField}: ${validation.error}`);
      }
    }
  }

  Object.assign(data, updates);

  const finalEngagement = { ...prev, ...data };
  const consistency = validateEngagementStatusConsistency(finalEngagement);
  
  if (!consistency.valid) {
    throw new AppError(
      `Engagement status validation failed: ${consistency.errors.join('; ')}`,
      'STATUS_CONSISTENCY_FAILED',
      HTTP.BAD_REQUEST
    );
  }

  if (consistency.warnings.length > 0) {
    console.warn(`[STATUS_TRANSITION] Warnings for engagement ${id}:`, consistency.warnings);
  }

  return context;
}

export function registerEngagementStatusTransitionHooks(hookEngine) {
  hookEngine.register('update:engagement:before', handleEngagementStatusTransitions, {
    priority: 90,
    name: 'engagement-status-transitions'
  });

  console.log('[HOOKS] Registered engagement status transition handler');
}
