// Unified engine: database, CRUD, and authentication
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import { Google } from 'arctic';
import { cookies } from 'next/headers';
import { specs, getSpec } from './specs';
import { coerce, SQL_TYPES, getSearchFields } from './lib/field-types';

// === DATABASE ===
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

export function migrate() {
  db.exec(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id))`);

  for (const spec of Object.values(specs)) {
    const columns = [], foreignKeys = [];
    for (const [key, field] of Object.entries(spec.fields)) {
      let col = `${key} ${SQL_TYPES[field.type] || 'TEXT'}`;
      if (field.required && field.type !== 'id') col += ' NOT NULL';
      if (field.unique) col += ' UNIQUE';
      if (field.default !== undefined) col += ` DEFAULT ${typeof field.default === 'string' ? `'${field.default}'` : field.default}`;
      columns.push(col);
      if (field.type === 'ref' && field.ref) foreignKeys.push(`FOREIGN KEY (${key}) REFERENCES ${field.ref}s(id)`);
    }
    const fkPart = foreignKeys.length ? ',\n' + foreignKeys.join(',\n') : '';
    db.exec(`CREATE TABLE IF NOT EXISTS ${spec.name}s (${columns.join(',\n')}${fkPart})`);
  }

  for (const spec of Object.values(specs)) {
    for (const [key, field] of Object.entries(spec.fields)) {
      if (field.type === 'ref' || field.sortable || field.search) {
        try { db.exec(`CREATE INDEX IF NOT EXISTS idx_${spec.name}s_${key} ON ${spec.name}s(${key})`); } catch {}
      }
    }
  }
}

export const genId = () => nanoid();
export const now = () => Math.floor(Date.now() / 1000);

// === CRUD ===
function buildSelect(spec, where = {}, options = {}) {
  const table = `${spec.name}s`, selects = [`${table}.*`], joins = [];
  if (spec.computed) for (const [key, comp] of Object.entries(spec.computed)) selects.push(`${comp.sql} as ${key}`);
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.display) {
      const alias = `${field.ref}_${key}`, displayField = field.display.split('.')[1] || 'name';
      joins.push(`LEFT JOIN ${field.ref}s ${alias} ON ${table}.${key} = ${alias}.id`);
      selects.push(`${alias}.${displayField} as ${key}_display`);
    }
  }
  const whereClauses = [], params = [];
  for (const [key, value] of Object.entries(where)) {
    if (value !== undefined && value !== null) { whereClauses.push(`${table}.${key} = ?`); params.push(value); }
  }
  if (spec.fields.status && !where.status && !options.includeDeleted) whereClauses.push(`${table}.status != 'deleted'`);
  let sql = `SELECT ${selects.join(', ')} FROM ${table}`;
  if (joins.length) sql += ' ' + joins.join(' ');
  if (whereClauses.length) sql += ' WHERE ' + whereClauses.join(' AND ');
  const sort = options.sort || spec.list?.defaultSort;
  if (sort) sql += ` ORDER BY ${table}.${sort.field} ${sort.dir?.toUpperCase() || 'ASC'}`;
  if (options.limit) { sql += ` LIMIT ${options.limit}`; if (options.offset) sql += ` OFFSET ${options.offset}`; }
  return { sql, params };
}

export function list(entityName, where = {}, options = {}) {
  const spec = getSpec(entityName), { sql, params } = buildSelect(spec, where, options);
  try { return db.prepare(sql).all(...params); } catch (e) { console.error('List error:', e.message); return []; }
}

export function get(entityName, id) {
  const spec = getSpec(entityName), { sql, params } = buildSelect(spec, { id });
  try { return db.prepare(sql).get(...params); } catch (e) { console.error('Get error:', e.message); return null; }
}

export function create(entityName, data, user) {
  const spec = getSpec(entityName), id = data.id || genId(), fields = { id };
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'id') continue;
    if (field.auto === 'now') fields[key] = now();
    else if (field.auto === 'user' && user) fields[key] = user.id;
    else if (data[key] !== undefined && data[key] !== '') { const v = coerce(data[key], field.type); if (v !== undefined) fields[key] = v; }
    else if (field.default !== undefined) fields[key] = field.default;
  }
  const keys = Object.keys(fields);
  try { db.prepare(`INSERT INTO ${spec.name}s (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...Object.values(fields)); return { id, ...fields }; }
  catch (e) { console.error('Create error:', e.message); throw e; }
}

