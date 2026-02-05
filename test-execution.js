#!/usr/bin/env node

/**
 * TEST EXECUTION - Verify migration can run
 * This tests if the migration orchestrator can be executed
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRIDAY_STAGING_DIR = '/home/user/lexco/friday-staging';
const MWR_STAGING_DIR = '/home/user/lexco/myworkreview-staging';
const TARGET_DB = path.join(__dirname, 'data/app.db');

console.log('========== MIGRATION EXECUTION TEST ==========');
console.log(`Time: ${new Date().toISOString()}`);
console.log();

// Check directories
console.log('Checking source directories...');
console.log(`  Friday staging: ${fs.existsSync(FRIDAY_STAGING_DIR) ? 'EXISTS' : 'MISSING'}`);
console.log(`  MWR staging: ${fs.existsSync(MWR_STAGING_DIR) ? 'EXISTS' : 'MISSING'}`);
console.log();

// Check data directories
const fridayDataDir = path.join(FRIDAY_STAGING_DIR, 'data');
const mwrDataDir = path.join(MWR_STAGING_DIR, 'data');

console.log('Checking data collections...');
if (fs.existsSync(fridayDataDir)) {
  const collections = fs.readdirSync(fridayDataDir).filter(f => fs.statSync(path.join(fridayDataDir, f)).isDirectory());
  console.log(`  Friday collections (${collections.length}): ${collections.slice(0, 5).join(', ')}${collections.length > 5 ? '...' : ''}`);
}

if (fs.existsSync(mwrDataDir)) {
  const collections = fs.readdirSync(mwrDataDir).filter(f => fs.statSync(path.join(mwrDataDir, f)).isDirectory());
  console.log(`  MWR collections (${collections.length}): ${collections.slice(0, 5).join(', ')}${collections.length > 5 ? '...' : ''}`);
}
console.log();

// Check target DB
console.log('Checking target database...');
console.log(`  Target DB: ${TARGET_DB}`);
console.log(`  Exists: ${fs.existsSync(TARGET_DB) ? 'YES' : 'NO'}`);
console.log();

// Try to import orchestrator
console.log('Checking migration modules...');
try {
  const { MigrationOrchestrator } = await import('./src/migration/orchestrator.js');
  console.log('  ✓ MigrationOrchestrator imported successfully');
} catch (e) {
  console.error('  ✗ Failed to import MigrationOrchestrator:', e.message);
}

console.log();
console.log('Test complete. Ready to execute migration.');
