import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { specs } from '@/config/spec-helpers';

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(DB_PATH);

const backupDir = path.join(process.cwd(), 'data', 'backups');
const VALID_TABLES = new Set(Object.values(specs).map(s => `${s.name}s`));

function validateTableName(tableName) {
  if (!VALID_TABLES.has(tableName)) {
    throw new Error(`Invalid table: ${tableName}`);
  }
  return tableName;
}

function validateColumnNames(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('Invalid columns');
  }
  return columns.every(c => /^[a-z_][a-z0-9_]*$/i.test(c));
}

export async function exportDatabase() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`);

  const backup = {
    timestamp,
    version: '1.0',
    tables: {},
  };

  for (const spec of Object.values(specs)) {
    const tableName = `${spec.name}s`;
    try {
      const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
      backup.tables[tableName] = rows;
    } catch (error) {
      console.error(`[BACKUP] Failed to export ${tableName}:`, error.message);
    }
  }

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  await cleanupOldBackups(30);

  return backupPath;
}

export async function importDatabase(backupPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  for (const [tableName, rows] of Object.entries(backup.tables)) {
    if (!rows || rows.length === 0) continue;

    try {
      validateTableName(tableName);

      db.prepare(`DELETE FROM "${tableName}"`).run();

      const columns = Object.keys(rows[0]);
      if (!validateColumnNames(columns)) {
        throw new Error(`Invalid column names in ${tableName}`);
      }

      const placeholders = columns.map(() => '?').join(', ');
      const columnList = columns.map(c => `"${c}"`).join(', ');
      const stmt = db.prepare(`INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`);

      for (const row of rows) {
        stmt.run(...columns.map(col => row[col]));
      }
    } catch (error) {
      console.error(`[BACKUP] Failed to restore ${tableName}:`, error.message);
    }
  }
}

function listBackups() {
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  return fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .map(f => {
      const stat = fs.statSync(path.join(backupDir, f));
      return {
        filename: f,
        path: path.join(backupDir, f),
        size: stat.size,
        created: stat.birthtime,
      };
    })
    .sort((a, b) => b.created - a.created);
}

async function cleanupOldBackups(keepCount = 30) {
  const backups = listBackups();

  if (backups.length <= keepCount) return;

  const toDelete = backups.slice(keepCount);
  for (const backup of toDelete) {
    try {
      fs.unlinkSync(backup.path);
    } catch (error) {
      console.error(`${LOG_PREFIXES.system} Failed to delete ${backup.filename}:`, error.message);
    }
  }
}

function getLatestBackup() {
  const backups = listBackups();
  return backups.length > 0 ? backups[0] : null;
}

function exportTables(tableNames) {
  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    tables: {},
  };

  for (const tableName of tableNames) {
    try {
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
      backup.tables[tableName] = rows;
    } catch (error) {
      console.error(`${LOG_PREFIXES.system} Failed to export ${tableName}:`, error.message);
    }
  }

  return backup;
}
