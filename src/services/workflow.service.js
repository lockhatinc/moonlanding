import { getEngagementStages } from '@/lib/status-helpers';

class WorkflowService {
  constructor() {
    const stages = getEngagementStages();
    this.transitions = {
      engagement: {
        'pending': ['active', 'archived'],
        'active': ['completed', 'on_hold', 'archived'],
        'on_hold': ['active', 'archived'],
        'completed': ['archived'],
        'archived': [],
      },
      rfi: {
        'pending': ['requested', 'responded', 'resolved'],
        'requested': ['responded', 'resolved'],
        'responded': ['resolved'],
        'resolved': [],
      },
    };
  }

  canTransition(entity, record, toStatus, user) {
    const entityName = typeof entity === 'string' ? entity : entity.name;
    const currentStatus = record.status;
    const transitions = this.transitions[entityName]?.[currentStatus];
    return Array.isArray(transitions) && transitions.includes(toStatus);
  }

  transition(entity, record, toStatus, user, context = {}) {
    if (!this.canTransition(entity, record, toStatus, user)) {
      throw new Error(`Cannot transition from ${record.status} to ${toStatus}`);
    }
    return {
      fromStatus: record.status,
      toStatus,
      timestamp: Date.now(),
      user: user?.id,
      context,
    };
  }

  getAvailableTransitions(entity, record, user) {
    const entityName = typeof entity === 'string' ? entity : entity.name;
    return this.transitions[entityName]?.[record.status] || [];
  }

  canTransitionStage(entity, record, toStage, user) {
    const stages = getEngagementStages();
    const stageOrder = [stages.INFO_GATHERING, stages.TEAM_EXECUTION, stages.FINALIZATION];
    const currentIndex = stageOrder.indexOf(record.stage);
    const targetIndex = stageOrder.indexOf(toStage);
    return currentIndex < targetIndex || currentIndex === targetIndex;
  }

  transitionStage(entity, record, toStage, user) {
    if (!this.canTransitionStage(entity, record, toStage, user)) {
      throw new Error(`Cannot transition stage from ${record.stage} to ${toStage}`);
    }
    return {
      fromStage: record.stage,
      toStage,
      timestamp: Date.now(),
      user: user?.id,
    };
  }

  isCompleted(entity, record) {
    return record.status === 'completed' || record.status === 'archived';
  }

  executeOnTransition(entity, record, fromStatus, toStatus) {
    const handlers = {
      'active_completed': (rec) => ({ completedAt: Date.now() }),
      'pending_active': (rec) => ({ startedAt: Date.now() }),
    };
    const key = `${fromStatus}_${toStatus}`;
    const handler = handlers[key];
    return handler ? handler(record) : {};
  }
}

export const workflowService = new WorkflowService();
