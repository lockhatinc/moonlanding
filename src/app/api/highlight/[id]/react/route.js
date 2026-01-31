import { requireAuth } from '@/lib/auth-middleware';
import { withErrorHandler } from '@/lib/with-error-handler';
import { setCurrentRequest } from '@/engine.server';
import { ok } from '@/lib/response-formatter';
import { get, update } from '@/lib/query-engine';
import { broadcastUpdate } from '@/lib/realtime-server';

const customPostHandler = withErrorHandler(async (request, { params }) => {
  setCurrentRequest(request);
  const user = await requireAuth();
  const { id } = params;
  const { emoji } = await request.json();

  if (!emoji) {
    throw new Error('Emoji is required');
  }

  const highlight = get('highlight', id);
  if (!highlight) {
    throw new Error('Highlight not found');
  }

  const reactions = highlight.reactions || {};
  if (!reactions[emoji]) {
    reactions[emoji] = [];
  }

  const userIndex = reactions[emoji].indexOf(user.id);
  if (userIndex > -1) {
    reactions[emoji].splice(userIndex, 1);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  } else {
    reactions[emoji].push(user.id);
  }

  const updated = update('highlight', id, { reactions });
  broadcastUpdate(`/api/mwr/review/${highlight.review_id}/highlights`, 'update', updated);

  return ok(updated);
}, 'HIGHLIGHT:REACT');

export const POST = customPostHandler;
