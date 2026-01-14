import { createCrudHandlers } from '@/lib/crud-factory';
import { setCurrentRequest } from '@/engine.server';

function wrapHandler(method) {
  return async (request, context) => {
    setCurrentRequest(request);
    const params = await context.params;

    // Extract engagement ID and optional RFI ID from path
    const engagementId = params.id;
    const rfiPath = params.path || [];
    const rfiId = rfiPath[0] || null;

    console.log(`[Friday Nested] ${method} RFI for engagement/${engagementId}`, {
      engagementId,
      rfiId,
      childPath: rfiPath
    });

    // Create handlers for RFI entity with parent context
    const handlers = createCrudHandlers('rfi');

    const enhancedContext = {
      ...context,
      params: {
        entity: 'rfi',
        parentEntity: 'engagement',
        parentId: engagementId,
        id: rfiId,
      },
    };

    return handlers(request, enhancedContext);
  };
}

export const GET = wrapHandler('GET');
export const POST = wrapHandler('POST');
export const PUT = wrapHandler('PUT');
export const PATCH = wrapHandler('PATCH');
export const DELETE = wrapHandler('DELETE');
