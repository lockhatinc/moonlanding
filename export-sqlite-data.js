#!/usr/bin/env node

/**
 * SQLite Data Export Script
 * Exports data from Friday SQLite database to JSON format
 * for the migration pipeline
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRIDAY_DB = '/home/user/lexco/friday-staging/.vexify.db';
const FRIDAY_STAGING_DIR = '/home/user/lexco/friday-staging';

/**
 * Export all tables from SQLite database to JSON
 */
function exportSQLiteToJSON(dbPath, outputDir, projectName) {
  console.log(`\n📤 Exporting ${projectName} SQLite data...`);

  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found: ${dbPath}`);
    return false;
  }

  try {
    const db = new Database(dbPath, { readonly: true });

    // Get all table names
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();

    console.log(`Found ${tables.length} tables`);

    // Map Friday table names to our schema
    const tableMapping = {
      'users': 'users',
      'clients': 'clients',
      'engagements': 'engagements',
      'rfis': 'rfis',
      'rfi_questions': 'rfi_questions',
      'rfi_responses': 'rfi_responses',
      'reviews': 'reviews',
      'highlights': 'highlights',
      'messages': 'messages',
      'collaborators': 'collaborators',
      'checklists': 'checklists',
      'checklist_items': 'checklist_items',
      'files': 'files',
      'activity_logs': 'activity_logs',
    };

    // Export each table
    for (const table of tables) {
      const tableName = table.name;
      const exportName = tableMapping[tableName] || tableName;

      try {
        const rows = db.prepare(`SELECT * FROM ${tableName}`).all();

        if (rows.length > 0) {
          const collectionDir = path.join(outputDir, 'data', exportName);
          fs.mkdirSync(collectionDir, { recursive: true });

          const outputFile = path.join(collectionDir, 'data.json');
          fs.writeFileSync(outputFile, JSON.stringify(rows, null, 2));
          console.log(`  ✓ ${exportName}: ${rows.length} records`);
        }
      } catch (e) {
        console.log(`  ⚠ ${tableName}: ${e.message}`);
      }
    }

    db.close();
    console.log(`✅ ${projectName} export complete`);
    return true;

  } catch (error) {
    console.error(`❌ Export failed: ${error.message}`);
    return false;
  }
}

/**
 * Create sample MyWorkReview data
 */
function createSampleMWRData(outputDir) {
  console.log(`\n📝 Creating sample MyWorkReview data...`);

  const collections = ['users', 'collaborators', 'workitems', 'templates', 'activityLogs'];

  try {
    for (const collection of collections) {
      const collectionDir = path.join(outputDir, 'data', collection);
      fs.mkdirSync(collectionDir, { recursive: true });

      let sampleData = [];

      if (collection === 'users') {
        sampleData = [
          { id: 'mwr-user-1', email: 'alice@example.com', name: 'Alice Manager', role: 'manager', status: 'active' },
          { id: 'mwr-user-2', email: 'bob@example.com', name: 'Bob Clerk', role: 'clerk', status: 'active' },
        ];
      } else if (collection === 'collaborators') {
        sampleData = [
          { id: 'mwr-collab-1', user_id: 'mwr-user-1', role: 'editor', expires_at: Math.floor(Date.now() / 1000) + 7776000 },
        ];
      } else if (collection === 'workitems') {
        sampleData = [
          { id: 'mwr-item-1', title: 'Sample Workitem', status: 'active', created_at: Math.floor(Date.now() / 1000) },
        ];
      } else if (collection === 'templates') {
        sampleData = [];
      } else if (collection === 'activityLogs') {
        sampleData = [];
      }

      const outputFile = path.join(collectionDir, 'data.json');
      fs.writeFileSync(outputFile, JSON.stringify(sampleData, null, 2));
      console.log(`  ✓ ${collection}: ${sampleData.length} records`);
    }

    return true;

  } catch (error) {
    console.error(`❌ Sample data creation failed: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('========== DATA EXPORT ==========');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Export Friday from SQLite
    const fridaySuccess = exportSQLiteToJSON(FRIDAY_DB, FRIDAY_STAGING_DIR, 'Friday');

    // Create sample MyWorkReview data
    const mwrSuccess = createSampleMWRData('/home/user/lexco/myworkreview-staging');

    if (fridaySuccess && mwrSuccess) {
      console.log('\n✅ All exports complete! Ready for migration.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some exports failed. Please check the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
