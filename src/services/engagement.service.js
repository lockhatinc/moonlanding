import { list, get, create, update, remove } from '@/engine';
import { recreateEngagement, batchRecreateEngagements } from '@/engine/recreation';
import { RFI_STATUS, RFI_CLIENT_STATUS, RFI_AUDITOR_STATUS } from '@/lib/status-helpers';
import { getSystemConfig } from '@/config';

class EngagementService {
  get(id) {
    return get('engagement', id);
  }

  list(filters, options) {
    return list('engagement', filters, options);
  }

  create(data) {
    return create('engagement', data);
  }

  update(id, data) {
    return update('engagement', id, data);
  }

  delete(id) {
    return remove('engagement', id);
  }

  async recreate(sourceId) {
    return recreateEngagement(sourceId);
  }

  async batchRecreate(ids) {
    const result = await batchRecreateEngagements(ids);
    return result.success.map(item => ({ success: true, ...item })).concat(
      result.failed.map(item => ({ success: false, ...item }))
    );
  }

  async transitionStage(engagementId, toStage, user = null) {
    const engagement = this.get(engagementId);
    if (!engagement) throw new Error('Engagement not found');

    if (user) {
      const { lifecycleEngine } = await getSystemConfig();
      const spec = { name: 'engagement' };

      if (!lifecycleEngine.canTransition(spec, engagement.stage, toStage, user)) {
        throw new Error(`Cannot transition from ${engagement.stage} to ${toStage}`);
      }

      const validationResult = await lifecycleEngine.validateTransition(spec, engagement.stage, toStage, { entity: engagement, user });
      if (!validationResult.valid) {
        throw new Error(`Transition validation failed: ${validationResult.error}`);
      }
    }

    return this.update(engagementId, { stage: toStage });
  }

  async transitionStatus(engagementId, toStatus, user = null) {
    const engagement = this.get(engagementId);
    if (!engagement) throw new Error('Engagement not found');
    return this.update(engagementId, { status: toStatus });
  }

  calculateProgress(engagementId) {
    const engagement = this.get(engagementId);
    if (!engagement) return 0;
    const rfis = list('rfi', { engagement_id: engagementId });
    if (rfis.length === 0) return 0;
    const completed = rfis.filter(r => r.status === RFI_STATUS.RESOLVED).length;
    return Math.round((completed / rfis.length) * 100);
  }
}

export const engagementService = new EngagementService();
