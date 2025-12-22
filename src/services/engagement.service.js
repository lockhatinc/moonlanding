import { list, get, create, update, remove } from '@/engine';
import { recreateEngagement, batchRecreateEngagements } from '@/engine/recreation';
import { RFI_STATUS, RFI_CLIENT_STATUS, RFI_AUDITOR_STATUS } from '@/lib/status-helpers';

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

  transitionStage(engagementId, toStage) {
    const engagement = this.get(engagementId);
    if (!engagement) throw new Error('Engagement not found');
    return this.update(engagementId, { stage: toStage });
  }

  transitionStatus(engagementId, toStatus) {
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
