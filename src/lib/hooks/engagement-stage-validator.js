import { LifecycleEngine } from '@/lib/lifecycle-engine';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { create } from '@/lib/query-engine';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

let lifecycleEngine = null;

function getLifecycleEngine() {
  if (!lifecycleEngine) {
    const configEngine = getConfigEngine();
    const config = configEngine.getConfig();
    const lifecycleStages = {};

    const engagementWorkflow = config.workflows?.engagement_lifecycle;
    if (engagementWorkflow?.stages) {
      lifecycleStages.engagement = {
        transitions: {}
      };

      engagementWorkflow.stages.forEach(stage => {
        lifecycleStages.engagement.transitions[stage.name] = {
          forward: stage.forward || [],
          backward: stage.backward || [],
          requiresRole: stage.requires_role || ['partner', 'manager'],
          validation: stage.validation || [],
          readonly: stage.readonly || false,
          autoTransition: stage.auto_transition || false,
          autoTransitionOn: stage.auto_transition_trigger || null,
          entry: stage.entry || 'default'
        };
      });
    }

    lifecycleEngine = new LifecycleEngine({ lifecycleStages });
  }
  return lifecycleEngine;
}

function logStageChange(entityId, fromStage, toStage, user) {
  try {
    create('notification', {
      entity_type: 'engagement',
      entity_id: entityId,
      type: 'stage_transition',
      title: `Stage changed from ${fromStage} to ${toStage}`,
      message: `Engagement stage transitioned: ${fromStage} → ${toStage}`,
      severity: 'info',
      user_id: user?.id,
      user_email: user?.email,
      read: false
    }, user);
    create('activity_log', {
      entity_type: 'engagement',
      entity_id: entityId,
      action: 'stage_transition',
      message: `Stage transitioned: ${fromStage} → ${toStage}`,
      details: JSON.stringify({
        from: fromStage,
        to: toStage,
        user_role: user?.role,
        user_email: user?.email
      }),
      user_email: user?.email
    }, user);
  } catch (error) {
    console.error('[STAGE_VALIDATOR] Failed to log stage change:', error.message);
  }
}

function logPermissionDenial(entityId, fromStage, toStage, user, reason, details = {}) {
  try {
    create('activity_log', {
      entity_type: 'engagement',
      entity_id: entityId,
      action: 'stage_transition_denied',
      message: `Stage transition denied: ${fromStage} → ${toStage}`,
      details: JSON.stringify({
        from: fromStage,
        to: toStage,
        reason,
        user_role: user?.role,
        user_email: user?.email,
        ...details
      }),
      user_email: user?.email
    }, user);
  } catch (error) {
    console.error('[STAGE_VALIDATOR] Failed to log permission denial:', error.message);
  }
}

