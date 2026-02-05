#!/usr/bin/env node
/**
 * Test script to execute migration phases
 * Run: node test-migration.js
 */

import { MigrationLogger, DatabaseUtil, phase1SchemaAnalysis, phase2SourceAnalysis } from './migration.js';

async function runMigrationTest() {
  const logger = new MigrationLogger('test');

  try {
    logger.log('Starting migration test...');

    // Test Phase 1: Schema Analysis
    logger.log('Running Phase 1: Schema Analysis...');
    const schema = await phase1SchemaAnalysis(logger);
    logger.log(`✓ Phase 1 complete - analyzed ${Object.keys(schema).length} tables`);

    // Test Phase 2: Source Analysis
    logger.log('Running Phase 2: Source System Analysis...');
    const sources = await phase2SourceAnalysis(logger);
    logger.log(`✓ Phase 2 complete - Friday: ${sources.friday.collections.length} items, MWR: ${sources.mwr.collections.length} items`);

    console.log('\n========== MIGRATION TEST RESULTS ==========');
    console.log(JSON.stringify(logger.summary(), null, 2));

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

runMigrationTest();
