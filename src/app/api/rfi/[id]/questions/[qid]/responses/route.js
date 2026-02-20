import { requireAuth } from '@/lib/auth-middleware';
import { getDatabase, genId, now } from '@/lib/database-core';
import { withErrorHandler } from '@/lib/with-error-handler';
import { ok, created, notFound } from '@/lib/response-formatter';
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
  return ok(responses);
}, 'GET /api/rfi/[id]/questions/[qid]/responses');

export const POST = withErrorHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id, qid } = params;
  const body = await request.json();

  const question = db.prepare('SELECT * FROM rfi_questions WHERE id = ? AND rfi_id = ?').get(qid, id);
  if (!question) return notFound('Question not found');

  if (!body.response) {
    throw new AppError('response is required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
  }

  const responseId = genId();
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO rfi_responses (id, question_id, response, attachments, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    responseId,
    qid,
    body.response,
    body.attachments ? JSON.stringify(body.attachments) : null,
    timestamp,
    timestamp
  );

  const updStmt = db.prepare('UPDATE rfi_questions SET status = ?, updated_at = ? WHERE id = ?');
  updStmt.run('answered', timestamp, qid);

  logAction('rfi_response', responseId, 'create', user.id, null, body);

  const response = db.prepare('SELECT * FROM rfi_responses WHERE id = ?').get(responseId);
  return created(response);
}, 'POST /api/rfi/[id]/questions/[qid]/responses');
