import { getDatabase, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { withErrorHandler } from '@/lib/with-error-handler';
import { setCurrentRequest } from '@/engine.server';
import { ok, apiError } from '@/lib/response-formatter';

const customPutHandler = withErrorHandler(async (request, { params }) => {
  setCurrentRequest(request);
  const user = await requireAuth();
  const { id } = params;
  const body = await request.json();
  const { content } = body;

  if (!content) {
    throw new Error('content is required');
  }

  const db = getDatabase();
  
  try {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
    
    if (!message) {
      return apiError('Message not found', 404);
    }

    if (message.user_id !== user.id) {
      return apiError('Unauthorized', 403);
    }

    db.prepare(`
      UPDATE chat_messages
      SET content = ?, updated_at = ?
      WHERE id = ?
    `).run(content, now(), id);

    const updated = db.prepare(`
      SELECT m.*, u.name as created_by_display_name, u.email as created_by_email
      FROM chat_messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(id);

    return ok({
      ...updated,
      reactions: updated.reactions ? JSON.parse(updated.reactions) : {},
      mentions: updated.mentions ? JSON.parse(updated.mentions) : [],
      attachments: updated.attachments ? JSON.parse(updated.attachments) : [],
      created_by_display: {
        name: updated.created_by_display_name,
        email: updated.created_by_email,
        avatar: null
      }
    });
  } catch (error) {
    console.error('[Message API] Put failed:', error);
    throw error;
  }
}, 'MESSAGE:UPDATE');

const customDeleteHandler = withErrorHandler(async (request, { params }) => {
  setCurrentRequest(request);
  const user = await requireAuth();
  const { id } = params;

  const db = getDatabase();
  
  try {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
    
    if (!message) {
      return apiError('Message not found', 404);
    }

    if (message.user_id !== user.id) {
      return apiError('Unauthorized', 403);
    }

    db.prepare('DELETE FROM chat_mentions WHERE message_id = ?').run(id);
    db.prepare('DELETE FROM chat_messages WHERE id = ?').run(id);

    return ok({ success: true });
  } catch (error) {
    console.error('[Message API] Delete failed:', error);
    throw error;
  }
}, 'MESSAGE:DELETE');

export const PUT = customPutHandler;
export const DELETE = customDeleteHandler;
