export class RfiStateMachine {
  constructor(config = {}) {
    this.stateConfig = config.rfiStateMachine || {};
  }

  getCurrentState(rfi) {
    if (rfi.state) return rfi.state;

    if (rfi.client_status === 'completed' || rfi.status === 'completed') {
      return 'completed';
    }
    if (rfi.client_status === 'responded') {
      return 'responded';
    }
    if (rfi.client_status === 'sent' || rfi.auditor_status === 'reviewing') {
      return 'sent';
    }
    return 'pending';
  }

  async transition(rfi, newState, context) {
    const stateConfig = this.stateConfig.states[newState];
    if (!stateConfig) throw new Error(`Invalid state: ${newState}`);

    const currentState = this.getCurrentState(rfi);
    if (!stateConfig.nextStates.includes(currentState) && currentState !== newState) {
      throw new Error(`Cannot transition from ${currentState} to ${newState}`);
    }

    if (newState === 'completed') {
      const hasAttachment = (context.files_count || 0) > 0;
      const hasResponse = (context.responses_count || 0) > 0;
      if (!hasAttachment && !hasResponse) {
        throw new Error(this.stateConfig.validation.canCompleteRfi.message);
      }
    }

    return {
      state: newState,
      client_status: stateConfig.displayStatus.client,
      auditor_status: stateConfig.displayStatus.auditor,
      lifecycle_status: stateConfig.displayStatus.lifecycle,
      transitionedAt: Math.floor(Date.now() / 1000)
    };
  }

  getDaysOutstanding(rfi) {
    const state = this.getCurrentState(rfi);
    const stateConfig = this.stateConfig.states[state];

    if (!stateConfig?.daysOutstandingApplies || !rfi.date_requested) {
      return null;
    }

    const requestDate = new Date(rfi.date_requested * 1000);
    const now = new Date();
    const diffMs = now - requestDate;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  getNotifications(rfi) {
    const state = this.getCurrentState(rfi);
    const stateConfig = this.stateConfig.states[state];

    if (!stateConfig?.daysOutstandingApplies) {
      return [];
    }

    const notifications = [];
    const daysOutstanding = this.getDaysOutstanding(rfi);

    if (daysOutstanding === null) return [];

    const thresholds = stateConfig.notificationRules?.onDayThreshold || [];
    for (const threshold of thresholds) {
      if (daysOutstanding >= threshold) {
        notifications.push({
          type: 'days_outstanding',
          threshold,
          rule: stateConfig.notificationRules.escalationRules[threshold],
          daysOutstanding
        });
      }
    }

    return notifications;
  }

  getDisplayState(rfi) {
    const state = this.getCurrentState(rfi);
    return this.stateConfig.states[state]?.displayStatus || {};
  }

  canTransition(fromState, toState) {
    const config = this.stateConfig.states[fromState];
    return config?.nextStates?.includes(toState) || false;
  }
}

export default RfiStateMachine;
