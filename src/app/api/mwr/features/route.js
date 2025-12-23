import { getDomainLoader } from '@/lib/domain-loader';
import { ok } from '@/lib/response-formatter';
import { withErrorHandler } from '@/lib/with-error-handler';

export const GET = withErrorHandler(async (request) => {
  const domainLoader = getDomainLoader();
  const domain = 'mwr';

  const features = domainLoader.getFeaturesForDomain(domain);
  const entities = domainLoader.getEntitiesForDomain(domain);

  return ok({
    domain,
    features,
    entities,
    feature_count: features.length,
    entity_count: entities.length
  });
}, 'MWR:Features');
