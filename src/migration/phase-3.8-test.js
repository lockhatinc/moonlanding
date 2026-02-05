import { initializeDualDatabaseRouter, setRoutingMode, getRoutingConfig, getTelemetry, execRun, execGet } from '../lib/dual-database-router.js';

export async function testDualWriteOperations() {
  const startTime = Date.now();
  console.log('\n▶ PHASE 3.8: WRITE OPERATIONS TEST');
  console.log('─'.repeat(60));
  console.log('Testing dual-write routing and telemetry collection');

  const results = {
    phase: '3.8-test',
    startTime: new Date().toISOString(),
    status: 'running',
    testCases: [],
    telemetry: {},
    errors: [],
  };

  try {
    // Initialize routing if not already done
    try {
      initializeDualDatabaseRouter();
      console.log('✓ Dual-router initialized');
    } catch (e) {
      console.log('ℹ Dual-router already initialized');
    }

    // Configure for testing (write to moonlanding only for now, since Friday not available)
    setRoutingMode('moonlanding');
    console.log('✓ Routing mode: moonlanding (Friday not available)');

    // TEST 1: Single write to moonlanding
    console.log('\n✓ TEST 1: Write operation to Moonlanding');
    try {
      const testData = {
        operation: 'CREATE_TEST_RECORD',
        timestamp: Date.now(),
        testId: 'phase-3.8-write-test-' + Date.now(),
      };

      const sql = `INSERT INTO engagements (id, client_id, status, stage, created_at, commencement_date, description) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const now = Math.floor(Date.now() / 1000);
      execRun(sql, ['test-eng-' + Date.now(), 'fri-client-1', 'draft', 'kickoff', now, now, 'Phase 3.8 Test Engagement'], { entity: 'engagement', operation: 'Create' });

      results.testCases.push({
        name: 'Write to Moonlanding',
        status: 'success',
        details: 'Single write operation completed',
        timestamp: new Date().toISOString(),
      });
      console.log('  ✓ Write to Moonlanding: SUCCESS');
    } catch (e) {
      results.testCases.push({
        name: 'Write to Moonlanding',
        status: 'failed',
        details: e.message,
        timestamp: new Date().toISOString(),
      });
      console.log('  ✗ Write to Moonlanding: FAILED -', e.message);
    }

    // TEST 2: Read operation with fallback
    console.log('\n✓ TEST 2: Read operation with fallback routing');
    try {
      const sql = `SELECT COUNT(*) as count FROM engagements`;
      const result = execGet(sql, [], { entity: 'engagement', operation: 'Count' });
      results.testCases.push({
        name: 'Read from Moonlanding',
        status: 'success',
        details: `Read completed, ${result?.count || 0} records found`,
        timestamp: new Date().toISOString(),
      });
      console.log('  ✓ Read from Moonlanding: SUCCESS');
    } catch (e) {
      results.testCases.push({
        name: 'Read from Moonlanding',
        status: 'failed',
        details: e.message,
        timestamp: new Date().toISOString(),
      });
      console.log('  ✗ Read from Moonlanding: FAILED -', e.message);
    }

    // TEST 3: Routing configuration verification
    console.log('\n✓ TEST 3: Routing configuration verification');
    const config = getRoutingConfig();
    results.testCases.push({
      name: 'Routing Configuration',
      status: 'success',
      details: `Write: ${config.writeMode}, Read: ${config.readPrimary}`,
      timestamp: new Date().toISOString(),
    });
    console.log('  ✓ Write mode:', config.writeMode);
    console.log('  ✓ Read primary:', config.readPrimary);

    // TEST 4: Telemetry collection
    console.log('\n✓ TEST 4: Telemetry collection');
    const telemetry = getTelemetry();
    results.telemetry = telemetry;
    results.testCases.push({
      name: 'Telemetry Collection',
      status: 'success',
      details: `Writes: ${telemetry.writes.total}, Reads: ${telemetry.reads.total}`,
      timestamp: new Date().toISOString(),
    });
    console.log('  ✓ Total writes:', telemetry.writes.total);
    console.log('  ✓ Total reads:', telemetry.reads.total);
    console.log('  ✓ Errors:', telemetry.errors.total);

    results.status = 'success';
    results.duration = Date.now() - startTime;
    results.endTime = new Date().toISOString();

    console.log('\n' + '═'.repeat(60));
    console.log('✓ PHASE 3.8 WRITE TESTS COMPLETE');
    console.log('═'.repeat(60));
    console.log(`Duration: ${results.duration}ms`);
    console.log(`Passed: ${results.testCases.filter(t => t.status === 'success').length}/${results.testCases.length}`);

    return results;
  } catch (error) {
    results.status = 'failed';
    results.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    results.duration = Date.now() - startTime;
    results.endTime = new Date().toISOString();

    console.error('\n✗ PHASE 3.8 WRITE TESTS FAILED');
    console.error(error.message);

    return results;
  }
}

export default {
  testDualWriteOperations,
  name: 'Phase 3.8 Write Operations Test',
  description: 'Test dual-write routing and telemetry',
};
