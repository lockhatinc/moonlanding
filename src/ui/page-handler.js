import { getUser, setCurrentRequest } from '@/engine.server.js';
import { hasGoogleAuth } from '@/config/env.js';
import { getSpec } from '@/config/spec-helpers.js';
import { list, get } from '@/lib/query-engine.js';
import { getDatabase } from '@/lib/database-core.js';
import { renderLogin, renderDashboard, renderEntityList, renderEntityDetail, renderEntityForm, renderAccessDenied, renderPasswordReset, renderPasswordResetConfirm, REDIRECT } from '@/ui/renderer.js';
import { renderClientDashboard, renderClientList } from '@/ui/client-renderer.js';
import { canList, canView, canCreate, canEdit, isPartner, isClerk, isClientUser, canClientAccessEntity } from '@/ui/permissions-ui.js';
import { renderEngagementGrid } from '@/ui/engagement-grid-renderer.js';
import { renderRfiList } from '@/ui/rfi-list-renderer.js';
import { renderClientProgress } from '@/ui/client-progress-renderer.js';
import { renderLetterWorkflow } from '@/ui/letter-workflow-renderer.js';
import { renderAdvancedSearch } from '@/ui/advanced-search-renderer.js';
import { getDashboardStats, getClientDashboardStats, resolveRefFields, resolveEnumOptions, getRefOptions } from '@/ui/page-handler-helpers.js';
import { handleAdminPage } from '@/ui/page-handler-admin.js';
import { handleReviewRoutes } from '@/ui/page-handler-reviews.js';
import { fileURLToPath } from 'url';
const __dirname_ph = fileURLToPath(new URL('.', import.meta.url));
async function lazyRenderer(name) {
  const t = globalThis.__reloadTs__ || Date.now();
  return import(`file://${__dirname_ph}${name}?t=${t}`);
}
export async function handlePage(pathname, req, res) {
  setCurrentRequest(req);
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const segments = normalized.split('/').filter(Boolean);

  if (normalized === '/login') {
    const user = await getUser();
    if (user) { res.writeHead(302, { Location: '/' }); res.end(); return REDIRECT; }
    return renderLogin(null, hasGoogleAuth());
  }
  if (normalized === '/password-reset') return renderPasswordReset();
  if (normalized === '/password-reset/confirm') {
    const token = new URL(req.url, `http://${req.headers.host||'localhost'}`).searchParams.get('token') || '';
    return renderPasswordResetConfirm(token);
  }

  const user = await getUser();
  if (!user) { res.writeHead(302, { Location: '/login' }); res.end(); return REDIRECT; }
  if (normalized === '/unauthorized') return renderAccessDenied(user, 'system', 'access');
  if (normalized === '/' || normalized === '/dashboard') return renderDashboard(user, await getDashboardStats(user));
  if (normalized.startsWith('/admin/') || normalized === '/admin/jobs') return handleAdminPage(normalized, segments, user);
  if (segments[0] === 'client' && segments.length === 3 && (segments[2] === 'dashboard' || segments[2] === 'users')) {
    const clientId = segments[1];
    if (!canView(user, 'client')) return renderAccessDenied(user, 'client', 'view');
    const client = get('client', clientId); if (!client) return null;
    if (isClientUser(user) && user.client_id && user.client_id !== clientId) return renderAccessDenied(user, 'client', 'view');
    return renderClientDashboard(user, client, getClientDashboardStats(clientId));
  }

  const clerkBlockedEntities = ['user', 'team'];
  if (isClerk(user) && segments.length >= 1 && clerkBlockedEntities.includes(segments[0])) return renderAccessDenied(user, segments[0], 'list');
  const reviewResult = await handleReviewRoutes(normalized, segments, user, req);
  if (reviewResult !== null) return reviewResult;
  if (normalized === '/engagements') {
    if (!canList(user, 'engagement')) return renderAccessDenied(user, 'engagement', 'list');
    let engagements = list('engagement', {});
    const clientMap = Object.fromEntries(list('client', {}).map(c => [c.id, c.name]));
    engagements = engagements.map(e => ({ ...e, client_name: clientMap[e.client_id] || e.client_name || '-' }));
    const spec = getSpec('engagement'); if (spec) engagements = resolveRefFields(engagements, spec);
    let teams = []; try { teams = list('team', {}); } catch {}
    const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));
    engagements = engagements.map(e => ({ ...e, team_name: teamMap[e.team_id] || e.team_name || '-' }));
    const years = [...new Set(engagements.map(e => { if (!e.year) return null; const m = String(e.year).match(/\b(20\d{2}|19\d{2})\b/); return m ? m[1] : null; }).filter(Boolean))].sort().reverse();
    const filter = new URL(req.url, `http://${req.headers.host||'localhost'}`).searchParams.get('filter') || 'all';
    return renderEngagementGrid(user, engagements, { filter, teams, years });
  }

  if (segments.length === 2 && segments[0] === 'engagements' && segments[1] !== 'new') {
    const engId = segments[1];
    if (!canView(user, 'engagement')) return renderAccessDenied(user, 'engagement', 'view');
    const db = getDatabase();
    const engagement = get('engagement', engId) || db.prepare('SELECT * FROM engagement WHERE id=?').get(engId);
    if (!engagement) return null;
    let client = null; try { client = engagement.client_id ? get('client', engagement.client_id) : null; } catch {}
    let rfis = []; try { rfis = db.prepare('SELECT * FROM rfis WHERE engagement_id=?').all(engId); } catch { try { rfis = list('rfi', {}).filter(r => r.engagement_id === engId); } catch {} }
    let team = null; try { team = engagement.team_id ? get('team', engagement.team_id) : null; } catch {}
    let assignedUsers = [];
    try { const ids = JSON.parse(engagement.users || '[]'); const um = Object.fromEntries(db.prepare('SELECT id, name, email FROM users').all().map(u => [u.id, u.name || u.email])); assignedUsers = ids.map(id => ({ id, name: um[id] || null })).filter(u => u.name); } catch {}
    const { renderEngagementDetail } = await lazyRenderer('engagement-detail-renderer.js');
    return renderEngagementDetail(user, { ...engagement, team_name: team?.name || engagement.team_name, client_name: client?.name || engagement.client_name, assigned_users_resolved: assignedUsers }, client, rfis);
  }

  if (normalized === '/search') {
    const url = new URL(req.url, `http://${req.headers.host||'localhost'}`);
    const q = url.searchParams.get('q') || '', entityFilter = url.searchParams.get('entity') || '', statusFilter = url.searchParams.get('status') || '';
    let teams = []; try { teams = list('team', {}); } catch {}
    const results = {};
    for (const eName of (entityFilter ? [entityFilter] : ['engagement', 'client', 'rfi', 'review'])) {
      try { let items = list(eName, {}); if (q) items = items.filter(i => JSON.stringify(i).toLowerCase().includes(q.toLowerCase())); if (statusFilter) items = items.filter(i => i.status === statusFilter); const spec = getSpec(eName); if (spec) items = resolveRefFields(items, spec); results[eName] = items.slice(0, 50); } catch {}
    }
    return renderAdvancedSearch(user, results, { teams, stages: ['info_gathering','commencement','team_execution','partner_review','finalization','closeout'] });
  }

  if (segments[0] === 'client' && segments.length === 3 && segments[2] === 'progress') {
    const clientId = segments[1];
    if (!canView(user, 'client')) return renderAccessDenied(user, 'client', 'view');
    const client = get('client', clientId); if (!client) return null;
    let engagements = []; try { engagements = list('engagement', {}).filter(e => e.client_id === clientId); } catch {}
    const spec = getSpec('engagement'); if (spec) engagements = resolveRefFields(engagements, spec);
    let rfiStats = { total: 0, responded: 0, overdue: 0 };
    try { const allRfis = list('rfi', {}).filter(r => engagements.some(e => e.id === r.engagement_id)); const now = Math.floor(Date.now() / 1000); rfiStats = { total: allRfis.length, responded: allRfis.filter(r => r.status === 'responded' || r.status === 'completed').length, overdue: allRfis.filter(r => r.due_date && r.due_date < now && r.status !== 'closed').length }; } catch {}
    return renderClientProgress(user, client, engagements, rfiStats);
  }

  if (segments[0] === 'engagement' && segments.length === 3 && segments[2] === 'letter') {
    if (!canView(user, 'engagement')) return renderAccessDenied(user, 'engagement', 'view');
    const engagement = get('engagement', segments[1]); if (!engagement) return null;
    return renderLetterWorkflow(user, engagement);
  }

  if (segments.length === 2 && segments[0] === 'rfi' && segments[1] !== 'new') {
    const rfiId = segments[1];
    if (!canView(user, 'rfi')) return renderAccessDenied(user, 'rfi', 'view');
    const db = getDatabase();
    const rfi = db.prepare('SELECT * FROM rfis WHERE id=?').get(rfiId) || get('rfi', rfiId); if (!rfi) return null;
    let questions = []; try { questions = db.prepare('SELECT * FROM rfi_questions WHERE rfi_id=?').all(rfiId); } catch { try { questions = list('rfi_question', {}).filter(q => q.rfi_id === rfiId); } catch {} }
    let sections = []; try { sections = list('rfi_section', {}).filter(s => s.rfi_id === rfiId || s.engagement_id === rfi.engagement_id); } catch {}
    let engagement = null; try { if (rfi.engagement_id) engagement = get('engagement', rfi.engagement_id); } catch {}
    const { renderRfiDetail } = await lazyRenderer('rfi-detail-renderer.js');
    return renderRfiDetail(user, rfi, questions, sections, engagement);
  }

  if (segments.length === 1 && segments[0] === 'rfi') {
    if (!canList(user, 'rfi')) return renderAccessDenied(user, 'rfi', 'list');
    let rfis = []; try { rfis = getDatabase().prepare('SELECT * FROM rfis ORDER BY created_at ASC').all(); } catch {}
    let engagements = []; try { engagements = list('engagement', {}); } catch {}
    if (isClerk(user)) rfis = rfis.filter(r => engagements.filter(e => e.assigned_to === user.id || e.team_id === user.team_id).some(e => e.id === r.engagement_id));
    return renderRfiList(user, rfis.map((r, i) => ({ ...r, display_name: 'RFI #' + (i + 1) })), engagements);
  }

  if (segments.length === 1 && segments[0] === 'client') {
    if (!canList(user, 'client')) return renderAccessDenied(user, 'client', 'list');
    let clients = list('client', {});
    if (isClientUser(user) && user.client_id) clients = clients.filter(c => c.id === user.client_id);
    return renderClientList(user, clients);
  }

  if (segments.length === 1) {
    const entityName = segments[0];
    const spec = getSpec(entityName); if (!spec) return null;
    if (isClientUser(user) && !canClientAccessEntity(user, entityName)) return renderAccessDenied(user, entityName, 'list');
    if (!canList(user, entityName)) return renderAccessDenied(user, entityName, 'list');
    let items = list(entityName, {});
    if (isClientUser(user) && user.client_id) items = items.filter(item => { if (item.client_id) return item.client_id === user.client_id; if (item.assigned_to) return item.assigned_to === user.id; return true; });
    return renderEntityList(entityName, resolveRefFields(items, spec), spec, user);
  }

  if (segments.length === 2 && segments[0] === 'client' && segments[1] !== 'new') {
    const clientId = segments[1];
    if (!canView(user, 'client')) return renderAccessDenied(user, 'client', 'view');
    if (isClientUser(user) && user.client_id && user.client_id !== clientId) return renderAccessDenied(user, 'client', 'view');
    const client = get('client', clientId); if (!client) return null;
    return renderClientDashboard(user, client, getClientDashboardStats(clientId));
  }

  if (segments.length === 2 && segments[0] === 'engagement' && segments[1] !== 'new') {
    const engId = segments[1];
    if (!canView(user, 'engagement')) return renderAccessDenied(user, 'engagement', 'view');
    const engagement = get('engagement', engId); if (!engagement) return null;
    let client = null; try { client = engagement.client_id ? get('client', engagement.client_id) : null; } catch {}
    let rfis = []; try { rfis = getDatabase().prepare('SELECT * FROM rfis WHERE engagement_id=?').all(engId); } catch { try { rfis = list('rfi', {}).filter(r => r.engagement_id === engId); } catch {} }
    let team = null; try { team = engagement.team_id ? get('team', engagement.team_id) : null; } catch {}
    const { renderEngagementDetail } = await lazyRenderer('engagement-detail-renderer.js');
    return renderEngagementDetail(user, { ...engagement, team_name: team?.name || engagement.team_name }, client, rfis);
  }

  if (segments.length === 2) {
    const [entityName, idOrAction] = segments;
    const spec = getSpec(entityName); if (!spec) return null;
    if (isClientUser(user) && !canClientAccessEntity(user, entityName)) return renderAccessDenied(user, entityName, 'view');
    if (idOrAction === 'new') {
      if (!canCreate(user, entityName)) return renderAccessDenied(user, entityName, 'create');
      const resolvedSpec = resolveEnumOptions(spec);
      return renderEntityForm(entityName, null, resolvedSpec, user, true, getRefOptions(resolvedSpec));
    }
    if (!canView(user, entityName)) return renderAccessDenied(user, entityName, 'view');
    const item = get(entityName, idOrAction); if (!item) return null;
    if (item.team_id && user.team_id && item.team_id !== user.team_id && !isPartner(user)) return renderAccessDenied(user, entityName, 'view');
    if (isClientUser(user) && user.client_id && item.client_id && item.client_id !== user.client_id) return renderAccessDenied(user, entityName, 'view');
    const [resolvedItem] = resolveRefFields([item], spec);
    return renderEntityDetail(entityName, resolvedItem, spec, user);
  }

  if (segments.length === 3 && segments[2] === 'edit') {
    const [entityName, id] = segments;
    const spec = getSpec(entityName); if (!spec) return null;
    if (!canEdit(user, entityName)) return renderAccessDenied(user, entityName, 'edit');
    const item = get(entityName, id); if (!item) return null;
    if (item.team_id && user.team_id && item.team_id !== user.team_id && !isPartner(user)) return renderAccessDenied(user, entityName, 'edit');
    const resolvedSpec = resolveEnumOptions(spec);
    return renderEntityForm(entityName, item, resolvedSpec, user, false, getRefOptions(resolvedSpec));
  }

  return null;
}
