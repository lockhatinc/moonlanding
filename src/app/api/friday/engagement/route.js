import { getDomainLoader } from '@/lib/domain-loader';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { list, get } from '@/lib/query-engine';
import { requireAuth, requirePermission } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { ok } from '@/lib/response-formatter';
import { withErrorHandler } from '@/lib/with-error-handler';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

export const GET = withErrorHandler(async (request) => {
  setCurrentRequest(request);
  const user = await requireAuth();
  const domainLoader = getDomainLoader();
  const configEngine = getConfigEngine();
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

  const data = list(entity);

  const filtered = domainLoader.filterDataByDomain(data, domain, entity);

  return ok({
    entity,
    domain,
    items: filtered,
    count: filtered.length
  });
}, 'Friday:Engagement:List');
