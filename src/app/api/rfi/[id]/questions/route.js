import { requireAuth } from '@/lib/auth-middleware';
import { getDatabase, genId, now } from '@/lib/database-core';
import { withErrorHandler } from '@/lib/with-error-handler';
import { ok, paginated, created, notFound } from '@/lib/response-formatter';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/constants';
import { logAction } from '@/lib/audit-logger';

const db = getDatabase();

export const GET = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id } = params;
  const url = new URL(request.url);

  const rfi = db.prepare('SELECT * FROM rfis WHERE id = ?').get(id);
  if (!rfi) return notFound('RFI not found');

  const status = url.searchParams.get('status');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

  let query = `SELECT * FROM rfi_questions WHERE rfi_id = ?`;
  const params_arr = [id];

  if (status) {
    query += ` AND status = ?`;
    params_arr.push(status);
  }

  query += ` ORDER BY created_at ASC`;
  const questions = db.prepare(query).all(...params_arr);

  const items = questions.map(q => ({
    ...q,
    responses: db.prepare('SELECT * FROM rfi_responses WHERE question_id = ?').all(q.id)
  }));

  return ok(items);
}, 'GET /api/rfi/[id]/questions');

export const POST = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id } = params;
  const body = await request.json();

  const rfi = db.prepare('SELECT * FROM rfis WHERE id = ?').get(id);
  if (!rfi) return notFound('RFI not found');

  if (!body.question) {
    throw new AppError('question is required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
  }

  const questionId = genId();
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO rfi_questions (id, rfi_id, question, category, assigned_to, due_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    questionId,
    id,
    body.question,
    body.category || null,
    body.assigned_to || null,
    body.due_date || null,
    body.status || 'pending',
    timestamp,
    timestamp
  );

  logAction(user.id, 'rfi_question', questionId, 'create', null, body);

  const question = db.prepare('SELECT * FROM rfi_questions WHERE id = ?').get(questionId);
  return created({
    ...question,
    responses: []
  });
}, 'POST /api/rfi/[id]/questions');
