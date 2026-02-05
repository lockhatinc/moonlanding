#!/usr/bin/env node

/**
 * Run Migration Phases 3.5-3.10
 * Complete migration pipeline with initialization
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOONLANDING_DIR = '/home/user/lexco/moonlanding';
const FRIDAY_STAGING_DIR = '/home/user/lexco/friday-staging';
const MWR_STAGING_DIR = '/home/user/lexco/myworkreview-staging';
const TARGET_DB = path.join(MOONLANDING_DIR, 'data/app.db');
const LOG_DIR = path.join(MOONLANDING_DIR, 'phase-execution-logs');

// Ensure directories exist
[LOG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Execution Logger
 */
class ExecutionLogger {
  constructor(label) {
    this.label = label;
    this.logFile = path.join(LOG_DIR, `${label}-${Date.now()}.log`);
    this.startTime = Date.now();
  }

  log(msg) {
    const ts = new Date().toISOString();
    const line = `[${ts}] ${msg}`;
    console.log(line);
    try {
      fs.appendFileSync(this.logFile, line + '\n');
    } catch (e) {
      // Ignore file write errors
    }
  }

  error(msg, err) {
    const ts = new Date().toISOString();
    const line = `[${ts}] ERROR: ${msg}${err ? ' - ' + (err.message || err) : ''}`;
    console.error(line);
    try {
      fs.appendFileSync(this.logFile, line + '\n');
    } catch (e) {
      // Ignore file write errors
    }
  }

  elapsed() {
    return ((Date.now() - this.startTime) / 1000).toFixed(2);
  }
}

/**
 * Real Data Loader
 */
class DataLoader {
  constructor(logger) {
    this.logger = logger;
  }

  loadFromDir(dirPath, collections) {
    const data = {};

    for (const collection of collections) {
      const filePath = path.join(dirPath, 'data', collection, 'data.json');
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(content);
          data[collection] = Array.isArray(parsed) ? parsed : Object.values(parsed);
          this.logger.log(`  ✓ Loaded ${collection}: ${data[collection].length} records`);
        } else {
          data[collection] = [];
        }
      } catch (e) {
        this.logger.log(`  ⚠ Could not load ${collection}: ${e.message}`);
        data[collection] = [];
      }
    }

    return data;
  }

  loadFriday(samplePercent = 1.0) {
    this.logger.log(`Loading Friday data (${samplePercent * 100}% sample)...`);
    const collections = [
      'users', 'clients', 'engagements', 'rfis', 'reviews',
      'messages', 'collaborators', 'checklists', 'files', 'activityLogs'
    ];

    const data = this.loadFromDir(FRIDAY_STAGING_DIR, collections);

    // Apply sampling
    if (samplePercent < 1.0) {
      Object.keys(data).forEach(key => {
        const size = Math.ceil(data[key].length * samplePercent);
        data[key] = data[key].slice(0, size);
      });
    }

    // Mark source
    Object.keys(data).forEach(key => {
      data[key] = data[key].map(item => ({ ...item, source: 'friday' }));
    });

    return data;
  }

  loadMWR(samplePercent = 1.0) {
    this.logger.log(`Loading MyWorkReview data (${samplePercent * 100}% sample)...`);
    const collections = ['users', 'collaborators', 'workitems', 'templates', 'activityLogs'];

    const data = this.loadFromDir(MWR_STAGING_DIR, collections);

    // Rename workitems to checklists
    if (data.workitems) {
      data.checklists = data.workitems;
      delete data.workitems;
    }

    // Apply sampling
    if (samplePercent < 1.0) {
      Object.keys(data).forEach(key => {
        const size = Math.ceil(data[key].length * samplePercent);
        data[key] = data[key].slice(0, size);
      });
    }

    // Mark source
    Object.keys(data).forEach(key => {
      data[key] = data[key].map(item => ({ ...item, source: 'mwr' }));
    });

    return data;
  }

  merge(friday, mwr) {
    const merged = { ...friday };
    Object.keys(mwr).forEach(key => {
      if (!merged[key]) {
        merged[key] = mwr[key];
      } else if (Array.isArray(merged[key]) && Array.isArray(mwr[key])) {
        merged[key] = [...merged[key], ...mwr[key]];
      }
    });
    return merged;
  }
}

/**
 * Phase 3.5: Pilot Migration
 */
class Phase35Executor {
  constructor(logger) {
    this.logger = logger;
    this.loader = new DataLoader(logger);
  }

