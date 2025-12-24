import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { specs } from '@/config/spec-helpers';
import { SQL_TYPES } from '@/config/data-constants';
import { forEachField } from '@/lib/field-iterator';
import { nanoid } from 'nanoid';

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const BUSY_TIMEOUT_MS = process.env.DATABASE_BUSY_TIMEOUT_MS || 5000;
db.pragma(`busy_timeout = ${BUSY_TIMEOUT_MS}`);
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

export const getDatabase = () => db;
export const genId = () => nanoid();
export const now = () => Math.floor(Date.now() / 1000);

export const migrate = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id))`);

  for (const spec of Object.values(specs)) {
    const columns = [];
    const foreignKeys = [];
    forEachField(spec, (key, field) => {
      let col = `${key} ${SQL_TYPES[field.type] || 'TEXT'}`;
      if (field.required && field.type !== 'id') col += ' NOT NULL';
      if (field.unique) col += ' UNIQUE';
      if (field.default !== undefined) col += ` DEFAULT ${typeof field.default === 'string' ? `'${field.default}'` : field.default}`;
      columns.push(col);
      if (field.type === 'ref' && field.ref) foreignKeys.push(`FOREIGN KEY (${key}) REFERENCES ${field.ref}(id)`);
    });
    const fkPart = foreignKeys.length ? ',\n' + foreignKeys.join(',\n') : '';
    db.exec(`CREATE TABLE IF NOT EXISTS ${spec.name} (${columns.join(',\n')}${fkPart})`);
  }

  for (const spec of Object.values(specs)) {
    const searchFields = [];
    forEachField(spec, (key, field) => {
      if (field.type === 'ref' || field.sortable || field.search) {
        try { db.exec(`CREATE INDEX IF NOT EXISTS idx_${spec.name}_${key} ON ${spec.name}(${key})`); } catch (e) {
          console.error(`[Database] Index creation failed for ${spec.name}.${key}:`, e.message);
        }
      }
      if (field.search || key === 'name' || key === 'description') searchFields.push(key);
    });

    if (searchFields.length > 0) {
      try {
        db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS ${spec.name}_fts USING fts5(${searchFields.join(', ')}, content=${spec.name}, content_rowid=id)`);
      } catch (e) {
        console.error(`[Database] FTS table creation failed for ${spec.name}:`, e.message);
      }
    }
  }
};
