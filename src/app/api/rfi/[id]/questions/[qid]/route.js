import { requireAuth } from '@/lib/auth-middleware';
import { getDatabase, now } from '@/lib/database-core';
import { withErrorHandler } from '@/lib/with-error-handler';
import { ok, notFound } from '@/lib/response-formatter';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/constants';
import { logAction } from '@/lib/audit-logger';

const db = getDatabase();

export const GET = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id, qid } = params;

  const question = db.prepare('SELECT * FROM rfi_questions WHERE id = ? AND rfi_id = ?').get(qid, id);
  if (!question) return notFound('Question not found');

  const responses = db.prepare('SELECT * FROM rfi_responses WHERE question_id = ? ORDER BY created_at DESC').all(qid);

  return ok({
    ...question,
    responses
  });
}, 'GET /api/rfi/[id]/questions/[qid]');

export const PUT = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id, qid } = params;
  const body = await request.json();

  const question = db.prepare('SELECT * FROM rfi_questions WHERE id = ? AND rfi_id = ?').get(qid, id);
  if (!question) return notFound('Question not found');

  const updates = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
  if (body.due_date !== undefined) updates.due_date = body.due_date;

  if (Object.keys(updates).length === 0) {
    return ok(question);
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(now());
  values.push(qid);

  const stmt = db.prepare(`
    UPDATE rfi_questions SET ${setClauses}, updated_at = ? WHERE id = ?
  `);
  stmt.run(...values);

  logAction(user.id, 'rfi_question', qid, 'update', question, updates);

  const updated = db.prepare('SELECT * FROM rfi_questions WHERE id = ?').get(qid);
  return ok(updated);
}, 'PUT /api/rfi/[id]/questions/[qid]');

export const DELETE = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id, qid } = params;

  const question = db.prepare('SELECT * FROM rfi_questions WHERE id = ? AND rfi_id = ?').get(qid, id);
  if (!question) return notFound('Question not found');

  db.prepare('DELETE FROM rfi_responses WHERE question_id = ?').run(qid);
  db.prepare('DELETE FROM rfi_questions WHERE id = ?').run(qid);

  logAction(user.id, 'rfi_question', qid, 'delete', question, null);

  return ok({ deleted: true });
}, 'DELETE /api/rfi/[id]/questions/[qid]');
