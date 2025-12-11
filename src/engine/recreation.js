// Engagement Recreation - Compact implementation
import { list, get, update, create, remove } from '../engine';

// === HELPERS ===
const calcNextPeriod = (year, month, interval) => {
  if (interval === 'yearly') return { year: year + 1, month };
  if (interval === 'monthly') return month === 12 ? { year: year + 1, month: 1 } : { year, month: (month || 0) + 1 };
  throw new Error('No repeat interval');
};

const copyEntity = (entity, src, overrides) => {
  const e = list(entity, { [Object.keys(src)[0]]: Object.values(src)[0] });
  return e.map(item => create(entity, { ...item, id: undefined, ...overrides(item) }));
};

// === MAIN ===
export async function recreateEngagement(sourceId) {
  const src = get('engagement', sourceId);
  if (!src) throw new Error('Source engagement not found');

  const { year, month } = calcNextPeriod(src.year, src.month, src.repeat_interval);

  // Check duplicates
  if (list('engagement', { client_id: src.client_id, engagement_type: src.engagement_type }).find(e => e.year === year && e.month === month && e.id !== sourceId)) {
    throw new Error(`Engagement exists for ${year}/${month || 'annual'}`);
  }

  let newEng = null;
  try {
    // Create engagement
    newEng = create('engagement', {
      name: src.name, client_id: src.client_id, year, month, stage: 'info_gathering', status: 'pending',
      team_id: src.team_id, template_id: src.template_id, engagement_type: src.engagement_type,
      progress: 0, client_progress: 0, client_status: 'pending', auditor_status: 'requested',
      letter_client_status: 'pending', letter_auditor_status: 'pending', post_rfi_client_status: 'pending', post_rfi_auditor_status: 'pending',
      repeat_interval: src.repeat_interval, recreate_with_attachments: src.recreate_with_attachments, clerks_can_approve: src.clerks_can_approve, is_private: src.is_private, fee: src.fee,
      users: src.users, client_users: src.client_users, previous_year_review_id: src.review_id,
    });

    // Copy sections
    const sectionMap = {};
    for (const s of list('engagement_section', { engagement_id: sourceId })) {
      const ns = create('engagement_section', { engagement_id: newEng.id, name: s.name, key: s.key, sort_order: s.sort_order });
      sectionMap[s.id] = ns.id;
    }

    // Copy RFIs
    const rfis = list('rfi', { engagement_id: sourceId });
    for (const r of rfis) {
      const nr = create('rfi', {
        engagement_id: newEng.id, section_id: r.section_id ? sectionMap[r.section_id] : null,
        key: r.key, name: r.name, question: r.question, status: 0, rfi_status: 'pending', client_status: 'pending', auditor_status: 'requested',
        date_requested: null, date_resolved: null, deadline: null, deadline_date: null, days_outstanding: 0, response_count: 0, files_count: 0, responses: null, files: null,
        flag: false, ml_query: r.ml_query, assigned_users: r.assigned_users, recreate_with_attachments: r.recreate_with_attachments, sort_order: r.sort_order,
      });
      if (src.recreate_with_attachments || r.recreate_with_attachments) {
        await copyRfiData(r.id, nr.id);
      }
    }

    // Update source & log
    update('engagement', sourceId, { repeat_interval: 'once' });
    create('recreation_log', { engagement_id: sourceId, client_id: src.client_id, engagement_type_id: src.engagement_type, status: 'completed', details: JSON.stringify({ source_id: sourceId, new_id: newEng.id, year, month, sections: Object.keys(sectionMap).length, rfis: rfis.length }) });
    return newEng;
  } catch (e) {
    if (newEng?.id) {
      list('rfi', { engagement_id: newEng.id }).forEach(r => remove('rfi', r.id));
      list('engagement_section', { engagement_id: newEng.id }).forEach(s => remove('engagement_section', s.id));
      remove('engagement', newEng.id);
    }
    update('engagement', sourceId, { repeat_interval: src.repeat_interval });
    create('recreation_log', { engagement_id: sourceId, client_id: src.client_id, status: 'failed', error: e.message, details: JSON.stringify({ source_id: sourceId, year, month }) });
    throw e;
  }
}

async function copyRfiData(srcId, tgtId) {
  const src = get('rfi', srcId);
  // Copy files
  for (const f of list('file', { entity_type: 'rfi', entity_id: srcId })) {
    create('file', { entity_type: 'rfi', entity_id: tgtId, drive_file_id: f.drive_file_id, file_name: f.file_name, file_type: f.file_type, file_size: f.file_size, mime_type: f.mime_type, download_url: f.download_url });
  }
  if (src?.files) update('rfi', tgtId, { files: src.files, files_count: JSON.parse(src.files || '[]').length });
  // Copy responses
  for (const r of list('rfi_response', { rfi_id: srcId })) {
    create('rfi_response', { rfi_id: tgtId, content: r.content, attachments: r.attachments, is_client: r.is_client });
  }
  if (src?.responses) update('rfi', tgtId, { responses: src.responses, response_count: JSON.parse(src.responses || '[]').length });
}

export const batchRecreateEngagements = async (ids) => {
  const results = { success: [], failed: [] };
  for (const id of ids) {
    try { results.success.push({ sourceId: id, newId: (await recreateEngagement(id)).id }); }
    catch (e) { results.failed.push({ sourceId: id, error: e.message }); }
  }
  return results;
};

export const getEngagementsDueForRecreation = (interval) => list('engagement', { repeat_interval: interval, status: 'active' }).filter(e => e.stage === 'close_out' || e.status === 'completed');

export const previewRecreation = (sourceId) => {
  const src = get('engagement', sourceId);
  if (!src) throw new Error('Source not found');
  const { year, month } = calcNextPeriod(src.year, src.month, src.repeat_interval);
  return { source: { id: src.id, name: src.name, year: src.year, month: src.month, repeat_interval: src.repeat_interval }, preview: { year, month, sections: list('engagement_section', { engagement_id: sourceId }).length, rfis: list('rfi', { engagement_id: sourceId }).length, with_attachments: src.recreate_with_attachments } };
};