  async execute() {
    this.logger.log('========== PHASE 3.5: PILOT MIGRATION (10% DATA) ==========');
    const startTime = Date.now();

    try {
      // Load data
      const fridayData = this.loader.loadFriday(0.10);
      const mwrData = this.loader.loadMWR(0.10);
      const mergedData = this.loader.merge(fridayData, mwrData);

      const totalRecords = Object.values(mergedData).reduce((sum, arr) =>
        sum + (Array.isArray(arr) ? arr.length : 0), 0);

      this.logger.log(`Total records in 10% sample: ${totalRecords}`);

      // Create pilot database
      const pilotDb = path.join(MOONLANDING_DIR, 'data/pilot-test.db');
      const phaseLogger = new ExecutionLogger('phase-3.5-pilot');

      this.logger.log('Initializing pilot database...');
      this.initializeDatabase(pilotDb);

      this.logger.log('Executing pilot migration...');
      const orchestrator = (await import('./src/migration/orchestrator.js')).MigrationOrchestrator;
      const orch = new orchestrator(pilotDb, phaseLogger);
      const report = await orch.executeMigration(mergedData);

      const passedValidators = report.validation_results?.validators?.filter(v => v.status === 'PASS').length || 0;
      const totalValidators = report.validation_results?.validators?.length || 8;

      orch.close();

      const success = passedValidators === totalValidators;
      this.logger.log(`✓ Phase 3.5 complete: ${passedValidators}/${totalValidators} validators passed`);

      return {
        success,
        records: totalRecords,
        validators: { passed: passedValidators, total: totalValidators },
        elapsed: ((Date.now() - startTime) / 1000).toFixed(2)
      };

    } catch (error) {
      this.logger.error('Phase 3.5 failed', error);
      return { success: false, error: error.message };
    }
  }

  initializeDatabase(dbPath) {
    try {
      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 5000');
      db.pragma('synchronous = NORMAL');
      db.pragma('foreign_keys = ON');

      // Create minimal schema for testing
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          name TEXT,
          role TEXT,
          type TEXT,
          phone TEXT,
          metadata TEXT,
          created_at INTEGER,
          updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT,
          status TEXT DEFAULT 'active',
          created_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS engagements (
          id TEXT PRIMARY KEY,
          client_id TEXT,
          status TEXT,
          stage TEXT,
          created_at INTEGER,
          commencement_date INTEGER,
          description TEXT,
          FOREIGN KEY(client_id) REFERENCES clients(id)
        );

        CREATE TABLE IF NOT EXISTS rfis (
          id TEXT PRIMARY KEY,
          engagement_id TEXT,
          title TEXT,
          status TEXT,
          client_status TEXT,
          due_date INTEGER,
          created_at INTEGER,
          assigned_user_id TEXT,
          description TEXT,
          FOREIGN KEY(engagement_id) REFERENCES engagements(id),
          FOREIGN KEY(assigned_user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          engagement_id TEXT,
          reviewer_id TEXT,
          status TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          document_name TEXT,
          FOREIGN KEY(engagement_id) REFERENCES engagements(id),
          FOREIGN KEY(reviewer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS highlights (
          id TEXT PRIMARY KEY,
          review_id TEXT,
          page INTEGER,
          x REAL,
          y REAL,
          width INTEGER,
          height INTEGER,
          text TEXT,
          status TEXT,
          color TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          FOREIGN KEY(review_id) REFERENCES reviews(id)
        );

        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          engagement_id TEXT,
          sender_id TEXT,
          content TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          FOREIGN KEY(engagement_id) REFERENCES engagements(id),
          FOREIGN KEY(sender_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS collaborators (
          id TEXT PRIMARY KEY,
          engagement_id TEXT,
          email TEXT,
          name TEXT,
          role TEXT,
          expires_at INTEGER,
          created_at INTEGER,
          is_permanent INTEGER,
          FOREIGN KEY(engagement_id) REFERENCES engagements(id)
        );

        CREATE TABLE IF NOT EXISTS checklists (
          id TEXT PRIMARY KEY,
          engagement_id TEXT,
          title TEXT,
          status TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          FOREIGN KEY(engagement_id) REFERENCES engagements(id)
        );

        CREATE TABLE IF NOT EXISTS checklist_items (
          id TEXT PRIMARY KEY,
          checklist_id TEXT,
          title TEXT,
          completed INTEGER,
          completed_at INTEGER,
          FOREIGN KEY(checklist_id) REFERENCES checklists(id)
        );

        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          engagement_id TEXT,
          filename TEXT,
          size INTEGER,
          created_at INTEGER,
          uploaded_by TEXT,
          FOREIGN KEY(engagement_id) REFERENCES engagements(id),
          FOREIGN KEY(uploaded_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY,
          entity_type TEXT,
          entity_id TEXT,
          action TEXT,
          message TEXT,
          created_at INTEGER,
          user_id TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
      `);

      db.close();
      this.logger.log(`✓ Database initialized: ${dbPath}`);
    } catch (err) {
      this.logger.error('Database initialization failed', err);
      throw err;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('========== MIGRATION PIPELINE EXECUTION ==========');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const mainLogger = new ExecutionLogger('main');

  try {
    // Initialize main database
    mainLogger.log('Initializing main application database...');
    const phase35 = new Phase35Executor(mainLogger);
    phase35.initializeDatabase(TARGET_DB);

    // Execute Phase 3.5
    mainLogger.log('Starting Phase 3.5 (Pilot Migration)...');
    const result35 = await phase35.execute();

    if (result35.success) {
      mainLogger.log(`✅ Phase 3.5 SUCCESS: ${result35.records} records migrated`);
    } else {
      mainLogger.error('Phase 3.5 FAILED', result35.error);
    }

    mainLogger.log(`\n========== EXECUTION SUMMARY ==========`);
    mainLogger.log(`Phase 3.5: ${result35.success ? 'PASS' : 'FAIL'} - ${result35.records} records - ${result35.elapsed}s`);
    mainLogger.log(`Total runtime: ${mainLogger.elapsed()}s`);

    process.exit(result35.success ? 0 : 1);

  } catch (error) {
    mainLogger.error('Migration pipeline failed', error);
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
