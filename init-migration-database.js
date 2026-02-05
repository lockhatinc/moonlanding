#!/usr/bin/env node

/**
 * Database Initialization for Migration Pipeline
 * Initializes the schema before running migrations
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import configuration and schema builders
async function initializeDatabase(dbPath) {
  console.log(`\n📊 Initializing database: ${dbPath}`);

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create/open database
  const db = new Database(dbPath);

  // Set pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  try {
    // Initialize ConfigEngine and get specs
    const { getConfigEngineSync } = await import('./src/lib/config-generator-engine.js');
    const engine = getConfigEngineSync();

    // Get all specs
    const specs = {};
    for (const entityName of engine.getAllEntities()) {
      specs[entityName] = engine.generateEntitySpec(entityName);
    }

    console.log(`  Found ${Object.keys(specs).length} entities to initialize`);

    // SQL type mapping
    const SQL_TYPES = {
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

    // Create tables
    for (const spec of Object.values(specs)) {
      if (!spec || !spec.fields) continue;

      const columns = [];
      const foreignKeys = [];
      const tableName = spec.name === 'user' ? 'users' : spec.name;

      // Add columns
      for (const [fieldKey, field] of Object.entries(spec.fields)) {
        let col = `"${fieldKey}" ${SQL_TYPES[field.type] || 'TEXT'}`;
        if (field.required && field.type !== 'id') col += ' NOT NULL';
        if (field.unique) col += ' UNIQUE';
        if (field.default !== undefined) {
          const defaultVal = typeof field.default === 'string'
            ? `'${field.default.replace(/'/g, "''")}'`
            : field.default;
          col += ` DEFAULT ${defaultVal}`;
        }
        columns.push(col);

        // Track foreign keys
        if (field.type === 'ref' && field.ref) {
          const refTable = field.ref === 'user' ? 'users' : field.ref;
          foreignKeys.push(`FOREIGN KEY ("${fieldKey}") REFERENCES "${refTable}"(id)`);
        }
      }

      // Build and execute CREATE TABLE
      const fkPart = foreignKeys.length ? (',\n' + foreignKeys.join(',\n')) : '';
      const sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns.join(',\n')}${fkPart})`;

      try {
        db.exec(sql);
        console.log(`  ✓ ${tableName}`);
      } catch (err) {
        console.error(`  ✗ ${tableName}: ${err.message}`);
        throw err;
      }
    }

    console.log('✅ Database initialization complete');
    db.close();
    return true;

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    db.close();
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('========== DATABASE INITIALIZATION ==========');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Initialize Moonlanding database
    const appDbPath = path.join(process.cwd(), 'data/app.db');
    await initializeDatabase(appDbPath);

    // Initialize pilot test database
    const pilotDbPath = path.join(process.cwd(), 'data/pilot-test.db');
    await initializeDatabase(pilotDbPath);

    console.log('\n✅ All databases initialized and ready for migration');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    process.exit(1);
  }
}

main();
