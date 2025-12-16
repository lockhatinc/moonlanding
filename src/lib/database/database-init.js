import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { specs, SQL_TYPES } from '@/config';
import { forEachField } from '@/lib/field-iterator';

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
const dataDir = path.dirname(DB_PATH);

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function migrate() {
  const db = getDatabase();

  db.exec(
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  );

  for (const spec of Object.values(specs)) {
    const columns = [];
    const foreignKeys = [];

    forEachField(spec, (key, field) => {
      let col = `${key} ${SQL_TYPES[field.type] || 'TEXT'}`;

      if (field.required && field.type !== 'id') {
        col += ' NOT NULL';
      }

      if (field.unique) {
        col += ' UNIQUE';
      }

      if (field.default !== undefined) {
        const defaultValue = typeof field.default === 'string' ? `'${field.default}'` : field.default;
        col += ` DEFAULT ${defaultValue}`;
      }

      columns.push(col);

      if (field.type === 'ref' && field.ref) {
        foreignKeys.push(`FOREIGN KEY (${key}) REFERENCES ${field.ref}(id)`);
      }
    });

    const fkPart = foreignKeys.length ? ',\n' + foreignKeys.join(',\n') : '';
    const tableSQL = `CREATE TABLE IF NOT EXISTS ${spec.name} (
      ${columns.join(',\n')}${fkPart}
    )`;

    db.exec(tableSQL);
  }

  for (const spec of Object.values(specs)) {
    forEachField(spec, (key, field) => {
      if (field.type === 'ref' || field.sortable || field.search) {
        try {
          db.exec(`CREATE INDEX IF NOT EXISTS idx_${spec.name}_${key} ON ${spec.name}(${key})`);
        } catch (e) {
          console.warn(`[Database] Index creation failed for ${spec.name}.${key}:`, e.message);
        }
      }
    });
  }
}

export function beginTransaction() {
  return getDatabase().prepare('BEGIN TRANSACTION').run();
}

export function commit() {
  return getDatabase().prepare('COMMIT').run();
}

export function rollback() {
  return getDatabase().prepare('ROLLBACK').run();
}

export const genId = () => require('nanoid').nanoid();
export const now = () => Math.floor(Date.now() / 1000);
