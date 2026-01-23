import { getUser, setCurrentRequest } from '@/engine.server.js';
import { getSpec } from '@/config/spec-helpers.js';
import { list, get } from '@/lib/query-engine.js';
import {
  renderLogin,
  renderDashboard,
  renderEntityList,
  renderEntityDetail,
  renderEntityForm,
  REDIRECT
} from './renderer.js';

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
    const stats = await getDashboardStats();
    return renderDashboard(user, stats);
  }

  if (segments.length === 1) {
    const entityName = segments[0];
    const spec = getSpec(entityName);
    if (!spec) return null;

    const items = list(entityName, {});
    return renderEntityList(entityName, items, spec, user);
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

    return renderEntityDetail(entityName, item, spec, user);
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

async function getDashboardStats() {
  try {
    const engagements = list('engagement', {});
    const clients = list('client', {});
    const rfis = list('rfi', {});
    const reviews = list('review', {});

    return {
      engagements: engagements.length,
      clients: clients.length,
      rfis: rfis.length,
      reviews: reviews.length
    };
  } catch (e) {
    console.error('[Dashboard Stats]', e.message);
    return { engagements: 0, clients: 0, rfis: 0, reviews: 0 };
  }
}
