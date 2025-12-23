import { getDomainLoader } from '@/lib/domain-loader';
import { ok } from '@/lib/response-formatter';
import { withErrorHandler } from '@/lib/with-error-handler';
import { AppError, NotFoundError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

export const GET = withErrorHandler(async (request, context) => {
  const params = await context.params;
  const { domain } = params;

  if (!domain) {
    throw new AppError('Domain parameter required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
  }

  const domainLoader = getDomainLoader();
  const validDomains = domainLoader.getValidDomains();

  if (!validDomains.includes(domain.toLowerCase())) {
    throw NotFoundError('domain', domain);
  }

  const domainInfo = domainLoader.getDomainInfo(domain);
  return ok(domainInfo);
}, 'Domains:Get');
