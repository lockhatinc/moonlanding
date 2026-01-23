import { getUser, setCurrentRequest } from '@/engine.server.js';
import { getSpec } from '@/config/spec-helpers.js';
import { list, get, count } from '@/lib/query-engine.js';
import {
  renderLogin,
  renderDashboard,
  renderEntityList,
  renderEntityDetail,
  renderEntityForm,
  renderSettings,
  renderAuditDashboard,
  renderSystemHealth,
  REDIRECT
} from './renderer.js';

function resolveRefFields(items, spec) {
  try {
    const refFields = Object.entries(spec.fields || {}).filter(([k, f]) => f.type === 'ref' && f.ref);
    if (!refFields.length) return items;

    const refCaches = {};
    for (const [fieldKey, field] of refFields) {
      const refIds = [...new Set(items.map(item => item[fieldKey]).filter(Boolean))];
      if (refIds.length) {
        try {
          const refItems = list(field.ref, {});
          refCaches[fieldKey] = Object.fromEntries(refItems.map(r => [r.id, r.name || r.title || r.label || r.id]));
        } catch (e) {
          console.error(`[resolveRefFields] Failed to load ${field.ref}:`, e.message);
        }
      }
    }

    return items.map(item => {
      const resolved = { ...item };
      for (const [fieldKey] of refFields) {
        if (item[fieldKey] && refCaches[fieldKey]) {
          resolved[`${fieldKey}_display`] = refCaches[fieldKey][item[fieldKey]] || item[fieldKey];
        }
      }
      return resolved;
    });
  } catch (e) {
    console.error('[resolveRefFields] Error:', e.message);
    return items;
  }
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
    return renderLogin();
  }

  const user = await getUser();
  if (!user) {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return REDIRECT;
  }

  if (normalized === '/' || normalized === '/dashboard') {
    const stats = await getDashboardStats(user);
    return renderDashboard(user, stats);
  }

  if (normalized === '/admin/settings') {
    if (user.role !== 'partner') {
      res.writeHead(302, { Location: '/' });
      res.end();
      return REDIRECT;
    }
    const config = await getSystemConfig();
    return renderSettings(user, config);
  }

  if (normalized === '/admin/audit') {
    if (user.role !== 'partner' && user.role !== 'manager') {
      res.writeHead(302, { Location: '/' });
      res.end();
      return REDIRECT;
    }
    const auditData = await getAuditData();
    return renderAuditDashboard(user, auditData);
  }

  if (normalized === '/admin/health') {
    if (user.role !== 'partner') {
      res.writeHead(302, { Location: '/' });
      res.end();
      return REDIRECT;
    }
    const healthData = await getSystemHealth();
    return renderSystemHealth(user, healthData);
  }

  if (segments.length === 1) {
    const entityName = segments[0];
    const spec = getSpec(entityName);
    if (!spec) return null;

    const items = list(entityName, {});
    const resolvedItems = resolveRefFields(items, spec);
    return renderEntityList(entityName, resolvedItems, spec, user);
  }

  if (segments.length === 2) {
    const [entityName, idOrAction] = segments;
    const spec = getSpec(entityName);
    if (!spec) return null;

    if (idOrAction === 'new') {
      return renderEntityForm(entityName, null, spec, user, true);
    }

    const item = get(entityName, idOrAction);
    if (!item) return null;

    const [resolvedItem] = resolveRefFields([item], spec);
    return renderEntityDetail(entityName, resolvedItem, spec, user);
  }

  if (segments.length === 3 && segments[2] === 'edit') {
    const [entityName, id] = segments;
    const spec = getSpec(entityName);
    if (!spec) return null;

    const item = get(entityName, id);
    if (!item) return null;

    return renderEntityForm(entityName, item, spec, user, false);
  }

  return null;
}

async function getDashboardStats(user) {
  try {
    const engagements = list('engagement', {});
    const clients = list('client', {});
    const rfis = list('rfi', {});
    const reviews = list('review', {});

    const myRfis = user ? rfis.filter(r => r.assigned_to === user.id) : [];
    const now = Math.floor(Date.now() / 1000);
    const overdueRfis = rfis.filter(r => {
      if (r.status === 'closed') return false;
      if (!r.due_date) return false;
      return r.due_date < now;
    }).map(r => ({
      ...r,
      daysOverdue: Math.floor((now - r.due_date) / 86400)
    }));

    return {
      engagements: engagements.length,
      clients: clients.length,
      rfis: rfis.length,
      reviews: reviews.length,
      myRfis,
      overdueRfis
    };
  } catch (e) {
    console.error('[Dashboard Stats]', e.message);
    return { engagements: 0, clients: 0, rfis: 0, reviews: 0, myRfis: [], overdueRfis: [] };
  }
}

async function getSystemConfig() {
  try {
    const { getConfigEngineSync } = await import('@/lib/config-generator-engine.js');
    const engine = getConfigEngineSync();
    const config = engine.getConfig();
    return {
      database: config.system?.database || {},
      server: config.system?.server || {},
      thresholds: config.thresholds || {}
    };
  } catch (e) {
    console.error('[getSystemConfig]', e.message);
    return {};
  }
}

async function getAuditData() {
  try {
    const audits = list('permission_audit', {});
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const recentAudits = audits.filter(a => (a.timestamp || a.created_at) > thirtyDaysAgo);

    const summary = {
      total_actions: recentAudits.length,
      grants: recentAudits.filter(a => a.action === 'grant').length,
      revokes: recentAudits.filter(a => a.action === 'revoke').length,
      role_changes: recentAudits.filter(a => a.action === 'role_change').length
    };

    return {
      summary,
      recentActivity: audits.slice(0, 50)
    };
  } catch (e) {
    console.error('[getAuditData]', e.message);
    return { summary: {}, recentActivity: [] };
  }
}

async function getSystemHealth() {
  try {
    const entityCounts = {};
    const entities = ['user', 'client', 'engagement', 'rfi', 'review', 'team'];
    for (const e of entities) {
      try {
        entityCounts[e] = count(e);
      } catch (err) {
        entityCounts[e] = 0;
      }
    }

    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
      database: { status: 'Connected', type: 'SQLite' },
      server: { port: 3004, uptime: `${hours}h ${minutes}m` },
      entities: entityCounts
    };
  } catch (e) {
    console.error('[getSystemHealth]', e.message);
    return {};
  }
}
