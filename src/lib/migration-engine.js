import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { specs } from '@/config/spec-helpers';
// Fallback: import { } from '@/config/spec-helpers';
import { SQL_TYPES } from '@/config/constants';
import { forEachField } from './field-iterator';

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

export class MigrationEngine {
  constructor() {
    this.db = null;
    this.initDb();
    this.ensureMigrationsDir();
  }

  initDb() {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
  }

  ensureMigrationsDir() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }
  }

  initMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at INTEGER NOT NULL,
        hash TEXT
      )
    `);
  }

  createMigration(name, upSql, downSql) {
    const timestamp = Date.now();
    const id = `${timestamp}_${name}`;
    const filepath = path.join(MIGRATIONS_DIR, `${id}.js`);

    const content = `
export const up = (db) => {
  db.exec(\`${upSql}\`);
};

export const down = (db) => {
  db.exec(\`${downSql}\`);
};

export const name = '${name}';
`;
    fs.writeFileSync(filepath, content);
    return { id, name, filepath };
  }

  async migrate() {
    this.initMigrationsTable();
    this.createInitialMigration();
    await this.runPendingMigrations();
  }

  createInitialMigration() {
    const existing = this.db.prepare('SELECT * FROM migrations WHERE name = ?').get('initial');
    if (existing) return;

    const columns = [];
    const foreignKeys = [];

    for (const spec of Object.values(specs)) {
      forEachField(spec, (key, field) => {
        let col = `${key} ${SQL_TYPES[field.type] || 'TEXT'}`;
        if (field.required && field.type !== 'id') col += ' NOT NULL';
        if (field.unique) col += ' UNIQUE';
        if (field.default !== undefined) {
          col += ` DEFAULT ${typeof field.default === 'string' ? `'${field.default}'` : field.default}`;
        }
        columns.push(col);
        if (field.type === 'ref' && field.ref) {
          foreignKeys.push(`FOREIGN KEY (${key}) REFERENCES ${field.ref}s(id)`);
        }
      });

      const fkPart = foreignKeys.length ? ',\n' + foreignKeys.join(',\n') : '';
      const sql = `CREATE TABLE IF NOT EXISTS ${spec.name}s (${columns.join(',\n')}${fkPart})`;
      this.db.exec(sql);
      columns.length = 0;
      foreignKeys.length = 0;
    }

    for (const spec of Object.values(specs)) {
      forEachField(spec, (key, field) => {
        if (field.type === 'ref' || field.sortable || field.search) {
          try {
            this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${spec.name}s_${key} ON ${spec.name}s(${key})`);
          } catch (e) {
            console.error(`[Migration] Index creation failed for ${spec.name}s.${key}:`, e.message);
          }
        }
      });
    }

    this.db.prepare('INSERT INTO migrations (id, name, executed_at) VALUES (?, ?, ?)').run(
      'initial',
      'initial',
      Math.floor(Date.now() / 1000)
    );
  }

  async runPendingMigrations() {
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.js')).sort();
    for (const file) {
      const id = file.replace('.js', '');
      const existing = this.db.prepare('SELECT * FROM migrations WHERE id = ?').get(id);
      if (!existing) {
        const filePath = `file://${path.join(MIGRATIONS_DIR, file)}`;
        const migrationModule = await import(filePath);
        migrationModule.up(this.db);
        this.db.prepare('INSERT INTO migrations (id, name, executed_at) VALUES (?, ?, ?)').run(
          id,
          migrationModule.name,
          Math.floor(Date.now() / 1000)
        );
      }
    }
  }

  addColumn(tableName, columnName, columnDef) {
    const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`;
    this.db.exec(sql);
  }

  dropColumn(tableName, columnName) {
    const sql = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
    this.db.exec(sql);
  }

  renameColumn(tableName, oldName, newName) {
    const sql = `ALTER TABLE ${tableName} RENAME COLUMN ${oldName} TO ${newName}`;
    this.db.exec(sql);
  }

  createIndex(indexName, tableName, columns) {
    const sql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columns.join(', ')})`;
    this.db.exec(sql);
  }

  dropIndex(indexName) {
    this.db.exec(`DROP INDEX IF EXISTS ${indexName}`);
  }

  getExecutedMigrations() {
    return this.db.prepare('SELECT * FROM migrations ORDER BY executed_at').all();
  }
}

export const migrationEngine = new MigrationEngine();