export async function validateEngagementStageTransition(context) {
  const { entity, id, data, user, prev } = context;

  if (entity !== 'engagement') {
    return context;
  }

  if (!data.stage || data.stage === prev.stage) {
    return context;
  }

  const fromStage = prev.stage;
  const toStage = data.stage;
  const lifecycle = getLifecycleEngine();

  const canTransition = lifecycle.canTransition('engagement', fromStage, toStage, user);
  if (!canTransition) {
    const stageConfig = lifecycle.lifecycleStages?.engagement?.transitions?.[fromStage];
    const allowedTransitions = [
      ...(stageConfig?.forward || []),
      ...(stageConfig?.backward || [])
    ];

    throw new AppError(
      `Invalid stage transition from "${fromStage}" to "${toStage}". Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      'STAGE_TRANSITION_INVALID',
      HTTP.BAD_REQUEST
    );
  }

  // Validate backward transitions with date constraints
  const stageOrder = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'closeout'];
  const fromIndex = stageOrder.indexOf(fromStage);
  const toIndex = stageOrder.indexOf(toStage);
  const isBackwardTransition = toIndex < fromIndex;

  if (isBackwardTransition && toStage === 'info_gathering') {
    const now = Math.floor(Date.now() / 1000);
    if (prev.commencement_date && prev.commencement_date <= now) {
      throw new AppError(
        `Cannot revert to info_gathering stage after commencement date has passed`,
        'DATE_CONSTRAINT_VIOLATED',
        HTTP.BAD_REQUEST
      );
    }
  }

  // Validate entry constraints for target stage
  // This hook is called for manual user-initiated transitions only
  const targetStageConfig = lifecycle.lifecycleStages?.engagement?.transitions?.[toStage];
  if (targetStageConfig?.entry) {
    const entryField = targetStageConfig.entry;

    // Parse entry field which can be: manual, auto|manual, default, partner_only, etc.
    const allowsManual = entryField === 'manual' ||
                        entryField === 'auto|manual' ||
                        entryField === 'default' ||
                        entryField === 'default|manual';

    // Check if manual entry is allowed for this stage
    if (!allowsManual && entryField !== 'partner_only') {
      throw new AppError(
        `Stage "${toStage}" does not allow manual entry. Allowed entry modes: ${entryField}`,
        'STAGE_ENTRY_CONSTRAINT',
        HTTP.FORBIDDEN
      );
    }

    // Check if entry requires partner role
    if (entryField === 'partner_only' && user?.role !== 'partner') {
      throw new AppError(
        `Only partners can manually enter "${toStage}" stage. Current role: ${user?.role}`,
        'STAGE_ENTRY_CONSTRAINT',
        HTTP.FORBIDDEN
      );
    }
  }

  const userRole = user?.role;
  const isPartner = userRole === 'partner';
  const isManager = userRole === 'manager';
  const isClerk = userRole === 'clerk';
  const clerksCanApprove = prev.clerks_can_approve === true || prev.clerks_can_approve === 1;

  if (toStage === 'partner_review') {
    if (!isPartner && !isManager) {
      logPermissionDenial(id, fromStage, toStage, user, 'insufficient_role', {
        required_role: 'partner or manager',
        user_role: userRole
      });
      throw new AppError(
        `Only partners and managers can move to partner_review stage. Current role: ${userRole}`,
        'INSUFFICIENT_PERMISSIONS',
        HTTP.FORBIDDEN
      );
    }
    if (isClerk) {
      logPermissionDenial(id, fromStage, toStage, user, 'clerk_restricted', {
        user_role: userRole
      });
      throw new AppError(
        'Clerks cannot move engagement to partner_review stage',
        'INSUFFICIENT_PERMISSIONS',
        HTTP.FORBIDDEN
      );
    }
  }

  if (toStage === 'finalization') {
    if (!isPartner) {
      logPermissionDenial(id, fromStage, toStage, user, 'partner_only', {
        user_role: userRole
      });
      throw new AppError(
        `Only partners can move to finalization stage. Current role: ${userRole}`,
        'INSUFFICIENT_PERMISSIONS',
        HTTP.FORBIDDEN
      );
    }
  }

  if (toStage === 'closeout') {
    if (!isPartner) {
      logPermissionDenial(id, fromStage, toStage, user, 'partner_exclusive', {
        user_role: userRole
      });
      throw new AppError(
        `Only partners can close out engagements. Current role: ${userRole}`,
        'INSUFFICIENT_PERMISSIONS',
        HTTP.FORBIDDEN
      );
    }
  }

  if (toStage === 'commencement' || toStage === 'team_execution') {
    if (isClerk && !clerksCanApprove) {
      logPermissionDenial(id, fromStage, toStage, user, 'clerk_approval_disabled', {
        clerks_can_approve: clerksCanApprove,
        user_role: userRole
      });
      throw new AppError(
        `Clerks cannot move to ${toStage} stage unless clerksCanApprove is enabled on this engagement`,
        'INSUFFICIENT_PERMISSIONS',
        HTTP.FORBIDDEN
      );
    }
  }

  if (isClerk && !clerksCanApprove && !isPartner && !isManager) {
    logPermissionDenial(id, fromStage, toStage, user, 'clerk_general_restriction', {
      clerks_can_approve: clerksCanApprove,
      user_role: userRole
    });
    throw new AppError(
      'Clerks cannot change engagement stage unless clerksCanApprove is enabled on this engagement',
      'INSUFFICIENT_PERMISSIONS',
      HTTP.FORBIDDEN
    );
  }

  const validationContext = {
    ...prev,
    ...data,
    id
  };

  const isValid = await lifecycle.validateTransition(
    'engagement',
    fromStage,
    toStage,
    validationContext
  );

  if (!isValid) {
    throw new AppError(
      `Stage transition validation failed. Ensure all requirements are met for entering "${toStage}" stage.`,
      'STAGE_VALIDATION_FAILED',
      HTTP.BAD_REQUEST
    );
  }

  const isReadOnly = lifecycle.isReadOnly('engagement', toStage);
  if (isReadOnly && Object.keys(data).length > 1) {
    throw new AppError(
      `Stage "${toStage}" is read-only. No modifications allowed except stage transition.`,
      'STAGE_READONLY',
      HTTP.FORBIDDEN
    );
  }

  logStageChange(id, fromStage, toStage, user);

  console.log(`[STAGE_VALIDATOR] Engagement ${id}: ${fromStage} → ${toStage} (user: ${user?.email})`);

  return context;
}

export function registerEngagementStageHooks(hookEngine) {
  hookEngine.register('update:engagement:before', validateEngagementStageTransition, {
    priority: 100,
    name: 'engagement-stage-validator'
  });

  console.log('[HOOKS] Registered engagement stage transition validator');
}
