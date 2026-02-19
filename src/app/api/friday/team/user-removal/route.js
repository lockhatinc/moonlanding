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
      JSON.stringify({ status: 'error', message: 'Only partners and managers can manage team users' }),
      { status: HTTP.FORBIDDEN, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { team_id, removed_user_ids } = body;

  if (!team_id || !removed_user_ids || !Array.isArray(removed_user_ids) || removed_user_ids.length === 0) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'team_id and removed_user_ids array required' }),
      { status: HTTP.BAD_REQUEST, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase();
  const team = db.prepare('SELECT id, name, users FROM team WHERE id = ?').get(team_id);

  if (!team) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Team not found' }),
      { status: HTTP.NOT_FOUND, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const timestamp = now();
  let engagementsUpdated = 0;

  const cascadeRemoval = db.transaction(() => {
    let teamUsers;
    try {
      teamUsers = JSON.parse(team.users || '[]');
    } catch {
      teamUsers = [];
    }

    const updatedTeamUsers = teamUsers.filter(u => !removed_user_ids.includes(u));
    db.prepare('UPDATE team SET users = ?, updated_at = ?, updated_by = ? WHERE id = ?')
      .run(JSON.stringify(updatedTeamUsers), timestamp, user.id, team_id);

    const engagements = db.prepare(`
      SELECT id, users FROM engagement
      WHERE team_id = ? AND (status IS NULL OR status != 'deleted')
    `).all(team_id);

    for (const engagement of engagements) {
      let engUsers;
      try {
        engUsers = JSON.parse(engagement.users || '[]');
      } catch {
        engUsers = [];
      }

      const filteredUsers = engUsers.filter(u => {
        const userId = typeof u === 'object' ? u.id : u;
        return !removed_user_ids.includes(userId);
      });

      if (filteredUsers.length !== engUsers.length) {
        db.prepare('UPDATE engagement SET users = ?, updated_at = ?, updated_by = ? WHERE id = ?')
          .run(JSON.stringify(filteredUsers), timestamp, user.id, engagement.id);
        engagementsUpdated++;
      }
    }
  });

  cascadeRemoval();

  logAction('team', team_id, 'user_removal_cascade', user.id,
    { removed_user_ids },
    { engagements_updated: engagementsUpdated }
  );

  return new Response(
    JSON.stringify({
      status: 'success',
      data: {
        team_id,
        removed_user_ids,
        engagements_updated: engagementsUpdated
      }
    }),
    { status: HTTP.OK, headers: { 'Content-Type': 'application/json' } }
  );
}

export const POST = withErrorHandler(handlePost, 'team-user-removal');
