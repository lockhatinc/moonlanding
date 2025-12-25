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

  // If specs object is empty, populate it from ConfigEngine
  const specsToUse = Object.keys(specs).length > 0 ? specs : (() => {
    try {
      const { getConfigEngineSync } = require('@/lib/config-generator-engine');
      const engine = getConfigEngineSync();
      const allSpecs = {};
      for (const entityName of engine.getAllEntities()) {
        allSpecs[entityName] = engine.generateEntitySpec(entityName);
      }
      return allSpecs;
    } catch (e) {
      console.error('[Database] Failed to get specs from ConfigEngine during migration:', e.message);
      return specs; // Fall back to empty specs
    }
  })();

  for (const spec of Object.values(specsToUse)) {
    if (!spec) continue;
    const columns = [];
    const foreignKeys = [];
    // Lucia expects 'users' table for the 'user' entity
    const tableName = spec.name === 'user' ? 'users' : spec.name;
    if (spec.name === 'user') {
      console.error('[Database] User spec fields:', Object.keys(spec.fields || {}));
    }
    forEachField(spec, (key, field) => {
      let col = `"${key}" ${SQL_TYPES[field.type] || 'TEXT'}`;
      if (field.required && field.type !== 'id') col += ' NOT NULL';
      if (field.unique) col += ' UNIQUE';
      if (field.default !== undefined) {
        // Only add DEFAULT for simple scalar values
        if (typeof field.default === 'string' || typeof field.default === 'number' || typeof field.default === 'boolean') {
          const defaultVal = typeof field.default === 'string' ? `'${field.default.replace(/'/g, "''")}'` : field.default;
          col += ` DEFAULT ${defaultVal}`;
        }
        // Skip defaults for complex types like arrays/objects
      }
      columns.push(col);
      if (field.type === 'ref' && field.ref) {
        // Lucia expects 'users' table for the 'user' entity
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
    if (!spec) continue; // Skip undefined specs
    const searchFields = [];
    // Lucia expects 'users' table for the 'user' entity
    const tableName = spec.name === 'user' ? 'users' : spec.name;
    forEachField(spec, (key, field) => {
      if (field.type === 'ref' || field.sortable || field.search) {
        try { db.exec(`CREATE INDEX IF NOT EXISTS idx_${tableName}_${key} ON "${tableName}"("${key}")`); } catch (e) {
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
};
