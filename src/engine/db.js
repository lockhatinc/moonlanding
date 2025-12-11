import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Type to SQLite mapping
const typeMap = {
  id: 'TEXT PRIMARY KEY',
  text: 'TEXT',
  textarea: 'TEXT',
  email: 'TEXT',
  int: 'INTEGER',
  decimal: 'REAL',
  bool: 'INTEGER',
  date: 'INTEGER',
  timestamp: 'INTEGER',
  json: 'TEXT',
  image: 'TEXT',
  ref: 'TEXT',
  enum: 'TEXT',
};

// Auto-migrate: create/update tables from specs
export function migrate(specs) {
  // Create sessions table for Lucia auth
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  for (const spec of Object.values(specs)) {
    const columns = [];
    const foreignKeys = [];

    for (const [key, field] of Object.entries(spec.fields)) {
      let col = `${key} ${typeMap[field.type] || 'TEXT'}`;

      if (field.required && field.type !== 'id') col += ' NOT NULL';
      if (field.unique) col += ' UNIQUE';
      if (field.default !== undefined) {
        const def = typeof field.default === 'string' ? `'${field.default}'` : field.default;
        col += ` DEFAULT ${def}`;
      }

      columns.push(col);

      if (field.type === 'ref' && field.ref) {
        foreignKeys.push(`FOREIGN KEY (${key}) REFERENCES ${field.ref}s(id)`);
      }
    }

    // Handle composite primary key
    if (spec.primaryKey) {
      const pkCols = columns.filter(c => !c.includes('PRIMARY KEY'));
      const fkPart = foreignKeys.length ? foreignKeys.join(',\n        ') + ',' : '';
      const sql = `CREATE TABLE IF NOT EXISTS ${spec.name}s (
        ${pkCols.join(',\n        ')},
        ${fkPart}
        PRIMARY KEY (${spec.primaryKey.join(', ')})
      )`;
      db.exec(sql);
    } else {
      const fkPart = foreignKeys.length ? ',\n        ' + foreignKeys.join(',\n        ') : '';
      const sql = `CREATE TABLE IF NOT EXISTS ${spec.name}s (
        ${columns.join(',\n        ')}${fkPart}
      )`;
      db.exec(sql);
    }
  }

  // Create indexes
  for (const spec of Object.values(specs)) {
    for (const [key, field] of Object.entries(spec.fields)) {
      if (field.type === 'ref' || field.sortable || field.search) {
        const idxName = `idx_${spec.name}s_${key}`;
        try {
          db.exec(`CREATE INDEX IF NOT EXISTS ${idxName} ON ${spec.name}s(${key})`);
        } catch (e) {
          // Index might already exist, ignore
        }
      }
    }
  }
}

export default db;

// Helper: generate ID
export function genId() {
  return nanoid();
}

// Helper: current timestamp
export function now() {
  return Math.floor(Date.now() / 1000);
}

// Helper: check if table exists
export function tableExists(tableName) {
  const result = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tableName);
  return !!result;
}

// Helper: get table info
export function getTableInfo(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all();
}
