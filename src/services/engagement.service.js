import { list, get, create, update, remove } from '@/engine';
import { ENGAGEMENT_STATUS, ENGAGEMENT_STAGE, RFI_STATUS, RFI_CLIENT_STATUS, RFI_AUDITOR_STATUS } from '@/lib/status-helpers';

class EngagementService {
  calcNextPeriod(year, month, interval) {
    if (interval === 'yearly') return { year: year + 1, month };
    if (interval === 'monthly') return month === 12 ? { year: year + 1, month: 1 } : { year, month: (month || 0) + 1 };
    throw new Error('No repeat interval');
  }

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
    const src = this.get(sourceId);
    if (!src) throw new Error('Source engagement not found');

    const { year, month } = this.calcNextPeriod(src.year, src.month, src.repeat_interval);

    const existing = list('engagement', { client_id: src.client_id, engagement_type: src.engagement_type });
    if (existing.find(e => e.year === year && e.month === month && e.id !== sourceId)) {
      throw new Error(`Engagement exists for ${year}/${month || 'annual'}`);
    }

    let newEng = null;
    try {
      newEng = this.create({
        name: src.name,
        client_id: src.client_id,
        year,
        month,
        stage: ENGAGEMENT_STAGE.INFO_GATHERING,
        status: ENGAGEMENT_STATUS.PENDING,
        team_id: src.team_id,
        template_id: src.template_id,
        engagement_type: src.engagement_type,
        progress: 0,
        repeat_interval: src.repeat_interval,
        recreate_with_attachments: src.recreate_with_attachments,
      });

      this.update(sourceId, { repeat_interval: 'once' });
      return newEng;
    } catch (e) {
      if (newEng?.id) {
        list('rfi', { engagement_id: newEng.id }).forEach(r => remove('rfi', r.id));
        remove('engagement', newEng.id);
      }
      throw e;
    }
  }

  async batchRecreate(ids) {
    const results = [];
    for (const id of ids) {
      try {
        const newEng = await this.recreate(id);
        results.push({ success: true, sourceId: id, newId: newEng.id });
      } catch (err) {
        results.push({ success: false, sourceId: id, error: err.message });
      }
    }
    return results;
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
