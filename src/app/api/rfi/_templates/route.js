import { requireAuth } from '@/lib/auth-middleware';
import { withErrorHandler } from '@/lib/with-error-handler';
import { ok } from '@/lib/response-formatter';
import { listTemplates, getTemplate } from '@/lib/rfi-engine';

export const GET = withErrorHandler(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const templateId = url.searchParams.get('id');

  if (templateId) {
    const template = getTemplate(templateId);
    if (!template) {
      return ok({ error: 'Template not found' });
    }
    return ok({ id: templateId, ...template });
  }

  return ok(listTemplates());
}, 'GET /api/rfi/_templates');
