import { getDatabase, genId, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { withErrorHandler } from '@/lib/with-error-handler';
import { setCurrentRequest } from '@/engine.server';
import { ok, apiError } from '@/lib/response-formatter';
import { parse as parseQuery } from '@/lib/query-string-adapter';

const customGetHandler = withErrorHandler(async (request) => {
  setCurrentRequest(request);
  const user = await requireAuth();
  const { rfi_id } = await parseQuery(request);

  if (!rfi_id) {
    return ok([]);
  }

  const db = getDatabase();
  try {
    const messages = db.prepare(`
      SELECT m.*, u.name as created_by_display_name, u.email as created_by_email
      FROM chat_messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.rfi_id = ?
      ORDER BY m.created_at ASC
    `).all(rfi_id);

    return ok(messages.map(msg => ({
      ...msg,
      reactions: msg.reactions ? JSON.parse(msg.reactions) : {},
      mentions: msg.mentions ? JSON.parse(msg.mentions) : [],
      attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
      created_by_display: {
        name: msg.created_by_display_name,
        email: msg.created_by_email,
        avatar: null
      }
    })));
  } catch (error) {
    console.error('[Message API] Get failed:', error);
    throw error;
  }
}, 'MESSAGE:LIST');

const customPostHandler = withErrorHandler(async (request) => {
  setCurrentRequest(request);
  const user = await requireAuth();
  const body = await request.json();
  const { rfi_id, content, mentions = [], attachments = [] } = body;

  if (!rfi_id || !content) {
    throw new Error('rfi_id and content are required');
  }

  const db = getDatabase();
  const messageId = genId();
  const timestamp = now();

  try {
    db.prepare(`
      INSERT INTO chat_messages (
        id, rfi_id, user_id, content, attachments, 
        reactions, mentions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      messageId,
      rfi_id,
      user.id,
      content,
      JSON.stringify(attachments),
      '{}',
      JSON.stringify(mentions),
      timestamp,
      timestamp
    );

    if (mentions && mentions.length > 0) {
      const userStmt = db.prepare('SELECT id FROM users WHERE name = ?');
      for (const mention of mentions) {
        const mentionedUser = userStmt.get(mention);
        if (mentionedUser) {
          db.prepare(`
            INSERT INTO chat_mentions (id, message_id, user_id, resolved, created_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(genId(), messageId, mentionedUser.id, 0, timestamp);
        }
      }
    }

    const newMessage = db.prepare(`
      SELECT m.*, u.name as created_by_display_name, u.email as created_by_email
      FROM chat_messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(messageId);

    return ok({
      ...newMessage,
      reactions: {},
      mentions: mentions || [],
      attachments: attachments || [],
      created_by_display: {
        name: newMessage.created_by_display_name,
        email: newMessage.created_by_email,
        avatar: null
      }
    });
  } catch (error) {
    console.error('[Message API] Post failed:', error);
    throw error;
  }
}, 'MESSAGE:CREATE');

export const GET = customGetHandler;
export const POST = customPostHandler;
