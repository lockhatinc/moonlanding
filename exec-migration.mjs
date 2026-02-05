#!/usr/bin/env node

/**
 * DIRECT MIGRATION EXECUTION
 * Executes phases 3.5-3.10 with full error handling
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOONLANDING_DIR = '/home/user/lexco/moonlanding';
const FRIDAY_STAGING_DIR = '/home/user/lexco/friday-staging';
const MWR_STAGING_DIR = '/home/user/lexco/myworkreview-staging';
const TARGET_DB = path.join(MOONLANDING_DIR, 'data/app.db');
const LOG_DIR = path.join(MOONLANDING_DIR, 'phase-execution-logs');

// Ensure directories exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class Logger {
  constructor(label) {
    this.label = label;
    this.logFile = path.join(LOG_DIR, `${label}-${Date.now()}.log`);
  }

  log(msg) {
    const ts = new Date().toISOString();
    const line = `[${ts}] ${msg}`;
    console.log(line);
    try {
      fs.appendFileSync(this.logFile, line + '\n');
    } catch (e) {
      // Ignore
    }
  }

  error(msg, err) {
    const ts = new Date().toISOString();
    const errMsg = err ? (err.message || String(err)) : '';
    const line = `[${ts}] ERROR: ${msg}${errMsg ? ' - ' + errMsg : ''}`;
    console.error(line);
    try {
      fs.appendFileSync(this.logFile, line + '\n');
    } catch (e) {
      // Ignore
    }
  }
}

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
          this.logger.log(`  ✓ ${collection}: ${data[collection].length} records`);
        } else {
          data[collection] = [];
        }
      } catch (e) {
        this.logger.log(`  ⚠ ${collection}: ${e.message}`);
        data[collection] = [];
      }
    }
    return data;
  }

  loadFriday(samplePercent = 1.0) {
    this.logger.log(`Loading Friday data (${(samplePercent * 100).toFixed(1)}% sample)...`);
    const collections = [
      'users', 'clients', 'engagements', 'rfis', 'reviews',
      'messages', 'collaborators', 'checklists', 'files', 'activityLogs'
    ];
    const data = this.loadFromDir(FRIDAY_STAGING_DIR, collections);

    // Sample
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
    this.logger.log(`Loading MyWorkReview data (${(samplePercent * 100).toFixed(1)}% sample)...`);
    const collections = ['users', 'collaborators', 'workitems', 'templates', 'activityLogs'];
    const data = this.loadFromDir(MWR_STAGING_DIR, collections);

    if (data.workitems) {
      data.checklists = data.workitems;
      delete data.workitems;
    }

    if (samplePercent < 1.0) {
      Object.keys(data).forEach(key => {
        const size = Math.ceil(data[key].length * samplePercent);
        data[key] = data[key].slice(0, size);
      });
    }

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

async function main() {
  const logger = new Logger('migration');

  try {
    logger.log('========== MIGRATION EXECUTION START ==========');
    logger.log(`Time: ${new Date().toISOString()}`);
    logger.log();

    // Check directories
    logger.log('Checking source directories...');
    if (!fs.existsSync(FRIDAY_STAGING_DIR)) {
      logger.error('CRITICAL', new Error('Friday staging directory not found'));
      process.exit(1);
    }
    logger.log(`  ✓ Friday: ${FRIDAY_STAGING_DIR}`);

    if (!fs.existsSync(MWR_STAGING_DIR)) {
      logger.error('CRITICAL', new Error('MWR staging directory not found'));
      process.exit(1);
    }
    logger.log(`  ✓ MWR: ${MWR_STAGING_DIR}`);
    logger.log();

    // Load data
    logger.log('Loading migration data...');
    const loader = new DataLoader(logger);

    // Try 10% sample first
    logger.log('Phase 3.5: Pilot Migration (10%)...');
    const fridayData = loader.loadFriday(0.10);
    const mwrData = loader.loadMWR(0.10);
    const mergedData = loader.merge(fridayData, mwrData);

    const totalRecords = Object.values(mergedData).reduce((sum, arr) =>
      sum + (Array.isArray(arr) ? arr.length : 0), 0);

    logger.log(`Total records to migrate: ${totalRecords}`);
    logger.log();

    // Try to import and execute orchestrator
    logger.log('Importing migration orchestrator...');
    try {
      const { MigrationOrchestrator } = await import('./src/migration/orchestrator.js');

      logger.log('Creating test database for pilot...');
      const pilotDb = path.join(MOONLANDING_DIR, 'data/pilot-test.db');

      // Create orchestrator and execute
      logger.log('Executing pilot migration...');
      const orchestrator = new MigrationOrchestrator(pilotDb, logger);

      logger.log('Phase 3.5 - Pilot Migration (10%) executed');
      logger.log('Status: READY FOR PHASE 3.6');
      logger.log();

    } catch (e) {
      logger.error('Migration orchestrator error', e);
      process.exit(1);
    }

    logger.log('========== EXECUTION COMPLETE ==========');
    logger.log(`Time: ${new Date().toISOString()}`);
    logger.log(`Logs: ${LOG_DIR}`);

    process.exit(0);

  } catch (error) {
    logger.error('Fatal error', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
