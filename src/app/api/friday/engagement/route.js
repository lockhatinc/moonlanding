import { getDomainLoader } from '@/lib/domain-loader';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { createCrudHandlers } from '@/lib/crud-factory';
import { listWithPagination } from '@/lib/query-engine';
import { requireAuth, requirePermission } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { ok, paginated } from '@/lib/response-formatter';
import { withErrorHandler } from '@/lib/with-error-handler';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';
import { parse as parseQuery } from '@/lib/query-string-adapter';

export const GET = withErrorHandler(async (request) => {
  setCurrentRequest(request);
  const user = await requireAuth();
  const domainLoader = getDomainLoader();
  const configEngine = await getConfigEngine();
  const domain = 'friday';
  const entity = 'engagement';

  if (!domainLoader.isEntityInDomain(entity, domain)) {
    throw new AppError(
      `Entity ${entity} not available in Friday domain`,
      'FORBIDDEN',
      HTTP.FORBIDDEN
    );
  }

  const spec = configEngine.generateEntitySpec(entity);
  requirePermission(user, spec, 'list');

  // Parse pagination parameters
  const { page = 1, pageSize } = await parseQuery(request);

  // Get paginated data
  const { items, pagination } = await listWithPagination(entity, {}, page, pageSize);

  // Filter by domain
  const filtered = domainLoader.filterDataByDomain(items, domain, entity);

  return paginated(filtered, pagination);
}, 'Friday:Engagement:List');

async function handleMutation(request, method) {
  setCurrentRequest(request);
  const domain = 'friday';
  const entity = 'engagement';

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
}, 'Friday:Engagement:Create');

export const PATCH = withErrorHandler(async (request) => {
  return handleMutation(request, 'PATCH');
}, 'Friday:Engagement:Update');

export const PUT = withErrorHandler(async (request) => {
  return handleMutation(request, 'PUT');
}, 'Friday:Engagement:Replace');

export const DELETE = withErrorHandler(async (request) => {
  return handleMutation(request, 'DELETE');
}, 'Friday:Engagement:Delete');
