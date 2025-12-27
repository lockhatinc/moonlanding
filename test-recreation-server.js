/**
 * Server-side Engagement Recreation Edge Case Testing Script
 * Run with: node test-recreation-server.js
 */

import { list, get, create, update, remove } from './src/engine.server.js';
import { recreateEngagement } from './src/engine/recreation.js';
import { getEngagementStages } from './src/lib/status-helpers.js';

const stages = getEngagementStages();

// Test state
const testState = {
  clientId: null,
  teamId: null,
  engagementTypeId: null,
  sourceEngagementId: null,
  newEngagementId: null,
  sectionIds: [],
  rfiIds: [],
  testsPassed: 0,
  testsFailed: 0
};

function logTest(testName, status, message) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '📝';
  console.log(`${icon} ${testName}: ${message}`);
}

function logDetail(message) {
  console.log(`  ${message}`);
}

// TEST 1: Create test engagement with child records
async function test1_createTestEngagement() {
  console.log('\n=== TEST 1: Create test engagement with repeat_interval="yearly" ===');

  try {
    // Get existing team
    const teams = list('team', {});
    if (!teams || teams.length === 0) throw new Error('No teams found');
    testState.teamId = teams[0].id;
    logDetail(`✓ Using team ID: ${testState.teamId}`);

    // Get existing engagement type
    const engTypes = list('engagement_type', {});
    if (!engTypes || engTypes.length === 0) throw new Error('No engagement types found');
    testState.engagementTypeId = engTypes[0].id;
    logDetail(`✓ Using engagement type ID: ${testState.engagementTypeId}`);

    // Create test client
    const timestamp = Date.now();
    const client = create('client', {
      name: `Test Client Recreation ${timestamp}`,
      status: 'active'
    });
    testState.clientId = client.id;
    logDetail(`✓ Created client ID: ${testState.clientId}`);

    // Create source engagement with repeat_interval='yearly'
    const engagement = create('engagement', {
      name: `Test Eng Recreation ${timestamp}`,
      client_id: testState.clientId,
      team_id: testState.teamId,
      engagement_type: testState.engagementTypeId,
      year: 2024,
      month: null,
      repeat_interval: 'yearly',
      recreate_with_attachments: false,
      status: 'active',
      stage: stages.CLOSE_OUT,
      review_link: 'https://example.com/review/2024',
      review_id: 'REVIEW-2024-001'
    });
    testState.sourceEngagementId = engagement.id;
    logDetail(`✓ Created source engagement ID: ${testState.sourceEngagementId}`);
    logDetail(`  repeat_interval: ${engagement.repeat_interval}`);
    logDetail(`  review_link: ${engagement.review_link}`);
    logDetail(`  review_id: ${engagement.review_id}`);

    // Create RFI sections
    const section1 = create('rfi_section', {
      engagement_id: testState.sourceEngagementId,
      name: 'Financial Information',
      key: 'financial',
      sort_order: 1
    });
    testState.sectionIds.push(section1.id);
    logDetail(`✓ Created RFI section ID: ${section1.id}`);

    const section2 = create('rfi_section', {
      engagement_id: testState.sourceEngagementId,
      name: 'Tax Documents',
      key: 'tax',
      sort_order: 2
    });
    testState.sectionIds.push(section2.id);
    logDetail(`✓ Created RFI section ID: ${section2.id}`);

    // Create RFIs with different statuses and dates
    const rfi1 = create('rfi', {
      engagement_id: testState.sourceEngagementId,
      section_id: section1.id,
      key: 'rfi-001',
      name: 'Balance Sheet',
      question: 'Please provide the balance sheet for 2024',
      status: 'completed',
      date_requested: '2024-01-01',
      date_resolved: '2024-01-15',
      deadline_date: '2024-01-10',
      response_count: 3,
      days_outstanding: 14,
      sort_order: 1
    });
    testState.rfiIds.push(rfi1.id);
    logDetail(`✓ Created RFI ID: ${rfi1.id} (status: ${rfi1.status}, responses: ${rfi1.response_count})`);

    const rfi2 = create('rfi', {
      engagement_id: testState.sourceEngagementId,
      section_id: section2.id,
      key: 'rfi-002',
      name: 'Tax Returns',
      question: 'Please provide tax returns for 2024',
      status: 'pending',
      recreate_with_attachments: true,
      sort_order: 2
    });
    testState.rfiIds.push(rfi2.id);
    logDetail(`✓ Created RFI ID: ${rfi2.id}`);

    logTest('TEST 1', 'pass', 'Test engagement created successfully');
    testState.testsPassed++;
    return true;
  } catch (error) {
    logTest('TEST 1', 'fail', error.message);
    testState.testsFailed++;
    return false;
  }
}

