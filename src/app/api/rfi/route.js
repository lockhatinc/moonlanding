import { requireAuth } from '@/lib/auth-middleware';
import { getDatabase, genId, now } from '@/lib/database-core';
import { withErrorHandler } from '@/lib/with-error-handler';
import { ok, paginated, created } from '@/lib/response-formatter';
import { AppError } from '@/lib/error-handler';
import { HTTP } from '@/config/constants';
import { logAction } from '@/lib/audit-logger';

const db = getDatabase();

export const GET = withErrorHandler(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  
  const engagementId = url.searchParams.get('engagement_id');
  const status = url.searchParams.get('status');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  
  if (page < 1) throw new AppError('Invalid page', 'BAD_REQUEST', HTTP.BAD_REQUEST);
  if (limit < 1 || limit > 100) throw new AppError('Invalid limit', 'BAD_REQUEST', HTTP.BAD_REQUEST);

  let query = `SELECT * FROM rfis WHERE 1=1`;
  const params = [];

  if (engagementId) {
    query += ` AND engagement_id = ?`;
    params.push(engagementId);
  }

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit);
  params.push((page - 1) * limit);

  const stmt = db.prepare(query);
  const items = stmt.all(...params);

  const countStmt = db.prepare(
    `SELECT COUNT(*) as count FROM rfis WHERE 1=1${engagementId ? ' AND engagement_id = ?' : ''}${status ? ' AND status = ?' : ''}`
  );
  const countParams = [...(engagementId ? [engagementId] : []), ...(status ? [status] : [])];
  const { count } = countStmt.get(...countParams);

  return paginated(items, {
    page,
    limit,
    total: count,
    pages: Math.ceil(count / limit)
  });
}, 'GET /api/rfi');

export const POST = withErrorHandler(async (request) => {
  const user = await requireAuth();
  const body = await request.json();

  if (!body.engagement_id) {
    throw new AppError('engagement_id is required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
  }

  const id = genId();
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO rfis (id, engagement_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    body.engagement_id,
    body.status || 'draft',
    timestamp,
    timestamp
  );

  logAction(user.id, 'rfi', id, 'create', null, { id, engagement_id: body.engagement_id, status: body.status || 'draft' });

  const rfi = db.prepare('SELECT * FROM rfis WHERE id = ?').get(id);
  return created(rfi);
}, 'POST /api/rfi');
