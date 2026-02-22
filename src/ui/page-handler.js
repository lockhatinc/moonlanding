import { getUser, setCurrentRequest } from '@/engine.server.js';
import { hasGoogleAuth } from '@/config/env.js';
import { getSpec } from '@/config/spec-helpers.js';
import { list, get, count } from '@/lib/query-engine.js';
import { getDatabase } from '@/lib/database-core.js';
import { getConfigEngineSync } from '@/lib/config-generator-engine.js';
import {
  renderLogin,
  renderDashboard,
  renderEntityList,
  renderEntityDetail,
  renderEntityForm,
  renderSettings,
  renderAuditDashboard,
  renderSystemHealth,
  renderAccessDenied,
  renderPasswordReset,
  renderPasswordResetConfirm,
  generateHtml,
  REDIRECT
} from '@/ui/renderer.js';
import {
  renderSettingsHome,
  renderSettingsSystem,
  renderSettingsUsers,
  renderSettingsTeams,
  renderSettingsRfiSections,
} from '@/ui/settings-renderer.js';
import {
  renderSettingsTemplates,
  renderSettingsNotifications,
  renderSettingsIntegrations,
  renderSettingsChecklists,
  renderSettingsRecreation,
  renderSettingsReviewSettings,
  renderSettingsFileReview,
  renderSettingsTemplateManage,
} from '@/ui/settings-renderer-advanced.js';
import {
  renderClientDashboard, renderClientList, clientUserManagementDialog, clientUserReplaceDialog,
  clientTestEmailDialog, clientRiskAssessmentDialog, clientInfoCard
} from '@/ui/client-renderer.js';
import { renderSectionReport, renderReviewListTabbed, renderMwrHome } from '@/ui/review-renderer.js';
import {
  renderChecklistDetails, renderChecklistsHome, renderChecklistsManagement,
  checklistTemplatesUI
} from '@/ui/checklist-renderer.js';
import {
  canList, canView, canCreate, canEdit,
  isPartner, isManager, isClerk, isClientUser, isAuditor, canClientAccessEntity
} from '@/ui/permissions-ui.js';
import { renderEngagementGrid } from '@/ui/engagement-grid-renderer.js';
import { renderRfiList } from '@/ui/rfi-list-renderer.js';
import { renderPdfViewer, renderPdfEditorPlaceholder } from '@/ui/pdf-viewer-renderer.js';
import { renderReviewAnalytics } from '@/ui/review-analytics-renderer.js';
import { renderHighlightThreading } from '@/ui/highlight-threading-renderer.js';
import { renderClientProgress } from '@/ui/client-progress-renderer.js';
import { renderLetterWorkflow } from '@/ui/letter-workflow-renderer.js';
import { renderJobManagement } from '@/ui/job-management-renderer.js';
import { renderAdvancedSearch } from '@/ui/advanced-search-renderer.js';
import { renderSectionResolution } from '@/ui/section-resolution-renderer.js';
import { renderReviewComparison, renderComparisonPicker } from '@/ui/review-comparison-renderer.js';
import { renderTenderDashboard } from '@/ui/tender-dashboard-renderer.js';
import { renderBatchOperations } from '@/ui/batch-review-renderer.js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
const __dirname_ph = fileURLToPath(new URL('.', import.meta.url));

async function lazyRenderer(name) {
  const t = globalThis.__reloadTs__ || Date.now();
  return import(`file://${__dirname_ph}${name}?t=${t}`);
}


function page_wrap(user, title, bc, content) {
  return renderDashboard.__page_wrap
    ? renderDashboard.__page_wrap(user, title, bc, content)
    : generateHtml(title, content, []);
}

function renderBuildLogsContent(logs) {
  const rows = (logs || []).map(l => {
    const sts = l.status === 'success' ? '<span style="color:#22c55e">Success</span>' : l.status === 'failed' ? '<span style="color:#ef4444">Failed</span>' : `<span style="color:#f59e0b">${l.status || 'pending'}</span>`;
    const ts = l.created_at ? new Date(l.created_at * 1000).toLocaleString() : '-';
    return `<tr><td style="padding:8px 12px">${l.version||'-'}</td><td style="padding:8px 12px">${sts}</td><td style="padding:8px 12px;font-size:0.78rem;color:#888">${ts}</td><td style="padding:8px 12px">${l.duration?l.duration+'s':'-'}</td><td style="padding:8px 12px;font-size:0.78rem">${l.message||'-'}</td></tr>`;
  }).join('');
  return `<div style="margin-bottom:24px"><h1 style="font-size:1.4rem;font-weight:700">Build Logs</h1></div><div style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#fafafa;border-bottom:2px solid #e0e0e0"><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Version</th><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Status</th><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Time</th><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Duration</th><th style="padding:10px 12px;text-align:left;font-size:0.78rem;color:#444">Message</th></tr></thead><tbody>${rows||'<tr><td colspan="5" style="padding:32px;text-align:center;color:#aaa">No build logs</td></tr>'}</tbody></table></div>`;
}

