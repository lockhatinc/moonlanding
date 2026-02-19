import { getDatabase, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (user.role !== 'partner') {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only partners can delete client users' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { user_ids } = body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'user_ids array required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const results = { deleted: [], failed: [] };

  const deleteBatch = db.transaction(() => {
    for (const userId of user_ids) {
      const targetUser = db.prepare('SELECT id, email, client_id, type FROM users WHERE id = ?').get(userId);

      if (!targetUser) {
        results.failed.push({ id: userId, reason: 'User not found' });
        continue;
      }

      if (targetUser.type !== 'client') {
        results.failed.push({ id: userId, reason: 'Cannot delete non-client users via this endpoint' });
        continue;
      }

      db.prepare(`
        UPDATE rfi SET assigned_users = REPLACE(assigned_users, ?, '')
        WHERE assigned_users LIKE ?
      `).run(userId, `%${userId}%`);

      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);

      db.prepare('UPDATE users SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?')
        .run('deleted', now(), user.id, userId);

      logAction('users', userId, 'delete_client_user', user.id, targetUser, { status: 'deleted' });
      results.deleted.push({ id: userId, email: targetUser.email });
    }
  });

  deleteBatch();

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        total: user_ids.length,
        deleted: results.deleted.length,
        failed: results.failed.length,
        details: results
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'delete-client-user');
