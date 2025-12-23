import { getDomainLoader } from '@/lib/domain-loader';
import { getConfigEngine } from '@/lib/config-generator-engine';
import { createCrudHandlers } from '@/lib/crud-factory';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';

async function handleRequest(request, context, method) {
  const domainLoader = getDomainLoader();
  const domain = 'friday';

  const params = await context.params;
  const { entity } = params;

  if (!domainLoader.isEntityInDomain(entity, domain)) {
    throw new AppError(
      `Entity ${entity} not available in Friday domain`,
      'FORBIDDEN',
      HTTP.FORBIDDEN
    );
  }

  const handler = createCrudHandlers(entity);

  const modifiedRequest = new Request(request.url + `?domain=${domain}`, {
    method: request.method,
    headers: request.headers,
    body: method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined
  });

  return handler(modifiedRequest, { params });
}

export async function GET(request, context) {
  return handleRequest(request, context, 'GET');
}

export async function POST(request, context) {
  return handleRequest(request, context, 'POST');
}

export async function PUT(request, context) {
  return handleRequest(request, context, 'PUT');
}

export async function PATCH(request, context) {
  return handleRequest(request, context, 'PATCH');
}

export async function DELETE(request, context) {
  return handleRequest(request, context, 'DELETE');
}
