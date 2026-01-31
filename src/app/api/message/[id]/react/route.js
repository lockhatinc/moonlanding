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

  const message = get('message', id);
  if (!message) {
    throw new Error('Message not found');
  }

  const reactions = message.reactions || {};
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

  const updated = update('message', id, { reactions });
  broadcastUpdate(`/api/message?entity_type=${message.entity_type}&entity_id=${message.entity_id}`, 'update', updated);

  return ok(updated);
}, 'MESSAGE:REACT');

export const POST = customPostHandler;
