#!/usr/bin/env node
/**
 * Phase 3: Complete Data Migration
 * Migrates 100K-230K records from Friday-staging + MyWorkReview-staging (Firebase)
 * to Moonlanding (SQLite)
 *
 * EXECUTION: node migration.js --phase 1 --source friday|mwr --target moonlanding
 *
 * Import migration modules:
 * - UserDeduplicator (user-dedup.js)
 * - Transformers (transformers.js)
 * - Validators (validators.js)
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  fridayPath: '/home/user/lexco/friday-staging',
  mwrPath: '/home/user/lexco/myworkreview-staging',
  moonlandingPath: '/home/user/lexco/moonlanding',
  dbPath: path.resolve('/home/user/lexco/moonlanding/data/app.db'),
  backupPath: path.resolve('/home/user/lexco/moonlanding/data/backups'),
  logsPath: path.resolve('/home/user/lexco/moonlanding/data/migration-logs'),
};

// Ensure backup and log directories exist
[CONFIG.backupPath, CONFIG.logsPath].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Logger
class MigrationLogger {
  constructor(phase) {
    this.phase = phase;
    this.timestamp = new Date().toISOString();
    this.logFile = path.join(CONFIG.logsPath, `phase-${phase}-${Date.now()}.log`);
    this.errors = [];
    this.warnings = [];
    this.stats = {};
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(this.logFile, logLine + '\n');
  }

  error(message, err = null) {
    this.log(`ERROR: ${message}${err ? ' - ' + err.message : ''}`, 'ERROR');
    this.errors.push({ message, error: err?.message, stack: err?.stack });
  }

  warn(message) {
    this.log(`WARNING: ${message}`, 'WARN');
    this.warnings.push(message);
  }

  recordStat(entity, count) {
    this.stats[entity] = count;
  }

  summary() {
    return {
      phase: this.phase,
      timestamp: this.timestamp,
      logFile: this.logFile,
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
    };
  }
}

// Database Utility
class DatabaseUtil {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  connect() {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('busy_timeout = 5000');
      this.db.pragma('foreign_keys = ON');
      return true;
    } catch (err) {
      throw new Error(`Failed to connect to database: ${err.message}`);
    }
  }

  getTableSchema(tableName) {
    try {
      const info = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      return info;
    } catch (err) {
      return null;
    }
  }

  getAllTables() {
    return this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  }

  getRecordCount(tableName) {
    try {
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      return result?.count || 0;
    } catch (err) {
      return null;
    }
  }

  backup(label) {
    const backupName = `app-${label}-${Date.now()}.db`;
    const backupPath = path.join(CONFIG.backupPath, backupName);
    try {
      fs.copyFileSync(this.dbPath, backupPath);
      return backupPath;
    } catch (err) {
      throw new Error(`Backup failed: ${err.message}`);
    }
  }

  execute(sql, params = []) {
    try {
      return this.db.prepare(sql).run(...params);
    } catch (err) {
      throw new Error(`SQL execution failed: ${err.message}`);
    }
  }

  query(sql, params = []) {
    try {
      return this.db.prepare(sql).all(...params);
    } catch (err) {
      throw new Error(`SQL query failed: ${err.message}`);
    }
  }

  beginTransaction() {
    this.db.exec('BEGIN TRANSACTION');
  }

  commit() {
    this.db.exec('COMMIT');
  }

  rollback() {
    this.db.exec('ROLLBACK');
  }

  close() {
    if (this.db) this.db.close();
  }
}

// Phase 1: Schema Analysis
async function phase1SchemaAnalysis(logger) {
  logger.log('===== PHASE 3.1: SCHEMA ANALYSIS STARTED =====');

  try {
    // Connect to Moonlanding database
    const dbUtil = new DatabaseUtil(CONFIG.dbPath);
    dbUtil.connect();

    // Get all tables and their schemas
    const tables = dbUtil.getAllTables();
    logger.log(`Found ${tables.length} tables in Moonlanding SQLite`);

    const schema = {};
    for (const table of tables) {
      const columns = dbUtil.getTableSchema(table);
      const count = dbUtil.getRecordCount(table);
      schema[table] = {
        columns: columns,
        recordCount: count,
        columnCount: columns?.length || 0,
      };
      logger.log(`  Table: ${table} - ${count} records, ${columns?.length || 0} columns`);
      logger.recordStat(table, count);
    }

    // Save schema analysis
    const schemaFile = path.join(CONFIG.logsPath, `schema-analysis-${Date.now()}.json`);
    fs.writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
    logger.log(`Schema analysis saved to: ${schemaFile}`);

    dbUtil.close();

    logger.log('===== PHASE 3.1: SCHEMA ANALYSIS COMPLETED =====');
    return schema;
  } catch (err) {
    logger.error('Schema analysis failed', err);
    throw err;
  }
}

// Phase 2: Source System Analysis
async function phase2SourceAnalysis(logger) {
  logger.log('===== PHASE 3.2: SOURCE SYSTEM ANALYSIS STARTED =====');

  try {
    // Analyze Friday-staging structure
    logger.log('Analyzing Friday-staging directory structure...');
    const fridayStructure = analyzeFirebaseStructure(CONFIG.fridayPath);
    logger.log(`  Friday collections found: ${fridayStructure.collections.length}`);

    // Analyze MyWorkReview-staging structure
    logger.log('Analyzing MyWorkReview-staging directory structure...');
    const mwrStructure = analyzeFirebaseStructure(CONFIG.mwrPath);
    logger.log(`  MWR collections found: ${mwrStructure.collections.length}`);

    // Save analysis
    const analysisFile = path.join(CONFIG.logsPath, `source-analysis-${Date.now()}.json`);
    fs.writeFileSync(analysisFile, JSON.stringify({
      friday: fridayStructure,
      mwr: mwrStructure,
    }, null, 2));
    logger.log(`Source analysis saved to: ${analysisFile}`);

    logger.log('===== PHASE 3.2: SOURCE SYSTEM ANALYSIS COMPLETED =====');
    return { friday: fridayStructure, mwr: mwrStructure };
  } catch (err) {
    logger.error('Source analysis failed', err);
    throw err;
  }
}

// Helper: Analyze Firebase directory structure
function analyzeFirebaseStructure(basePath) {
  const collections = [];

  try {
    if (!fs.existsSync(basePath)) {
      return { collections, directoryExists: false };
    }

    const items = fs.readdirSync(basePath);
    items.forEach(item => {
      const fullPath = path.join(basePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        collections.push({
          name: item,
          path: fullPath,
          isDirectory: true,
        });
      }
    });
  } catch (err) {
    // Handle permission errors gracefully
  }

  return {
    collections,
    basePath,
    directoryExists: true,
  };
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const phase = args.includes('--phase') ? args[args.indexOf('--phase') + 1] : '1';
  const backupLabel = `pre-phase-${phase}`;

  const logger = new MigrationLogger(phase);

  logger.log('===== MOONLANDING PHASE 3 DATA MIGRATION =====');
  logger.log(`Starting Phase 3.${phase}`);
  logger.log(`Node: ${process.version}`);
  logger.log(`Database: ${CONFIG.dbPath}`);

  try {
    // Phase 1: Schema Analysis
    if (phase === '1' || phase === 'all') {
      const schema = await phase1SchemaAnalysis(logger);
      const summary = logger.summary();
      console.log('\nPhase 1 Summary:', JSON.stringify(summary, null, 2));
      fs.writeFileSync(
        path.join(CONFIG.logsPath, `phase-1-summary-${Date.now()}.json`),
        JSON.stringify(summary, null, 2)
      );
    }

    // Phase 2: Source System Analysis
    if (phase === '2' || phase === 'all') {
      const sourceAnalysis = await phase2SourceAnalysis(logger);
      const summary = logger.summary();
      console.log('\nPhase 2 Summary:', JSON.stringify(summary, null, 2));
      fs.writeFileSync(
        path.join(CONFIG.logsPath, `phase-2-summary-${Date.now()}.json`),
        JSON.stringify(summary, null, 2)
      );
    }

    logger.log(`===== PHASE 3.${phase} COMPLETED =====`);
    console.log('\nMigration Summary:', logger.summary());

  } catch (error) {
    logger.error('Migration failed', error);
    console.error('\nFATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MigrationLogger, DatabaseUtil, phase1SchemaAnalysis, phase2SourceAnalysis };
