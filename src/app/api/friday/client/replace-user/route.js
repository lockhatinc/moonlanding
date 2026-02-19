import { getDatabase, now } from '@/lib/database-core';
import { requireAuth } from '@/lib/auth-middleware';
import { setCurrentRequest } from '@/engine.server';
import { logAction } from '@/lib/audit-logger';
import { HTTP } from '@/config/constants';
import { withErrorHandler } from '@/lib/with-error-handler';

async function handlePost(request) {
  setCurrentRequest(request);
  const user = await requireAuth();

  if (!['partner', 'manager'].includes(user.role)) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Only partners and managers can replace client users' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { old_user_id, new_user_id, client_id } = body;

  if (!old_user_id || !new_user_id || !client_id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'old_user_id, new_user_id, and client_id required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (old_user_id === new_user_id) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'old_user_id and new_user_id must be different' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();

  const oldUser = db.prepare('SELECT id, email, client_id FROM users WHERE id = ? AND client_id = ?').get(old_user_id, client_id);
  if (!oldUser) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Old user not found or does not belong to this client' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const newUser = db.prepare('SELECT id, email, client_id FROM users WHERE id = ? AND client_id = ?').get(new_user_id, client_id);
  if (!newUser) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'New user not found or does not belong to this client' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let replacedCount = 0;

  const replaceBatch = db.transaction(() => {
    const rfis = db.prepare(`
      SELECT id, assigned_users FROM rfi
      WHERE engagement_id IN (SELECT id FROM engagement WHERE client_id = ?)
        AND assigned_users LIKE ?
    `).all(client_id, `%${old_user_id}%`);

    for (const rfi of rfis) {
      let users = rfi.assigned_users || '';
      users = users.replace(old_user_id, new_user_id);
      db.prepare('UPDATE rfi SET assigned_users = ?, updated_at = ? WHERE id = ?')
        .run(users, now(), rfi.id);
      replacedCount++;
    }

    const responses = db.prepare(`
      UPDATE rfi_response SET responded_by = ?, updated_at = ?
      WHERE responded_by = ?
    `).run(new_user_id, now(), old_user_id);
    replacedCount += responses.changes;
  });

  replaceBatch();

  logAction('users', old_user_id, 'replace_client_user', user.id,
    { old_user_id, old_email: oldUser.email },
    { new_user_id, new_email: newUser.email, replacements: replacedCount }
  );

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        old_user_id,
        new_user_id,
        client_id,
        replacements: replacedCount
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'replace-client-user');