// TEST 2: Successful recreation
async function test2_successfulRecreation() {
  console.log('\n=== TEST 2: Testing successful recreation ===');

  try {
    // Call recreation engine
    const newEng = await recreateEngagement(testState.sourceEngagementId);

    if (!newEng) throw new Error('No new engagement returned from recreation');

    testState.newEngagementId = newEng.id;
    logDetail(`✓ New engagement created ID: ${testState.newEngagementId}`);
    logDetail(`✓ New engagement year: ${newEng.year}`);

    // Verify new engagement has correct year
    if (newEng.year !== 2025) {
      throw new Error(`Expected year 2025, got ${newEng.year}`);
    }
    logDetail(`✓ Year incremented correctly: 2024 → ${newEng.year}`);

    // Verify old engagement repeat_interval changed to 'once'
    const oldEng = get('engagement', testState.sourceEngagementId);
    if (oldEng.repeat_interval !== 'once') {
      throw new Error(`Expected old engagement repeat_interval='once', got '${oldEng.repeat_interval}'`);
    }
    logDetail(`✓ Source engagement repeat_interval changed to 'once'`);

    logTest('TEST 2', 'pass', 'Recreation successful');
    testState.testsPassed++;
    return true;
  } catch (error) {
    logTest('TEST 2', 'fail', error.message);
    testState.testsFailed++;
    return false;
  }
}

// TEST 3: Verify review_link → previous_year_review_link migration
async function test3_reviewLinkMigration() {
  console.log('\n=== TEST 3: Verifying review_link → previous_year_review_link migration ===');

  try {
    const newEng = get('engagement', testState.newEngagementId);

    if (newEng.previous_year_review_link !== 'https://example.com/review/2024') {
      throw new Error(`Expected previous_year_review_link='https://example.com/review/2024', got '${newEng.previous_year_review_link}'`);
    }
    logDetail(`✓ previous_year_review_link migrated: ${newEng.previous_year_review_link}`);

    if (newEng.review_link) {
      throw new Error(`Expected review_link to be null, got '${newEng.review_link}'`);
    }
    logDetail(`✓ review_link is null in new engagement`);

    logTest('TEST 3', 'pass', 'review_link migration successful');
    testState.testsPassed++;
    return true;
  } catch (error) {
    logTest('TEST 3', 'fail', error.message);
    testState.testsFailed++;
    return false;
  }
}

// TEST 4: Verify review_id → previous_year_review_id migration
async function test4_reviewIdMigration() {
  console.log('\n=== TEST 4: Verifying review_id → previous_year_review_id migration ===');

  try {
    const newEng = get('engagement', testState.newEngagementId);

    if (newEng.previous_year_review_id !== 'REVIEW-2024-001') {
      throw new Error(`Expected previous_year_review_id='REVIEW-2024-001', got '${newEng.previous_year_review_id}'`);
    }
    logDetail(`✓ previous_year_review_id migrated: ${newEng.previous_year_review_id}`);

    if (newEng.review_id) {
      throw new Error(`Expected review_id to be null, got '${newEng.review_id}'`);
    }
    logDetail(`✓ review_id is null in new engagement`);

    logTest('TEST 4', 'pass', 'review_id migration successful');
    testState.testsPassed++;
    return true;
  } catch (error) {
    logTest('TEST 4', 'fail', error.message);
    testState.testsFailed++;
    return false;
  }
}

// TEST 5: Verify child records cloned
async function test5_childRecordsCloned() {
  console.log('\n=== TEST 5: Verifying child records (RFIs, sections) cloned correctly ===');

  try {
    // Get sections for new engagement
    const sections = list('rfi_section', { engagement_id: testState.newEngagementId });
    if (sections.length !== 2) {
      throw new Error(`Expected 2 sections, got ${sections.length}`);
    }
    logDetail(`✓ Sections cloned: ${sections.length} sections`);

    // Verify section names preserved
    const sectionNames = sections.map(s => s.name).sort();
    const expectedNames = ['Financial Information', 'Tax Documents'].sort();
    if (JSON.stringify(sectionNames) !== JSON.stringify(expectedNames)) {
      throw new Error(`Section names mismatch: ${sectionNames} vs ${expectedNames}`);
    }
    logDetail(`✓ Section names preserved: ${sectionNames.join(', ')}`);

    // Get RFIs for new engagement
    const rfis = list('rfi', { engagement_id: testState.newEngagementId });
    if (rfis.length !== 2) {
      throw new Error(`Expected 2 RFIs, got ${rfis.length}`);
    }
    logDetail(`✓ RFIs cloned: ${rfis.length} RFIs`);

    // Verify RFI names preserved
    const rfiNames = rfis.map(r => r.name).sort();
    const expectedRfiNames = ['Balance Sheet', 'Tax Returns'].sort();
    if (JSON.stringify(rfiNames) !== JSON.stringify(expectedRfiNames)) {
      throw new Error(`RFI names mismatch: ${rfiNames} vs ${expectedRfiNames}`);
    }
    logDetail(`✓ RFI names preserved: ${rfiNames.join(', ')}`);

    logTest('TEST 5', 'pass', 'Child records cloned successfully');
    testState.testsPassed++;
    return true;
  } catch (error) {
    logTest('TEST 5', 'fail', error.message);
    testState.testsFailed++;
    return false;
  }
}

