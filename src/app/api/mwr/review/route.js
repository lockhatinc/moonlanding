import { getDomainLoader } from '@/lib/domain-loader';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { createCrudHandlers } from '@/lib/crud-factory';
import { list } from '@/lib/query-engine';
import { requireAuth, requirePermission } from '@/lib/auth-middleware';
import { ok } from '@/lib/response-formatter';
import { withErrorHandler } from '@/lib/with-error-handler';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

export const GET = withErrorHandler(async (request) => {
  const user = await requireAuth();
  const domainLoader = getDomainLoader();
  const configEngine = await getConfigEngine();
  const domain = 'mwr';
  const entity = 'review';

  if (!domainLoader.isEntityInDomain(entity, domain)) {
    throw new AppError(
      `Entity ${entity} not available in MWR domain`,
      'FORBIDDEN',
      HTTP.FORBIDDEN
    );
  }

  const spec = configEngine.generateEntitySpec(entity);
  requirePermission(user, spec, 'list');

  const data = list(entity);

  const filtered = domainLoader.filterDataByDomain(data, domain, entity);

  const priorityReviews = Array.isArray(user.priority_reviews)
    ? user.priority_reviews
    : (typeof user.priority_reviews === 'string'
        ? JSON.parse(user.priority_reviews)
        : []);

  const sorted = filtered.sort((a, b) => {
    const aPriority = priorityReviews.includes(a.id);
    const bPriority = priorityReviews.includes(b.id);

    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    if (a.deadline && b.deadline) {
      const deadlineDiff = a.deadline - b.deadline;
      if (deadlineDiff !== 0) return deadlineDiff;
    } else if (a.deadline && !b.deadline) {
      return -1;
    } else if (!a.deadline && b.deadline) {
      return 1;
    }

    const aDate = a.updated_at || a.created_at || 0;
    const bDate = b.updated_at || b.created_at || 0;
    return bDate - aDate;
  });

  return ok({
    entity,
    domain,
    items: sorted,
    count: sorted.length,
    priority_reviews: priorityReviews
  });
}, 'MWR:Review:List');

async function handleMutation(request, method) {
  const domain = 'mwr';
  const entity = 'review';

  const handler = createCrudHandlers(entity);
  const modifiedRequest = new Request(request.url + `?domain=${domain}`, {
    method,
    headers: request.headers,
    body: await request.text()
  });

  return handler(modifiedRequest, {
    params: {
      entity,
      id: null,
      childKey: null
    }
  });
}

export const POST = withErrorHandler(async (request) => {
  return handleMutation(request, 'POST');
}, 'MWR:Review:Create');

export const PATCH = withErrorHandler(async (request) => {
  return handleMutation(request, 'PATCH');
}, 'MWR:Review:Update');

export const PUT = withErrorHandler(async (request) => {
  return handleMutation(request, 'PUT');
}, 'MWR:Review:Replace');

export const DELETE = withErrorHandler(async (request) => {
  return handleMutation(request, 'DELETE');
}, 'MWR:Review:Delete');