function resolveEnumOptions(spec) {
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

function getRefOptions(spec) {
  const refOptions = {};
  for (const [fieldKey, field] of Object.entries(spec.fields || {}).filter(([k, f]) => f.type === 'ref' && f.ref)) {
    try { refOptions[fieldKey] = list(field.ref, {}).map(r => ({ value: r.id, label: r.name || r.title || r.label || r.email || r.id })); }
    catch { refOptions[fieldKey] = []; }
  }
  return refOptions;
}

function resolveRefFields(items, spec) {
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

async function getDashboardStats(user) {
  try {
    const engagements = list('engagement', {});
    const clients = list('client', {});
    const rfis = list('rfi', {});
    const reviews = list('review', {});
    const myRfis = user ? rfis.filter(r => r.assigned_to === user.id) : [];
    const now = Math.floor(Date.now() / 1000);
    const overdueRfis = rfis.filter(r => r.status !== 'closed' && r.due_date && r.due_date < now).map(r => ({ ...r, daysOverdue: Math.floor((now - r.due_date) / 86400) }));
    const recentEngagements = [...engagements].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0)).slice(0, 8);
    return { engagements: engagements.length, clients: clients.length, rfis: rfis.length, reviews: reviews.length, myRfis, overdueRfis, recentEngagements };
  } catch { return { engagements: 0, clients: 0, rfis: 0, reviews: 0, myRfis: [], overdueRfis: [], recentEngagements: [] }; }
}

async function getSettingsCounts() {
  const counts = {};
  const entities = { users: 'user', teams: 'team', rfiSections: 'rfi_section', templates: 'review_template', checklists: 'checklist', recreation: 'permission_audit' };
  for (const [key, entity] of Object.entries(entities)) { try { counts[key] = count(entity); } catch { counts[key] = 0; } }
  return counts;
}

async function getSystemConfig() {
  try {
    const { getConfigEngineSync: gce } = await import('@/lib/config-generator-engine.js');
    const engine = gce();
    const config = engine.getConfig();
    return { database: config.system?.database || {}, server: config.system?.server || {}, thresholds: config.thresholds || {} };
  } catch { return {}; }
}

async function getAuditData() {
  try {
    const audits = list('permission_audit', {});
    const cutoff = Math.floor(Date.now() / 1000) - 30 * 86400;
    const recent = audits.filter(a => (a.timestamp || a.created_at) > cutoff);
    return { summary: { total_actions: recent.length, grants: recent.filter(a => a.action === 'grant').length, revokes: recent.filter(a => a.action === 'revoke').length, role_changes: recent.filter(a => a.action === 'role_change').length }, recentActivity: audits.slice(0, 50) };
  } catch { return { summary: {}, recentActivity: [] }; }
}

function getClientDashboardStats(clientId) {
  try {
    const engagements = list('engagement', {}).filter(e => e.client_id === clientId);
    const rfis = list('rfi', {}).filter(r => engagements.some(e => e.id === r.engagement_id));
    const reviews = list('review', {}).filter(r => engagements.some(e => e.id === r.engagement_id));
    const users = list('user', {}).filter(u => u.client_id === clientId);
    return { engagements: engagements.length, activeRfis: rfis.filter(r => r.status !== 'closed' && r.status !== 'completed').length, users: users.length, reviews: reviews.length, engagementList: engagements.slice(0, 10) };
  } catch { return { engagements: 0, activeRfis: 0, users: 0, reviews: 0, engagementList: [] }; }
}

async function getSystemHealth() {
  try {
    const entityCounts = {};
    for (const e of ['user','client','engagement','rfi','review','team']) { try { entityCounts[e] = count(e); } catch { entityCounts[e] = 0; } }
    const u = process.uptime();
    return { database: { status: 'Connected', type: 'SQLite' }, server: { port: 3004, uptime: `${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m` }, entities: entityCounts };
  } catch { return {}; }
}


