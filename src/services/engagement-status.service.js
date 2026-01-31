import { get, update } from '@/engine';
import {
  validateStatusTransition,
  canTransitionStatus,
  getStatusOptionsForField,
  getStatusLabelForField,
  getSuggestedStatusTransitionsAfterStageChange,
  validateEngagementStatusConsistency,
  initializeEngagementStatuses
} from '@/lib/engagement-status-transitions';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

class EngagementStatusService {
  getEngagement(engagementId) {
    return get('engagement', engagementId);
  }

  getStatusField(engagementId, statusField) {
    const engagement = this.getEngagement(engagementId);
    if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);
    return {
      field: statusField,
      value: engagement[statusField] || null,
      label: getStatusLabelForField(statusField, engagement[statusField])
    };
  }

  getAvailableStatusTransitions(engagementId, statusField) {
    const engagement = this.getEngagement(engagementId);
    if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

    const currentStatus = engagement[statusField];
    if (!currentStatus) {
      return {
        field: statusField,
        current: null,
        available: getStatusOptionsForField(statusField)
      };
    }

    const transitions = {
      field: statusField,
      current: currentStatus,
      available: []
    };

    const options = getStatusOptionsForField(statusField);
    for (const option of options) {
      if (canTransitionStatus(statusField, currentStatus, option.value)) {
        transitions.available.push(option);
      }
    }

    return transitions;
  }

  transitionStatus(engagementId, statusField, toStatus, user = null, reason = '') {
    const engagement = this.getEngagement(engagementId);
    if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

    const fromStatus = engagement[statusField];

    const validation = validateStatusTransition(statusField, fromStatus, toStatus);
    if (!validation.valid) {
      throw new AppError(validation.error, 'INVALID_STATUS_TRANSITION', HTTP.BAD_REQUEST);
    }

    const updates = {
      [statusField]: toStatus,
      [`${statusField}_updated_at`]: Math.floor(Date.now() / 1000)
    };

    if (user) {
      updates[`${statusField}_updated_by`] = user.id;
    }

    update('engagement', engagementId, updates, user);

    console.log(`[STATUS] Engagement ${engagementId}: ${statusField} ${fromStatus} → ${toStatus}`);

    return {
      success: true,
      field: statusField,
      from: fromStatus,
      to: toStatus,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  getStatusOverview(engagementId) {
    const engagement = this.getEngagement(engagementId);
    if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

    const statusFields = [
      'client_status',
      'letter_client_status',
      'letter_auditor_status',
      'post_rfi_client_status',
      'post_rfi_auditor_status',
      'auditor_status'
    ];

    const overview = {
      id: engagement.id,
      stage: engagement.stage,
      statuses: {}
    };

    for (const field of statusFields) {
      overview.statuses[field] = {
        value: engagement[field] || null,
        label: engagement[field] ? getStatusLabelForField(field, engagement[field]) : null
      };
    }

    const consistency = validateEngagementStatusConsistency(engagement);
    overview.consistency = {
      valid: consistency.valid,
      errors: consistency.errors,
      warnings: consistency.warnings
    };

    return overview;
  }

  getSuggestedTransitions(engagementId, fromStage, toStage) {
    const engagement = this.getEngagement(engagementId);
    if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

    return getSuggestedStatusTransitionsAfterStageChange(fromStage, toStage);
  }

  validateConsistency(engagementId) {
    const engagement = this.getEngagement(engagementId);
    if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

    return validateEngagementStatusConsistency(engagement);
  }

  initializeStatuses(engagementId, stage = 'info_gathering', user = null) {
    const engagement = this.getEngagement(engagementId);
    if (!engagement) throw new AppError('Engagement not found', 'NOT_FOUND', HTTP.NOT_FOUND);

    const statuses = initializeEngagementStatuses(stage);
    update('engagement', engagementId, statuses, user);

    return { success: true, statuses };
  }

  getAllStatusOptions() {
    const options = {};
    const statusFields = [
      'client_status',
      'letter_client_status',
      'letter_auditor_status',
      'post_rfi_client_status',
      'post_rfi_auditor_status',
      'auditor_status'
    ];

    for (const field of statusFields) {
      options[field] = getStatusOptionsForField(field);
    }

    return options;
  }
}

export const engagementStatusService = new EngagementStatusService();