// TEST 6: Verify dates reset and statuses reset
async function test6_datesAndStatusesReset() {
  console.log('\n=== TEST 6: Verifying dates reset to null, statuses reset to pending ===');

  try {
    const rfis = list('rfi', { engagement_id: testState.newEngagementId });

    for (const rfi of rfis) {
      // Check dates are null
      if (rfi.date_requested !== null) {
        throw new Error(`RFI ${rfi.id}: date_requested should be null, got ${rfi.date_requested}`);
      }
      if (rfi.date_resolved !== null) {
        throw new Error(`RFI ${rfi.id}: date_resolved should be null, got ${rfi.date_resolved}`);
      }
      if (rfi.deadline_date !== null) {
        throw new Error(`RFI ${rfi.id}: deadline_date should be null, got ${rfi.deadline_date}`);
      }
      logDetail(`✓ RFI ${rfi.name}: dates reset to null`);

      // Check status reset to pending
      if (rfi.status !== 'pending') {
        throw new Error(`RFI ${rfi.id}: status should be 'pending', got '${rfi.status}'`);
      }
      logDetail(`✓ RFI ${rfi.name}: status reset to 'pending'`);

      // Check counters reset
      if (rfi.response_count !== 0) {
        throw new Error(`RFI ${rfi.id}: response_count should be 0, got ${rfi.response_count}`);
      }
      if (rfi.days_outstanding !== 0) {
        throw new Error(`RFI ${rfi.id}: days_outstanding should be 0, got ${rfi.days_outstanding}`);
      }
      logDetail(`✓ RFI ${rfi.name}: counters reset to 0`);
    }

    // Check engagement status reset
    const newEng = get('engagement', testState.newEngagementId);
    if (newEng.progress !== 0) {
      throw new Error(`Engagement progress should be 0, got ${newEng.progress}`);
    }
    logDetail(`✓ Engagement progress reset to 0`);

    if (newEng.status !== 'pending') {
      throw new Error(`Engagement status should be 'pending', got '${newEng.status}'`);
    }
    logDetail(`✓ Engagement status reset to 'pending'`);

    logTest('TEST 6', 'pass', 'Dates and statuses reset successfully');
    testState.testsPassed++;
    return true;
  } catch (error) {
    logTest('TEST 6', 'fail', error.message);
    testState.testsFailed++;
    return false;
  }
}

// TEST 7: Test failure path - duplicate detection and rollback
async function test7_failurePathRollback() {
  console.log('\n=== TEST 7: Testing failure path - duplicate detection and rollback ===');

  try {
    // Reset source engagement repeat_interval back to yearly to test again
    update('engagement', testState.sourceEngagementId, { repeat_interval: 'yearly' });
    logDetail(`✓ Reset source engagement repeat_interval to 'yearly'`);

    let errorCaught = false;

    try {
      // Try to recreate again - should fail due to duplicate
      await recreateEngagement(testState.sourceEngagementId);
    } catch (error) {
      errorCaught = true;
      logDetail(`✓ Recreation failed as expected: ${error.message}`);
    }

    if (!errorCaught) {
      throw new Error('Expected recreation to fail due to duplicate, but it succeeded');
    }

    // Verify source engagement repeat_interval was restored
    const sourceEng = get('engagement', testState.sourceEngagementId);
    if (sourceEng.repeat_interval !== 'yearly') {
      throw new Error(`Expected repeat_interval to be restored to 'yearly', got '${sourceEng.repeat_interval}'`);
    }
    logDetail(`✓ Source engagement repeat_interval restored to 'yearly'`);

    // Verify no additional engagements created
    const engs = list('engagement', { client_id: testState.clientId, year: 2025 });
    if (engs.length !== 1) {
      throw new Error(`Expected 1 engagement for year 2025, got ${engs.length}`);
    }
    logDetail(`✓ No duplicate engagement created`);

    logTest('TEST 7', 'pass', 'Rollback on failure successful');
    testState.testsPassed++;
    return true;
  } catch (error) {
    logTest('TEST 7', 'fail', error.message);
    testState.testsFailed++;
    return false;
  }
}

