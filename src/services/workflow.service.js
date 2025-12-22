import { ENGAGEMENT_STATUS, ENGAGEMENT_STAGE, RFI_STATUS } from '@/lib/status-helpers';

class WorkflowService {
  constructor() {
    this.transitions = {
      engagement: {
        [ENGAGEMENT_STATUS.PENDING]: [ENGAGEMENT_STATUS.ACTIVE, ENGAGEMENT_STATUS.ARCHIVED],
        [ENGAGEMENT_STATUS.ACTIVE]: [ENGAGEMENT_STATUS.COMPLETED, ENGAGEMENT_STATUS.ON_HOLD, ENGAGEMENT_STATUS.ARCHIVED],
        [ENGAGEMENT_STATUS.ON_HOLD]: [ENGAGEMENT_STATUS.ACTIVE, ENGAGEMENT_STATUS.ARCHIVED],
        [ENGAGEMENT_STATUS.COMPLETED]: [ENGAGEMENT_STATUS.ARCHIVED],
        [ENGAGEMENT_STATUS.ARCHIVED]: [],
      },
      rfi: {
        [RFI_STATUS.PENDING]: [RFI_STATUS.REQUESTED, RFI_STATUS.RESPONDED, RFI_STATUS.RESOLVED],
        [RFI_STATUS.REQUESTED]: [RFI_STATUS.RESPONDED, RFI_STATUS.RESOLVED],
        [RFI_STATUS.RESPONDED]: [RFI_STATUS.RESOLVED],
        [RFI_STATUS.RESOLVED]: [],
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
    const stages = [ENGAGEMENT_STAGE.INFO_GATHERING, ENGAGEMENT_STAGE.TEAM_EXECUTION, ENGAGEMENT_STAGE.FINALIZATION];
    const currentIndex = stages.indexOf(record.stage);
    const targetIndex = stages.indexOf(toStage);
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
    return record.status === ENGAGEMENT_STATUS.COMPLETED || record.status === ENGAGEMENT_STATUS.ARCHIVED;
  }

  executeOnTransition(entity, record, fromStatus, toStatus) {
    const handlers = {
      [`${ENGAGEMENT_STATUS.ACTIVE}_${ENGAGEMENT_STATUS.COMPLETED}`]: (rec) => ({ completedAt: Date.now() }),
      [`${ENGAGEMENT_STATUS.PENDING}_${ENGAGEMENT_STATUS.ACTIVE}`]: (rec) => ({ startedAt: Date.now() }),
    };
    const key = `${fromStatus}_${toStatus}`;
    const handler = handlers[key];
    return handler ? handler(record) : {};
  }
}

export const workflowService = new WorkflowService();
