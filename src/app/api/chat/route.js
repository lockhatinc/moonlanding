import { createHttpMethods } from '@/lib/http-methods-factory';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { withErrorHandler } from '@/lib/with-error-handler';
import { parse as parseQuery } from '@/lib/query-string-adapter';
import { list, get } from '@/lib/query-engine';
import { ok } from '@/lib/response-formatter';
import { mergeChatMessages } from '@/lib/chat-merger';
import { permissionService } from '@/services';
import { getSpec } from '@/config/spec-helpers';

const customGetHandler = withErrorHandler(async (request) => {
  setCurrentRequest(request);
  const user = await requireAuth();
  const { entity_type, entity_id } = await parseQuery(request);
  const messageSpec = getSpec('message');

  if (!entity_type || !entity_id) {
    return ok([]);
  }

  if (entity_type === 'engagement') {
    const engagement = get('engagement', entity_id);

    if (!engagement) {
      const engagementMessages = list('message', { entity_type: 'engagement', entity_id });
      return ok(permissionService.filterRecords(user, messageSpec, engagementMessages));
    }

    const reviewLink = engagement.review_link;

    if (!reviewLink) {
      const engagementMessages = list('message', { entity_type: 'engagement', entity_id });
      return ok(permissionService.filterRecords(user, messageSpec, engagementMessages));
    }

    const review = get('review', reviewLink);

    if (!review) {
      const engagementMessages = list('message', { entity_type: 'engagement', entity_id });
      return ok(permissionService.filterRecords(user, messageSpec, engagementMessages));
    }

    const engagementMessages = list('message', { entity_type: 'engagement', entity_id });
    const reviewMessages = list('message', { entity_type: 'review', entity_id: reviewLink });

    const merged = mergeChatMessages(engagementMessages, reviewMessages);
    return ok(permissionService.filterRecords(user, messageSpec, merged));
  }

  if (entity_type === 'review') {
    const engagementWithReview = list('engagement', { review_link: entity_id });

    if (!engagementWithReview || engagementWithReview.length === 0) {
      const reviewMessages = list('message', { entity_type: 'review', entity_id });
      return ok(permissionService.filterRecords(user, messageSpec, reviewMessages));
    }

    const engagementId = engagementWithReview[0]?.id;

    if (!engagementId) {
      const reviewMessages = list('message', { entity_type: 'review', entity_id });
      return ok(permissionService.filterRecords(user, messageSpec, reviewMessages));
    }

    const engagementMessages = list('message', { entity_type: 'engagement', entity_id: engagementId });
    const reviewMessages = list('message', { entity_type: 'review', entity_id });

    const merged = mergeChatMessages(engagementMessages, reviewMessages);
    return ok(permissionService.filterRecords(user, messageSpec, merged));
  }

  const messages = list('message', { entity_type, entity_id });
  return ok(permissionService.filterRecords(user, messageSpec, messages));
}, 'CHAT:GET');

export const GET = customGetHandler;
export const { POST, PUT, PATCH, DELETE } = createHttpMethods('message');