// TEST 8: Verify recreation_log entries
async function test8_recreationLog() {
  console.log('\n=== TEST 8: Verifying recreation_log entries ===');

  try {
    const logs = list('recreation_log', { engagement_id: testState.sourceEngagementId });

    if (logs.length < 2) {
      throw new Error(`Expected at least 2 log entries (1 success, 1 failure), got ${logs.length}`);
    }
    logDetail(`✓ Found ${logs.length} recreation log entries`);

    // Find success log
    const successLog = logs.find(l => l.status === 'completed');
    if (!successLog) {
      throw new Error('No completed recreation log found');
    }
    logDetail(`✓ Success log found`);

    // Verify success log has details
    const successDetails = JSON.parse(successLog.details);
    if (!successDetails.source_id || !successDetails.new_id) {
      throw new Error('Success log missing required details');
    }
    logDetail(`✓ Success log contains source_id: ${successDetails.source_id}, new_id: ${successDetails.new_id}`);
    logDetail(`  sections: ${successDetails.sections}, rfis: ${successDetails.rfis}`);

    // Find failure log
    const failureLog = logs.find(l => l.status === 'failed');
    if (!failureLog) {
      throw new Error('No failed recreation log found');
    }
    logDetail(`✓ Failure log found: ${failureLog.error}`);

    logTest('TEST 8', 'pass', 'Recreation logs verified');
    testState.testsPassed++;
    return true;
  } catch (error) {
    logTest('TEST 8', 'fail', error.message);
    testState.testsFailed++;
    return false;
  }
}

// Cleanup function
async function cleanup() {
  console.log('\n=== CLEANUP: Removing test data ===');
  try {
    // Delete child records first (foreign key constraints)
    if (testState.newEngagementId) {
      const newRfis = list('rfi', { engagement_id: testState.newEngagementId });
      newRfis.forEach(r => remove('rfi', r.id));

      const newSections = list('rfi_section', { engagement_id: testState.newEngagementId });
      newSections.forEach(s => remove('rfi_section', s.id));

      remove('engagement', testState.newEngagementId);
      logDetail(`✓ Deleted new engagement ${testState.newEngagementId}`);
    }

    if (testState.sourceEngagementId) {
      const sourceRfis = list('rfi', { engagement_id: testState.sourceEngagementId });
      sourceRfis.forEach(r => remove('rfi', r.id));

      const sourceSections = list('rfi_section', { engagement_id: testState.sourceEngagementId });
      sourceSections.forEach(s => remove('rfi_section', s.id));

      remove('engagement', testState.sourceEngagementId);
      logDetail(`✓ Deleted source engagement ${testState.sourceEngagementId}`);
    }

    // Delete recreation logs
    const logs = list('recreation_log', { engagement_id: testState.sourceEngagementId });
    logs.forEach(l => remove('recreation_log', l.id));
    logDetail(`✓ Deleted ${logs.length} recreation logs`);

    if (testState.clientId) {
      remove('client', testState.clientId);
      logDetail(`✓ Deleted client ${testState.clientId}`);
    }

    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.error('⚠ Cleanup error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ENGAGEMENT RECREATION EDGE CASE TESTING');
  console.log('═══════════════════════════════════════════════════════════════');

  const tests = [
    { name: 'Create Test Engagement', fn: test1_createTestEngagement },
    { name: 'Successful Recreation', fn: test2_successfulRecreation },
    { name: 'Review Link Migration', fn: test3_reviewLinkMigration },
    { name: 'Review ID Migration', fn: test4_reviewIdMigration },
    { name: 'Child Records Cloned', fn: test5_childRecordsCloned },
    { name: 'Dates and Statuses Reset', fn: test6_datesAndStatusesReset },
    { name: 'Failure Path Rollback', fn: test7_failurePathRollback },
    { name: 'Recreation Log', fn: test8_recreationLog }
  ];

  for (const test of tests) {
    await test.fn();
  }

  // Cleanup
  await cleanup();

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${testState.testsPassed}`);
  console.log(`❌ Failed: ${testState.testsFailed}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(testState.testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
