import { getUser } from '@/engine.server';
import { ok, badRequest, unauthorized, serverError, ensureDb } from '@/lib/api-helpers';
import { create, list } from '@/engine';

export async function POST(request) {
  ensureDb();
  try {
    const user = await getUser();
    if (!user) return unauthorized('Not authenticated');

    const { entity_type, entity_id, content, attachments, is_team_only, reply_to } = await request.json();

    if (!entity_type || !entity_id || !content) {
      return badRequest('Missing entity_type, entity_id, or content');
    }

    const message = await create('chat_message', {
      entity_type,
      entity_id,
      content,
      attachments: attachments || [],
      is_team_only: is_team_only || false,
      reply_to: reply_to || null,
    }, user);

    return ok({
      id: message.id,
      entity_type: message.entity_type,
      entity_id: message.entity_id,
      content: message.content,
      attachments: message.attachments,
      is_team_only: message.is_team_only,
      reply_to: message.reply_to,
      created_by: message.created_by,
      created_by_display: user.name,
      created_by_avatar: user.avatar,
      created_at: message.created_at,
    });
  } catch (error) {
    console.error('Chat POST error:', error);
    return serverError(error.message);
  }
}

export async function GET(request) {
  ensureDb();
  try {
    const user = await getUser();
    if (!user) return unauthorized('Not authenticated');

    const { searchParams } = new URL(request.url);
    const entity_type = searchParams.get('entity_type');
    const entity_id = searchParams.get('entity_id');

    if (!entity_type || !entity_id) {
      return badRequest('Missing entity_type or entity_id');
    }

    const messages = list('chat_message', { entity_type, entity_id });

    return ok(
      messages.map(m => ({
        id: m.id,
        entity_type: m.entity_type,
        entity_id: m.entity_id,
        content: m.content,
        attachments: m.attachments ? JSON.parse(m.attachments) : [],
        is_team_only: m.is_team_only,
        reply_to: m.reply_to,
        created_by: m.created_by,
        created_by_display: m.created_by_display,
        created_by_avatar: m.created_by_avatar,
        created_at: m.created_at,
      }))
    );
  } catch (error) {
    console.error('Chat GET error:', error);
    return serverError(error.message);
  }
}
