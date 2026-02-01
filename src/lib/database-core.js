import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { specs } from '@/config/spec-helpers';
import { SQL_TYPES } from '@/config/data-constants';
import { forEachField } from '@/lib/field-iterator';
import { getConfigEngineSync } from '@/lib/config-generator-engine';
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

export const migrate = () => {
  console.error('[Database] ===== MIGRATE CALLED =====');
  console.log('[Database] Running migration...');
  console.log('[Database] Initial specs count:', Object.keys(specs).length);

  let specsToUse = specs;
  if (Object.keys(specs).length === 0) {
    console.log('[Database] Specs is empty, loading from ConfigEngine...');
    try {
      const engine = getConfigEngineSync();
      specsToUse = {};
      for (const entityName of engine.getAllEntities()) {
        specsToUse[entityName] = engine.generateEntitySpec(entityName);
      }
      console.log(`[Database] Generated ${Object.keys(specsToUse).length} specs from ConfigEngine`);
    } catch (e) {
      console.error('[Database] Failed to get specs from ConfigEngine during migration:', e.message);
      specsToUse = specs;
    }
  } else {
    console.log('[Database] Using pre-loaded specs:', Object.keys(specsToUse).length);
  }
  console.log('[Database] Final specs count:', Object.keys(specsToUse).length);

  for (const spec of Object.values(specsToUse)) {
    if (!spec) continue;
    const columns = [];
    const foreignKeys = [];
    const tableName = spec.name === 'user' ? 'users' : spec.name;

    forEachField(spec, (key, field) => {
      let col = `"${key}" ${SQL_TYPES[field.type] || 'TEXT'}`;
      if (field.required && field.type !== 'id') col += ' NOT NULL';
      if (field.unique) col += ' UNIQUE';
      if (field.default !== undefined) {
        if (typeof field.default === 'string' || typeof field.default === 'number' || typeof field.default === 'boolean') {
          const defaultVal = typeof field.default === 'string' ? `'${field.default.replace(/'/g, "''")}'` : field.default;
          col += ` DEFAULT ${defaultVal}`;
        }
      }
      columns.push(col);
      if (field.type === 'ref' && field.ref) {
        const refTable = field.ref === 'user' ? 'users' : field.ref;
        foreignKeys.push(`FOREIGN KEY ("${key}") REFERENCES "${refTable}"(id)`);
      }
    });

    const fkPart = foreignKeys.length ? (',\n' + foreignKeys.join(',\n')) : '';
    const sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns.join(',\n')}${fkPart})`;

    try {
      db.exec(sql);
    } catch (e) {
      console.error(`[Database] Table creation failed for ${tableName}:`, e.message, '\nSQL:', sql);
      throw e;
    }
  }

  for (const spec of Object.values(specsToUse)) {
    if (!spec) continue;
    const searchFields = [];
    const tableName = spec.name === 'user' ? 'users' : spec.name;

    forEachField(spec, (key, field) => {
      if (field.type === 'ref' || field.sortable || field.search) {
        try {
          db.exec(`CREATE INDEX IF NOT EXISTS idx_${tableName}_${key} ON "${tableName}"("${key}")`);
        } catch (e) {
          console.error(`[Database] Index creation failed for ${tableName}.${key}:`, e.message);
        }
      }
      if (field.search || key === 'name' || key === 'description') searchFields.push(`"${key}"`);
    });

    if (searchFields.length > 0) {
      try {
        db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS ${tableName}_fts USING fts5(${searchFields.join(', ')}, content="${tableName}", content_rowid=id)`);
      } catch (e) {
        console.error(`[Database] FTS table creation failed for ${tableName}:`, e.message);
      }
    }
  }

  try {
    db.exec(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id))`);
  } catch (e) {
    console.error('[Database] Sessions table creation failed:', e.message);
    throw e;
  }

  try {
    db.exec(`CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      rfi_id TEXT,
      user_id TEXT,
      content TEXT,
      attachments TEXT,
      reactions TEXT DEFAULT '{}',
      mentions TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      FOREIGN KEY (rfi_id) REFERENCES rfi(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  } catch (e) {
    console.error('[Database] Chat messages table creation failed:', e.message);
  }

  try {
    db.exec(`CREATE TABLE IF NOT EXISTS chat_mentions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id TEXT,
      resolved BOOLEAN DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  } catch (e) {
    console.error('[Database] Chat mentions table creation failed:', e.message);
  }

  console.log('[Database] Migration complete');
};

let migrationComplete = false;
export const getDatabase = () => {
  if (!migrationComplete) {
    migrate();
    migrationComplete = true;
  }
  return db;
};

export const genId = () => nanoid();
export const now = () => Math.floor(Date.now() / 1000);
