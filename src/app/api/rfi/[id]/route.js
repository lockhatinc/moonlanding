import { requireAuth } from '@/lib/auth-middleware';
import { getDatabase, now } from '@/lib/database-core';
import { withErrorHandler } from '@/lib/with-error-handler';
import { ok, notFound } from '@/lib/response-formatter';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/api-constants';
import { logAction } from '@/lib/audit-logger';

const db = getDatabase();

export const GET = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id } = params;

  const rfi = db.prepare('SELECT * FROM rfis WHERE id = ?').get(id);
  if (!rfi) return notFound('RFI not found');

  const questions = db.prepare(`
    SELECT * FROM rfi_questions WHERE rfi_id = ? ORDER BY created_at ASC
  `).all(id);

  const questionsWithResponses = questions.map(q => ({
    ...q,
    responses: db.prepare('SELECT * FROM rfi_responses WHERE question_id = ? ORDER BY created_at DESC').all(q.id)
  }));

  return ok({
    ...rfi,
    questions: questionsWithResponses
  });
}, 'GET /api/rfi/[id]');

export const PUT = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id } = params;
  const body = await request.json();

  const rfi = db.prepare('SELECT * FROM rfis WHERE id = ?').get(id);
  if (!rfi) return notFound('RFI not found');

  const updates = {};
  if (body.status !== undefined) updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return ok(rfi);
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(now());
  values.push(id);

  const stmt = db.prepare(`
    UPDATE rfis SET ${setClauses}, updated_at = ? WHERE id = ?
  `);
  stmt.run(...values);

  logAction(user.id, 'rfi', id, 'update', rfi, updates);

  const updated = db.prepare('SELECT * FROM rfis WHERE id = ?').get(id);
  return ok(updated);
}, 'PUT /api/rfi/[id]');

export const DELETE = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id } = params;

  const rfi = db.prepare('SELECT * FROM rfis WHERE id = ?').get(id);
  if (!rfi) return notFound('RFI not found');

  db.prepare('DELETE FROM rfi_responses WHERE question_id IN (SELECT id FROM rfi_questions WHERE rfi_id = ?)').run(id);
  db.prepare('DELETE FROM rfi_questions WHERE rfi_id = ?').run(id);
  db.prepare('DELETE FROM rfis WHERE id = ?').run(id);

  logAction(user.id, 'rfi', id, 'delete', rfi, null);

  return ok({ deleted: true });
}, 'DELETE /api/rfi/[id]');