export function update(entityName, id, data, user) {
  const spec = getSpec(entityName), fields = {};
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.readOnly || field.type === 'id') continue;
    if (field.auto === 'update') fields[key] = now();
    else if (data[key] !== undefined) { const v = coerce(data[key], field.type); fields[key] = v === undefined ? null : v; }
  }
  if (!Object.keys(fields).length) return;
  try { db.prepare(`UPDATE ${spec.name}s SET ${Object.keys(fields).map(k => `${k} = ?`).join(', ')} WHERE id = ?`).run(...Object.values(fields), id); }
  catch (e) { console.error('Update error:', e.message); throw e; }
}

export function remove(entityName, id) {
  const spec = getSpec(entityName);
  try {
    if (spec.fields.status) db.prepare(`UPDATE ${spec.name}s SET status = 'deleted', updated_at = ? WHERE id = ?`).run(now(), id);
    else db.prepare(`DELETE FROM ${spec.name}s WHERE id = ?`).run(id);
  } catch (e) { console.error('Remove error:', e.message); throw e; }
}

export function search(entityName, query, where = {}) {
  const spec = getSpec(entityName), searchFields = getSearchFields(spec);
  if (!searchFields.length || !query) return list(entityName, where);
  const table = `${spec.name}s`, { sql: baseSql, params: baseParams } = buildSelect(spec, where);
  const searchClauses = searchFields.map(f => `${table}.${f} LIKE ?`).join(' OR ');
  const searchParams = searchFields.map(() => `%${query}%`);
  let sql = baseSql.includes('WHERE') ? baseSql.replace(' WHERE ', ` WHERE (${searchClauses}) AND `) : `${baseSql} WHERE (${searchClauses})`;
  try { return db.prepare(sql).all(...searchParams, ...baseParams); } catch (e) { console.error('Search error:', e.message); return []; }
}

export function getChildren(entityName, parentId, childDef) {
  const where = { [childDef.fk]: parentId };
  if (childDef.filter) Object.assign(where, childDef.filter);
  return list(childDef.entity, where);
}

export function count(entityName, where = {}) {
  const spec = getSpec(entityName), whereClauses = [], params = [];
  for (const [key, value] of Object.entries(where)) { if (value !== undefined) { whereClauses.push(`${key} = ?`); params.push(value); } }
  if (spec.fields.status && !where.status) whereClauses.push(`status != 'deleted'`);
  try { return db.prepare(`SELECT COUNT(*) as count FROM ${spec.name}s${whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : ''}`).get(...params).count; }
  catch { return 0; }
}

export function getBy(entityName, field, value) {
  const spec = getSpec(entityName), { sql, params } = buildSelect(spec, { [field]: value });
  try { return db.prepare(sql).get(...params); } catch { return null; }
}

// === AUTH ===
const adapter = new BetterSqlite3Adapter(db, { user: 'users', session: 'sessions' });

export const lucia = new Lucia(adapter, {
  sessionCookie: { expires: false, attributes: { secure: process.env.NODE_ENV === 'production' } },
  getUserAttributes: (row) => ({ id: row.id, email: row.email, name: row.name, avatar: row.avatar, type: row.type, role: row.role }),
});

export const google = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? new Google(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback')
  : null;

export async function getUser() {
  try {
    const cookieStore = await cookies(), sessionId = cookieStore.get(lucia.sessionCookieName)?.value;
    if (!sessionId) return null;
    const { user, session } = await lucia.validateSession(sessionId);
    if (session?.fresh) { const cookie = lucia.createSessionCookie(session.id); cookieStore.set(cookie.name, cookie.value, cookie.attributes); }
    if (!session) { const cookie = lucia.createBlankSessionCookie(); cookieStore.set(cookie.name, cookie.value, cookie.attributes); }
    return user;
  } catch { return null; }
}

export async function requireUser() { const user = await getUser(); if (!user) throw new Error('Unauthorized'); return user; }

export function can(user, spec, action) {
  if (!user) return false;
  if (!spec.access?.[action]) return true;
  return spec.access[action].includes(user.role);
}

export function check(user, spec, action) { if (!can(user, spec, action)) throw new Error(`Permission denied: ${spec.name}.${action}`); }

export async function createSession(userId) {
  const session = await lucia.createSession(userId, {}), sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies(); cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  return session;
}

export async function invalidateSession() {
  try {
    const cookieStore = await cookies(), sessionId = cookieStore.get(lucia.sessionCookieName)?.value;
    if (sessionId) await lucia.invalidateSession(sessionId);
    const blankCookie = lucia.createBlankSessionCookie(); cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
  } catch {}
}

export function hashPassword(password) { return require('crypto').createHash('sha256').update(password).digest('hex'); }
export function verifyPassword(password, hash) { return hashPassword(password) === hash; }

export default db;
