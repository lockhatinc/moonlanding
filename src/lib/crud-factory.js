import { getSpec } from '@/config/spec-helpers';
import { requireAuth } from '@/lib/auth-middleware';
import { AppError, NotFoundError as NotFoundErrorClass } from '@/lib/errors';
import { HTTP } from '@/config/constants';
import { parse as parseQuery } from '@/lib/query-string-adapter';
import { withErrorHandler } from '@/lib/with-error-handler';
import { getDomainLoader } from '@/lib/domain-loader';
import { buildHandlers } from '@/lib/crud-handlers';

export const createCrudHandlers = (entityName) => {
  if (!entityName || typeof entityName !== 'string') {
    throw new Error(`[crud-factory] Invalid entityName: ${entityName} (type: ${typeof entityName})`);
  }
  const spec = getSpec(entityName);

  return withErrorHandler(async (request, context) => {
    if (!spec) throw new NotFoundErrorClass(`Entity "${entityName}" not found`);

    const user = await requireAuth();
    const params = context?.params || {};
    const { id, childKey } = params;
    const { action } = await parseQuery(request);
    const method = request.method;

    const domainLoader = getDomainLoader();
    const domain = domainLoader.getCurrentDomain(request);
    if (!domainLoader.isEntityInDomain(entityName, domain)) {
      throw new AppError(`Entity ${entityName} not available in domain ${domain}`, 'FORBIDDEN', HTTP.FORBIDDEN);
    }

    const handlers = buildHandlers(entityName, spec);

    if (method === 'GET') {
      if (id && childKey) return await handlers.getChildren(user, id, childKey);
      if (id || action === 'view') return await handlers.get(user, id || context.params?.id);
      if (context.params?.parentId && context.params?.parentEntity) {
        const url = new URL(request.url);
        url.searchParams.set(`${context.params.parentEntity}_id`, context.params.parentId);
        return await handlers.list(user, new Request(url, { method: request.method, headers: request.headers }));
      }
      return await handlers.list(user, request);
    }

    if (method === 'POST') {
      const data = await request.json();
      if (action && id) return await handlers.customAction(user, action, id, data);
      if (context.params?.parentId && context.params?.parentEntity) {
        data[`${context.params.parentEntity}_id`] = context.params.parentId;
      }
      return await handlers.create(user, data);
    }

    if (method === 'PUT' || method === 'PATCH') {
      if (action && id) return await handlers.customAction(user, action, id, await request.json());
      return await handlers.update(user, id, await request.json());
    }

    if (method === 'DELETE') return await handlers.delete(user, id);

    throw new AppError(`Unknown action`, 'BAD_REQUEST', HTTP.BAD_REQUEST);
  }, `CRUD:${entityName}`);
};