export async function handlePage(pathname, req, res) {
  setCurrentRequest(req);

  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const segments = normalized.split('/').filter(Boolean);

  if (normalized === '/login') {
    const user = await getUser();
    if (user) {
      res.writeHead(302, { Location: '/' });
      res.end();
      return REDIRECT;
    }
    return renderLogin(null, hasGoogleAuth());
  }

  if (normalized === '/password-reset') {
    return renderPasswordReset();
  }

  if (normalized === '/password-reset/confirm') {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token') || '';
    return renderPasswordResetConfirm(token);
  }

  const user = await getUser();
  if (!user) {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return REDIRECT;
  }

  if (normalized === '/unauthorized') {
    return renderAccessDenied(user, 'system', 'access');
  }

  if (normalized === '/' || normalized === '/dashboard') {
    const stats = await getDashboardStats(user);
    return renderDashboard(user, stats);
  }

  // F-GUARD-02/M-GUARD-02: All /admin/* routes require partner (or manager for audit)
  if (normalized.startsWith('/admin/')) {
    if (normalized === '/admin/audit') {
      if (!isPartner(user) && !isManager(user)) {
        return renderAccessDenied(user, 'admin', 'view');
      }
      const auditData = await getAuditData();
      return renderAuditDashboard(user, auditData);
    }
    // F-GUARD-05/M-GUARD-02: Partner-only admin pages (settings, health, user mgmt, team mgmt)
    if (!isPartner(user)) {
      return renderAccessDenied(user, 'admin', 'view');
    }
    if (normalized === '/admin/settings') {
      const config = await getSystemConfig();
      const counts = await getSettingsCounts();
      return renderSettingsHome(user, config, counts);
    }
    if (normalized === '/admin/settings/system') {
      const config = await getSystemConfig();
      return renderSettingsSystem(user, config);
    }
    if (normalized === '/admin/settings/users') {
      const users = list('user', {});
      return renderSettingsUsers(user, users);
    }
    if (normalized === '/admin/settings/teams') {
      const teams = list('team', {});
      return renderSettingsTeams(user, teams);
    }
    if (normalized === '/admin/settings/rfi-sections') {
      let sections = [];
      try { sections = list('rfi_section', {}); } catch {}
      return renderSettingsRfiSections(user, sections);
    }
    if (normalized === '/admin/settings/templates') {
      let templates = [];
      try { templates = list('review_template', {}); } catch {}
      return renderSettingsTemplates(user, templates);
    }
    if (normalized === '/admin/settings/notifications') {
      const config = await getSystemConfig();
      return renderSettingsNotifications(user, config);
    }
    if (normalized === '/admin/settings/integrations') {
      return renderSettingsIntegrations(user, {});
    }
    if (normalized === '/admin/settings/checklists') {
      let checklists = [];
      try { checklists = list('checklist', {}); } catch {}
      return renderSettingsChecklists(user, checklists);
    }
    if (normalized === '/admin/settings/recreation') {
      let logs = [];
      let users = [];
      try {
        logs = list('permission_audit', {});
        users = list('user', {});
      } catch {}
      return renderSettingsRecreation(user, logs, users);
    }
    if (normalized === '/admin/settings/review') {
      const config = await getSystemConfig();
      return renderSettingsReviewSettings(user, config);
    }
    if (normalized === '/admin/settings/file-review') {
      const config = await getSystemConfig();
      return renderSettingsFileReview(user, config);
    }
    if (normalized.startsWith('/admin/settings/templates/') && segments.length === 4) {
      const templateId = segments[3];
      let template = {};
      let sections = [];
      try {
        template = get('review_template', templateId) || {};
        sections = list('review_template_section', {}).filter(s => s.review_template_id === templateId);
      } catch {}
      return renderSettingsTemplateManage(user, template, sections);
    }
    // M-CHECK-11: Checklists management page
    if (normalized === '/admin/settings/checklists/manage') {
      let checklists = [];
      try {
        checklists = list('checklist', {}).map(c => {
          let items = [];
          try { items = list('checklist_item', {}).filter(i => i.checklist_id === c.id); } catch {}
          return { ...c, total_items: items.length };
        });
      } catch {}
      return renderChecklistsManagement(user, checklists);
    }
    // F-BUILD-01: Build/deployment logs page
    if (normalized === '/admin/build-logs') {
      let logs = [];
      try { logs = list('build_log', {}); } catch {}
      const content = renderBuildLogsContent(logs);
      return page_wrap(user, 'Build Logs', [{ href: '/', label: 'Dashboard' }, { label: 'Build Logs' }], content);
    }
    if (normalized === '/admin/health') {
      const healthData = await getSystemHealth();
      return renderSystemHealth(user, healthData);
    }
    // User detail/edit/new routes under admin/settings
    if (normalized === '/admin/settings/users/new') {
      const teams = list('team', {});
      const { renderSettingsUserDetail } = await lazyRenderer('settings-user-team-renderer.js');
      return renderSettingsUserDetail(user, {}, teams);
    }
    if (segments.length === 4 && segments[2] === 'users' && segments[3] !== 'new') {
      const userId = segments[3];
      const teams = list('team', {});
      const targetUser = get('user', userId) || {};
      const { renderSettingsUserDetail: _renderUserDetail } = await lazyRenderer('settings-user-team-renderer.js');
      return _renderUserDetail(user, targetUser, teams);
    }
    // Team detail/edit/new routes under admin/settings
    if (normalized === '/admin/settings/teams/new') {
      const allUsers = list('user', {});
      const { renderSettingsTeamDetail } = await lazyRenderer('settings-user-team-renderer.js');
      return renderSettingsTeamDetail(user, {}, allUsers);
    }
    if (segments.length === 4 && segments[2] === 'teams' && segments[3] !== 'new') {
      const teamId = segments[3];
      const allUsers = list('user', {});
      const team = get('team', teamId) || {};
      const { renderSettingsTeamDetail: _renderTeamDetail } = await lazyRenderer('settings-user-team-renderer.js');
      return _renderTeamDetail(user, team, allUsers);
    }
    return null;
  }

  // F-CLIENT-06: Client dashboard route
  if (segments[0] === 'client' && segments.length === 3 && segments[2] === 'dashboard') {
    const clientId = segments[1];
    if (!canView(user, 'client')) return renderAccessDenied(user, 'client', 'view');
    const client = get('client', clientId);
    if (!client) return null;
    if (isClientUser(user) && user.client_id && user.client_id !== clientId) return renderAccessDenied(user, 'client', 'view');
    const stats = getClientDashboardStats(clientId);
    return renderClientDashboard(user, client, stats);
  }

  // F-CLIENT-07: Client user management route
  if (segments[0] === 'client' && segments.length === 3 && segments[2] === 'users') {
    const clientId = segments[1];
    if (!canView(user, 'client')) return renderAccessDenied(user, 'client', 'view');
    const client = get('client', clientId);
    if (!client) return null;
    if (isClientUser(user) && user.client_id && user.client_id !== clientId) return renderAccessDenied(user, 'client', 'view');
    const stats = getClientDashboardStats(clientId);
    return renderClientDashboard(user, client, stats);
  }

  // F-GUARD-02: Clerks cannot access settings, user management, team management pages
  const clerkBlockedEntities = ['user', 'team'];
  if (isClerk(user) && segments.length >= 1 && clerkBlockedEntities.includes(segments[0])) {
    return renderAccessDenied(user, segments[0], 'list');
  }

  // M-NAV-02: MWR-style URL routes for reviews
  if (normalized === '/reviews/active') {
    return handleFilteredReviewList(user, 'active', 'Active Reviews');
  }
  if (normalized === '/reviews/priority') {
    return handleFilteredReviewList(user, 'priority', 'Priority Reviews');
  }
  if (normalized === '/reviews/history') {
    return handleFilteredReviewList(user, 'history', 'History');
  }
  if (normalized === '/reviews/archive') {
    return handleFilteredReviewList(user, 'archive', 'Archive');
  }
  if (normalized === '/reviews' || normalized === '/review') {
    if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
    let reviews = []; try { reviews = list('review', {}); } catch {}
    return renderReviewListTabbed(user, reviews);
  }

  if (segments[0] === 'review' && segments.length === 3 && segments[2] === 'sections') {
    const reviewId = segments[1];
    if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view');
    const review = get('review', reviewId);
    if (!review) return null;
    let sections = [];
    try { sections = list('review_section', {}).filter(s => s.review_id === reviewId); } catch {}
    return renderSectionReport(user, review, sections);
  }

  // M-CHECK-09: Checklist details page
  if (segments[0] === 'checklist' && segments.length === 2 && segments[1] !== 'new') {
    const checklistId = segments[1];
    if (!canView(user, 'checklist')) return renderAccessDenied(user, 'checklist', 'view');
    const checklist = get('checklist', checklistId);
    if (!checklist) return null;
    let items = [];
    try { items = list('checklist_item', {}).filter(i => i.checklist_id === checklistId); } catch {}
    return renderChecklistDetails(user, checklist, items);
  }

  // M-CHECK-10: Checklists home page
  if (normalized === '/checklists' || normalized === '/checklist') {
    if (!canList(user, 'checklist')) return renderAccessDenied(user, 'checklist', 'list');
    let checklists = [];
    try {
      checklists = list('checklist', {}).map(c => {
        let items = [];
        try { items = list('checklist_item', {}).filter(i => i.checklist_id === c.id); } catch {}
        return {
          ...c,
          total_items: items.length,
          completed_items: items.filter(i => i.completed).length,
        };
      });
    } catch {}
    return renderChecklistsHome(user, checklists);
  }

  if (normalized === '/engagements') {
    if (!canList(user, 'engagement')) return renderAccessDenied(user, 'engagement', 'list');
    let engagements = list('engagement', {});
    const spec = getSpec('engagement');
    if (spec) engagements = resolveRefFields(engagements, spec);
    let teams = []; try { teams = list('team', {}); } catch {}
    const years = [...new Set(engagements.map(e => {
      if (!e.year) return null;
      const m = String(e.year).match(/\b(20\d{2}|19\d{2})\b/);
      return m ? m[1] : null;
    }).filter(Boolean))].sort().reverse();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const filter = url.searchParams.get('filter') || 'all';
    return renderEngagementGrid(user, engagements, { filter, teams, years });
  }

  if (normalized === '/search') {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = url.searchParams.get('q') || '';
    const entityFilter = url.searchParams.get('entity') || '';
    const statusFilter = url.searchParams.get('status') || '';
    let teams = []; try { teams = list('team', {}); } catch {}
    const stages = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'closeout'];
    const results = {};
    const searchEntities = entityFilter ? [entityFilter] : ['engagement', 'client', 'rfi', 'review'];
    for (const eName of searchEntities) {
      try {
        let items = list(eName, {});
        if (q) items = items.filter(item => JSON.stringify(item).toLowerCase().includes(q.toLowerCase()));
        if (statusFilter) items = items.filter(item => item.status === statusFilter);
        const spec = getSpec(eName);
        if (spec) items = resolveRefFields(items, spec);
        results[eName] = items.slice(0, 50);
      } catch {}
    }
    return renderAdvancedSearch(user, results, { teams, stages });
  }

  if (normalized === '/reviews/analytics') {
    if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
    let reviews = []; try { reviews = list('review', {}); } catch {}
    let highlights = []; try { highlights = list('highlight', {}); } catch {}
    let activity = []; try { activity = list('activity_log', {}).slice(0, 50); } catch {}
    return renderReviewAnalytics(user, { reviews, highlights, recentActivity: activity });
  }

  if (normalized === '/reviews/compare') {
    if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const leftId = url.searchParams.get('left');
    const rightId = url.searchParams.get('right');
    if (leftId && rightId) {
      const leftReview = get('review', leftId);
      const rightReview = get('review', rightId);
      if (!leftReview || !rightReview) return null;
      let leftH = []; try { leftH = list('highlight', {}).filter(h => h.review_id === leftId); } catch {}
      let rightH = []; try { rightH = list('highlight', {}).filter(h => h.review_id === rightId); } catch {}
      return renderReviewComparison(user, leftReview, rightReview, leftH, rightH);
    }
    let reviews = []; try { reviews = list('review', {}); } catch {}
    return renderComparisonPicker(user, reviews);
  }

  if (normalized === '/reviews/tenders') {
    if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
    let tenders = []; try { tenders = list('tender', {}); } catch {}
    let reviews = []; try { reviews = list('review', {}); } catch {}
    tenders = tenders.map(t => {
      const r = reviews.find(rev => rev.id === t.review_id);
      return { ...t, review_name: r?.name || r?.title || '' };
    });
    return renderTenderDashboard(user, tenders, reviews);
  }

  if (normalized === '/reviews/batch') {
    if (!canEdit(user, 'review')) return renderAccessDenied(user, 'review', 'edit');
    let reviews = []; try { reviews = list('review', {}); } catch {}
    const spec = getSpec('review');
    if (spec) reviews = resolveRefFields(reviews, spec);
    return renderBatchOperations(user, reviews);
  }

  if (segments[0] === 'review' && segments.length === 3 && segments[2] === 'pdf') {
    const reviewId = segments[1];
    if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view');
    const review = get('review', reviewId);
    if (!review) return null;
    let highlights = []; try { highlights = list('highlight', {}).filter(h => h.review_id === reviewId); } catch {}
    let sections = []; try { sections = list('review_section', {}).filter(s => s.review_id === reviewId); } catch {}
    return renderPdfViewer(user, review, highlights, sections);
  }

  if (segments[0] === 'review' && segments.length === 3 && segments[2] === 'editor') {
    const reviewId = segments[1];
    if (!canEdit(user, 'review')) return renderAccessDenied(user, 'review', 'edit');
    const review = get('review', reviewId);
    if (!review) return null;
    return renderPdfEditorPlaceholder(user, review);
  }

  if (segments[0] === 'review' && segments.length === 3 && segments[2] === 'highlights') {
    const reviewId = segments[1];
    if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view');
    const review = get('review', reviewId);
    if (!review) return null;
    let highlights = []; try { highlights = list('highlight', {}).filter(h => h.review_id === reviewId); } catch {}
    const responseMap = {};
    for (const h of highlights) {
      try { responseMap[h.id] = list('highlight_response', {}).filter(r => r.highlight_id === h.id); } catch { responseMap[h.id] = []; }
    }
    return renderHighlightThreading(user, review, highlights, responseMap);
  }

  if (segments[0] === 'review' && segments.length === 3 && segments[2] === 'resolution') {
    const reviewId = segments[1];
    if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view');
    const review = get('review', reviewId);
    if (!review) return null;
    let sections = []; try { sections = list('review_section', {}).filter(s => s.review_id === reviewId); } catch {}
    const highlightsBySection = {};
    for (const s of sections) {
      try { highlightsBySection[s.id] = list('highlight', {}).filter(h => h.review_id === reviewId && h.section_id === s.id); } catch { highlightsBySection[s.id] = []; }
    }
    return renderSectionResolution(user, review, sections, highlightsBySection);
  }

  if (segments[0] === 'client' && segments.length === 3 && segments[2] === 'progress') {
    const clientId = segments[1];
    if (!canView(user, 'client')) return renderAccessDenied(user, 'client', 'view');
    const client = get('client', clientId);
    if (!client) return null;
    let engagements = []; try { engagements = list('engagement', {}).filter(e => e.client_id === clientId); } catch {}
    const spec = getSpec('engagement');
    if (spec) engagements = resolveRefFields(engagements, spec);
    const rfis = []; let rfiStats = { total: 0, responded: 0, overdue: 0 };
    try {
      const allRfis = list('rfi', {}).filter(r => engagements.some(e => e.id === r.engagement_id));
      const now = Math.floor(Date.now() / 1000);
      rfiStats = {
        total: allRfis.length,
        responded: allRfis.filter(r => r.status === 'responded' || r.status === 'completed').length,
        overdue: allRfis.filter(r => r.due_date && r.due_date < now && r.status !== 'closed').length,
      };
    } catch {}
    return renderClientProgress(user, client, engagements, rfiStats);
  }

  if (segments[0] === 'engagement' && segments.length === 3 && segments[2] === 'letter') {
    const engagementId = segments[1];
    if (!canView(user, 'engagement')) return renderAccessDenied(user, 'engagement', 'view');
    const engagement = get('engagement', engagementId);
    if (!engagement) return null;
    return renderLetterWorkflow(user, engagement);
  }

  if (normalized === '/admin/jobs') {
    if (!isPartner(user)) return renderAccessDenied(user, 'admin', 'view');
    let jobs = [];
    try {
      const { getConfigEngineSync } = await import('@/lib/config-generator-engine.js');
      const engine = getConfigEngineSync();
      const config = engine.getConfig();
      jobs = (config.jobs || []).map(j => ({ ...j, status: j.enabled === false ? 'disabled' : 'scheduled' }));
    } catch {}
    let logs = []; try { logs = list('job_log', {}).slice(0, 20); } catch {}
    return renderJobManagement(user, jobs, logs);
  }

  // RFI detail page with questions management
  if (segments.length === 2 && segments[0] === 'rfi' && segments[1] !== 'new') {
    const rfiId = segments[1];
    if (!canView(user, 'rfi')) return renderAccessDenied(user, 'rfi', 'view');
    const db = getDatabase();
    const rfi = db.prepare('SELECT * FROM rfis WHERE id=?').get(rfiId) || get('rfi', rfiId);
    if (!rfi) return null;
    let questions = []; try { questions = db.prepare('SELECT * FROM rfi_questions WHERE rfi_id=?').all(rfiId); } catch { try { questions = list('rfi_question', {}).filter(q => q.rfi_id === rfiId); } catch {} }
    let sections = []; try { sections = list('rfi_section', {}).filter(s => s.rfi_id === rfiId || s.engagement_id === rfi.engagement_id); } catch {}
    let engagement = null; try { if (rfi.engagement_id) engagement = get('engagement', rfi.engagement_id); } catch {}
    const { renderRfiDetail } = await lazyRenderer('rfi-detail-renderer.js');
    return renderRfiDetail(user, rfi, questions, sections, engagement);
  }

  // F-RFI-LIST: Friday-style RFI list
  if (segments.length === 1 && segments[0] === 'rfi') {
    if (!canList(user, 'rfi')) return renderAccessDenied(user, 'rfi', 'list');
    let rfis = []; try { const db = getDatabase(); rfis = db.prepare('SELECT * FROM rfis ORDER BY created_at ASC').all(); } catch {}
    let engagements = []; try { engagements = list('engagement', {}); } catch {}
    if (isClerk(user)) rfis = rfis.filter(r => engagements.filter(e => e.assigned_to === user.id || e.team_id === user.team_id).some(e => e.id === r.engagement_id));
    rfis = rfis.map((r, i) => ({ ...r, display_name: 'RFI #' + (i + 1) }));
    return renderRfiList(user, rfis, engagements);
  }

  // F-CLIENT-LIST: Friday-style client list
  if (segments.length === 1 && segments[0] === 'client') {
    if (!canList(user, 'client')) return renderAccessDenied(user, 'client', 'list');
    let clients = list('client', {});
    if (isClientUser(user) && user.client_id) clients = clients.filter(c => c.id === user.client_id);
    return renderClientList(user, clients);
  }

  if (segments.length === 1) {
    const entityName = segments[0];
    const spec = getSpec(entityName);
    if (!spec) return null;

    // F-NAV-03: Client users can only see client-relevant entities
    if (isClientUser(user) && !canClientAccessEntity(user, entityName)) {
      return renderAccessDenied(user, entityName, 'list');
    }

    if (!canList(user, entityName)) {
      return renderAccessDenied(user, entityName, 'list');
    }

    let items = list(entityName, {});

    // F-NAV-03: Filter client user data to their client only
    if (isClientUser(user) && user.client_id) {
      items = items.filter(item => {
        if (item.client_id) return item.client_id === user.client_id;
        if (item.assigned_to) return item.assigned_to === user.id;
        return true;
      });
    }

    const resolvedItems = resolveRefFields(items, spec);
    return renderEntityList(entityName, resolvedItems, spec, user);
  }

  // F-CLIENT-DETAIL: Custom client detail page
  if (segments.length === 2 && segments[0] === 'client' && segments[1] !== 'new') {
    const clientId = segments[1];
    if (!canView(user, 'client')) return renderAccessDenied(user, 'client', 'view');
    if (isClientUser(user) && user.client_id && user.client_id !== clientId) return renderAccessDenied(user, 'client', 'view');
    const client = get('client', clientId);
    if (!client) return null;
    const stats = getClientDashboardStats(clientId);
    return renderClientDashboard(user, client, stats);
  }

  // Review detail page (tabbed)
  if (segments.length === 2 && segments[0] === 'review' && segments[1] !== 'new') {
    const reviewId = segments[1];
    if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view');
    const review = get('review', reviewId);
    if (!review) return null;
    let highlights = []; try { highlights = list('highlight', {}).filter(h => h.review_id === reviewId); } catch {}
    let collaborators = []; try { collaborators = list('collaborator', {}).filter(c => c.review_id === reviewId); } catch {}
    let checklists = []; try { checklists = list('checklist', {}).filter(c => c.review_id === reviewId).map(c => { let items = []; try { items = list('checklist_item', {}).filter(i => i.checklist_id === c.id); } catch {} return { ...c, total_items: items.length, completed_items: items.filter(i => i.completed).length }; }); } catch {}
    let sections = []; try { sections = list('review_section', {}).filter(s => s.review_id === reviewId); } catch {}
    const { renderReviewDetail } = await lazyRenderer('review-detail-renderer.js');
    return renderReviewDetail(user, review, highlights, collaborators, checklists, sections);
  }

  // F-ENG-DETAIL: Friday-style engagement detail
  if (segments.length === 2 && segments[0] === 'engagement' && segments[1] !== 'new') {
    const engId = segments[1];
    if (!canView(user, 'engagement')) return renderAccessDenied(user, 'engagement', 'view');
    const engagement = get('engagement', engId);
    if (!engagement) return null;
    let client = null; try { client = engagement.client_id ? get('client', engagement.client_id) : null; } catch {}
    let rfis = []; try { const _db = getDatabase(); rfis = _db.prepare('SELECT * FROM rfis WHERE engagement_id=?').all(engId); } catch { try { rfis = list('rfi', {}).filter(r => r.engagement_id === engId); } catch {} }
    let team = null; try { team = engagement.team_id ? get('team', engagement.team_id) : null; } catch {}
    const enrichedEng = { ...engagement, team_name: team?.name || engagement.team_name };
    const { renderEngagementDetail } = await lazyRenderer('engagement-detail-renderer.js');
    return renderEngagementDetail(user, enrichedEng, client, rfis);
  }

  if (segments.length === 2) {
    const [entityName, idOrAction] = segments;
    const spec = getSpec(entityName);
    if (!spec) return null;

    // F-NAV-03: Client entity access check
    if (isClientUser(user) && !canClientAccessEntity(user, entityName)) {
      return renderAccessDenied(user, entityName, 'view');
    }

    if (idOrAction === 'new') {
      if (!canCreate(user, entityName)) {
        return renderAccessDenied(user, entityName, 'create');
      }
      const resolvedSpec = resolveEnumOptions(spec);
      const refOptions = getRefOptions(resolvedSpec);
      return renderEntityForm(entityName, null, resolvedSpec, user, true, refOptions);
    }

    if (!canView(user, entityName)) {
      return renderAccessDenied(user, entityName, 'view');
    }

    const item = get(entityName, idOrAction);
    if (!item) return null;

    // F-GUARD-03: Team-scoped route check - verify user belongs to engagement's team
    if (item.team_id && user.team_id && item.team_id !== user.team_id && !isPartner(user)) {
      return renderAccessDenied(user, entityName, 'view');
    }

    // F-NAV-03: Client users can only view items belonging to their client
    if (isClientUser(user) && user.client_id && item.client_id && item.client_id !== user.client_id) {
      return renderAccessDenied(user, entityName, 'view');
    }

    const [resolvedItem] = resolveRefFields([item], spec);
    return renderEntityDetail(entityName, resolvedItem, spec, user);
  }

  if (segments.length === 3 && segments[2] === 'edit') {
    const [entityName, id] = segments;
    const spec = getSpec(entityName);
    if (!spec) return null;

    if (!canEdit(user, entityName)) {
      return renderAccessDenied(user, entityName, 'edit');
    }

    const item = get(entityName, id);
    if (!item) return null;

    // F-GUARD-03: Team-scoped edit check
    if (item.team_id && user.team_id && item.team_id !== user.team_id && !isPartner(user)) {
      return renderAccessDenied(user, entityName, 'edit');
    }

    const resolvedSpec = resolveEnumOptions(spec);
    const refOptions = getRefOptions(resolvedSpec);
    return renderEntityForm(entityName, item, resolvedSpec, user, false, refOptions);
  }

  return null;
}

function handleFilteredReviewList(user, filter, title) {
  if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
  const spec = getSpec('review');
  if (!spec) return null;
  let items = list('review', {});
  if (filter === 'active') items = items.filter(r => r.status === 'active' || r.status === 'open');
  else if (filter === 'priority') { const pids = user.priority_reviews || []; items = items.filter(r => pids.includes(r.id)); }
  else if (filter === 'history') items = items.filter(r => r.status === 'closed' || r.status === 'completed');
  else if (filter === 'archive') items = items.filter(r => r.status === 'archived');
  return renderEntityList('review', resolveRefFields(items, spec), spec, user);
}
