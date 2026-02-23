import { list, get, count } from '@/lib/query-engine.js';
import { getConfigEngineSync } from '@/lib/config-generator-engine.js';

export function resolveEnumOptions(spec) {
  const resolvedSpec = { ...spec, fields: { ...spec.fields } };
  const engine = getConfigEngineSync();
  const config = engine.getConfig();
  for (const [fieldKey, field] of Object.entries(spec.fields || {})) {
    if (field.type === 'enum' && typeof field.options === 'string' && field.options.includes('engagement_lifecycle.stages')) {
      const stages = config.workflows?.engagement_lifecycle?.stages || [];
      resolvedSpec.fields[fieldKey] = { ...field, options: stages.map(s => ({ value: s.name, label: s.label || s.name })) };
    }
  }
  return resolvedSpec;
}

export function getRefOptions(spec) {
  const refOptions = {};
  for (const [fieldKey, field] of Object.entries(spec.fields || {}).filter(([k, f]) => f.type === 'ref' && f.ref)) {
    try { refOptions[fieldKey] = list(field.ref, {}).map(r => ({ value: r.id, label: r.name || r.title || r.label || r.email || r.id })); }
    catch { refOptions[fieldKey] = []; }
  }
  return refOptions;
}

export function resolveRefFields(items, spec) {
  try {
    const refFields = Object.entries(spec.fields || {}).filter(([k, f]) => f.type === 'ref' && f.ref);
    if (!refFields.length) return items;
    const refCaches = {};
    for (const [fieldKey, field] of refFields) {
      const refIds = [...new Set(items.map(i => i[fieldKey]).filter(Boolean))];
      if (refIds.length) try { refCaches[fieldKey] = Object.fromEntries(list(field.ref, {}).map(r => [r.id, r.name || r.title || r.label || r.id])); } catch {}
    }
    return items.map(item => {
      const resolved = { ...item };
      for (const [fieldKey] of refFields) {
        if (item[fieldKey] && refCaches[fieldKey]) resolved[`${fieldKey}_display`] = refCaches[fieldKey][item[fieldKey]] || item[fieldKey];
      }
      return resolved;
    });
  } catch { return items; }
}

export async function getDashboardStats(user) {
  try {
    const engagements = list('engagement', {});
    const clients = list('client', {});
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
    const rfis = list('rfi', {});
    const reviews = list('review', {});
    const myRfis = user ? rfis.filter(r => r.assigned_to === user.id) : [];
    const now = Math.floor(Date.now() / 1000);
    const overdueRfis = rfis.filter(r => r.status !== 'closed' && r.due_date && r.due_date < now).map(r => ({ ...r, daysOverdue: Math.floor((now - r.due_date) / 86400) }));
    const recentEngagements = [...engagements].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0)).slice(0, 8).map(e => ({ ...e, client_name: clientMap[e.client_id] || e.client_name || '-' }));
    return { engagements: engagements.length, clients: clients.length, rfis: rfis.length, reviews: reviews.length, myRfis, overdueRfis, recentEngagements };
  } catch { return { engagements: 0, clients: 0, rfis: 0, reviews: 0, myRfis: [], overdueRfis: [], recentEngagements: [] }; }
}

export async function getSettingsCounts() {
  const counts = {};
  const entities = { users: 'user', teams: 'team', rfiSections: 'rfi_section', templates: 'review_template', checklists: 'checklist', recreation: 'permission_audit' };
  for (const [key, entity] of Object.entries(entities)) { try { counts[key] = count(entity); } catch { counts[key] = 0; } }
  return counts;
}

export async function getSystemConfig() {
  try {
    const { getConfigEngineSync: gce } = await import('@/lib/config-generator-engine.js');
    const engine = gce();
    const config = engine.getConfig();
    return { database: config.system?.database || {}, server: config.system?.server || {}, thresholds: config.thresholds || {} };
  } catch { return {}; }
}

export async function getAuditData() {
  try {
    const audits = list('permission_audit', {});
    const cutoff = Math.floor(Date.now() / 1000) - 30 * 86400;
    const recent = audits.filter(a => (a.timestamp || a.created_at) > cutoff);
    return { summary: { total_actions: recent.length, grants: recent.filter(a => a.action === 'grant').length, revokes: recent.filter(a => a.action === 'revoke').length, role_changes: recent.filter(a => a.action === 'role_change').length }, recentActivity: audits.slice(0, 50) };
  } catch { return { summary: {}, recentActivity: [] }; }
}

export function getClientDashboardStats(clientId) {
  try {
    const engagements = list('engagement', {}).filter(e => e.client_id === clientId);
    const rfis = list('rfi', {}).filter(r => engagements.some(e => e.id === r.engagement_id));
    const reviews = list('review', {}).filter(r => engagements.some(e => e.id === r.engagement_id));
    const users = list('user', {}).filter(u => u.client_id === clientId);
    return { engagements: engagements.length, activeRfis: rfis.filter(r => r.status !== 'closed' && r.status !== 'completed').length, users: users.length, reviews: reviews.length, engagementList: engagements.slice(0, 10) };
  } catch { return { engagements: 0, activeRfis: 0, users: 0, reviews: 0, engagementList: [] }; }
}

export async function getSystemHealth() {
  try {
    const entityCounts = {};
    for (const e of ['user','client','engagement','rfi','review','team']) { try { entityCounts[e] = count(e); } catch { entityCounts[e] = 0; } }
    const u = process.uptime();
    return { database: { status: 'Connected', type: 'SQLite' }, server: { port: 3004, uptime: `${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m` }, entities: entityCounts };
  } catch { return {}; }
}

export function renderBuildLogsContent(logs) {
  const rows = (logs || []).map(l => {
    const sts = l.status === 'success' ? '<span style="color:#22c55e">Success</span>' : l.status === 'failed' ? '<span style="color:#ef4444">Failed</span>' : `<span style="color:#f59e0b">${l.status || 'pending'}</span>`;
    const ts = l.created_at ? new Date(l.created_at * 1000).toLocaleString() : '-';
    return `<tr><td style="padding:8px 12px">${l.version||'-'}</td><td style="padding:8px 12px">${sts}</td><td style="padding:8px 12px;font-size:0.78rem;color:#888">${ts}</td><td style="padding:8px 12px">${l.duration?l.duration+'s':'-'}</td><td style="padding:8px 12px;font-size:0.78rem">${l.message||'-'}</td></tr>`;
  }).join('');
  return `<div style="margin-bottom:24px"><h1 style="font-size:1.4rem;font-weight:700">Build Logs</h1></div><div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0"><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Version</th><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Status</th><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Time</th><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Duration</th><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Message</th></tr></thead><tbody>${rows||'<tr><td colspan="5" style="padding:32px;text-align:center;color:#aaa">No build logs</td></tr>'}</tbody></table></div>`;
}
