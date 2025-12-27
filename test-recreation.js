/**
 * Engagement Recreation Edge Case Testing Script
 * Tests all edge cases for engagement recreation functionality
 */

const BASE_URL = 'http://localhost:3000';

// Helper to make authenticated API calls (assumes browser session)
async function apiCall(method, endpoint, data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  const response = await fetch(`${BASE_URL}/api${endpoint}`, options);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`API Error: ${result.message || response.statusText}`);
  }
  return result;
}

// Test configuration
const TEST_CONFIG = {
  clientName: `Test Client Recreation ${Date.now()}`,
  engagementName: `Test Engagement Recreation ${Date.now()}`,
  year: 2024,
  month: null, // yearly engagement
};

let testState = {
  clientId: null,
  teamId: null,
  templateId: null,
  engagementTypeId: null,
  sourceEngagementId: null,
  newEngagementId: null,
  sectionIds: [],
  rfiIds: [],
};

console.log('=== ENGAGEMENT RECREATION EDGE CASE TESTING ===\n');

// Test 1: Setup - Create test client and engagement with child records
async function test1_createTestEngagement() {
  console.log('TEST 1: Creating test engagement with repeat_interval="yearly"');

  try {
    // Get existing team
    const teams = await apiCall('GET', '/team');
    testState.teamId = teams.data[0]?.id;
    if (!testState.teamId) throw new Error('No teams found');
    console.log(`  ✓ Using team ID: ${testState.teamId}`);

    // Get existing engagement type
    const engTypes = await apiCall('GET', '/engagement_type');
    testState.engagementTypeId = engTypes.data[0]?.id;
    if (!testState.engagementTypeId) throw new Error('No engagement types found');
    console.log(`  ✓ Using engagement type ID: ${testState.engagementTypeId}`);

    // Create test client
    const client = await apiCall('POST', '/client', {
      name: TEST_CONFIG.clientName,
      status: 'active'
    });
    testState.clientId = client.data.id;
    console.log(`  ✓ Created client ID: ${testState.clientId}`);

    // Create source engagement with repeat_interval="yearly"
    const engagement = await apiCall('POST', '/engagement', {
      name: TEST_CONFIG.engagementName,
      client_id: testState.clientId,
      team_id: testState.teamId,
      engagement_type: testState.engagementTypeId,
      year: TEST_CONFIG.year,
      month: TEST_CONFIG.month,
      repeat_interval: 'yearly',
      recreate_with_attachments: false,
      status: 'active',
      stage: 5, // CLOSE_OUT stage
      review_link: 'https://example.com/review/2024',
      review_id: 'REVIEW-2024-001'
    });
    testState.sourceEngagementId = engagement.data.id;
    console.log(`  ✓ Created engagement ID: ${testState.sourceEngagementId}`);
    console.log(`  ✓ repeat_interval: ${engagement.data.repeat_interval}`);
    console.log(`  ✓ review_link: ${engagement.data.review_link}`);
    console.log(`  ✓ review_id: ${engagement.data.review_id}`);

    // Create RFI sections
    const section1 = await apiCall('POST', '/rfi_section', {
      engagement_id: testState.sourceEngagementId,
      name: 'Financial Information',
      key: 'financial',
      sort_order: 1
    });
    testState.sectionIds.push(section1.data.id);
    console.log(`  ✓ Created RFI section ID: ${section1.data.id}`);

    const section2 = await apiCall('POST', '/rfi_section', {
      engagement_id: testState.sourceEngagementId,
      name: 'Tax Documents',
      key: 'tax',
      sort_order: 2
    });
    testState.sectionIds.push(section2.data.id);
    console.log(`  ✓ Created RFI section ID: ${section2.data.id}`);

    // Create RFIs
    const rfi1 = await apiCall('POST', '/rfi', {
      engagement_id: testState.sourceEngagementId,
      section_id: section1.data.id,
      key: 'rfi-001',
      name: 'Balance Sheet',
      question: 'Please provide the balance sheet for 2024',
      status: 'completed',
      date_requested: '2024-01-01',
      date_resolved: '2024-01-15',
      deadline_date: '2024-01-10',
      sort_order: 1
    });
    testState.rfiIds.push(rfi1.data.id);
    console.log(`  ✓ Created RFI ID: ${rfi1.data.id}`);

    const rfi2 = await apiCall('POST', '/rfi', {
      engagement_id: testState.sourceEngagementId,
      section_id: section2.data.id,
      key: 'rfi-002',
      name: 'Tax Returns',
      question: 'Please provide tax returns for 2024',
      status: 'pending',
      recreate_with_attachments: true,
      sort_order: 2
    });
    testState.rfiIds.push(rfi2.data.id);
    console.log(`  ✓ Created RFI ID: ${rfi2.data.id}`);

    console.log('  ✅ TEST 1 PASSED: Test engagement created successfully\n');
    return true;
  } catch (error) {
    console.error('  ❌ TEST 1 FAILED:', error.message);
    return false;
  }
}

// Test 2: Successful recreation
async function test2_successfulRecreation() {
  console.log('TEST 2: Testing successful recreation');

  try {
    // Call the recreation service directly via engine
    // Since there's no direct API endpoint, we'll need to use the service
    const result = await apiCall('POST', `/engagement/${testState.sourceEngagementId}/recreate`);

    if (!result.data) {
      throw new Error('No data returned from recreation');
    }

    testState.newEngagementId = result.data.id;
    console.log(`  ✓ New engagement created ID: ${testState.newEngagementId}`);
    console.log(`  ✓ New engagement year: ${result.data.year}`);

    // Verify new engagement has correct year
    if (result.data.year !== TEST_CONFIG.year + 1) {
      throw new Error(`Expected year ${TEST_CONFIG.year + 1}, got ${result.data.year}`);
    }
    console.log(`  ✓ Year incremented correctly: ${TEST_CONFIG.year} → ${result.data.year}`);

    // Verify old engagement repeat_interval changed to 'once'
    const oldEng = await apiCall('GET', `/engagement/${testState.sourceEngagementId}`);
    if (oldEng.data.repeat_interval !== 'once') {
      throw new Error(`Expected old engagement repeat_interval='once', got '${oldEng.data.repeat_interval}'`);
    }
    console.log(`  ✓ Source engagement repeat_interval changed to 'once'`);

    console.log('  ✅ TEST 2 PASSED: Recreation successful\n');
    return true;
  } catch (error) {
    console.error('  ❌ TEST 2 FAILED:', error.message);
    return false;
  }
}

// Test 3: Verify previous_year_review_link migration
async function test3_reviewLinkMigration() {
  console.log('TEST 3: Verifying review_link → previous_year_review_link migration');

  try {
    const newEng = await apiCall('GET', `/engagement/${testState.newEngagementId}`);

    if (newEng.data.previous_year_review_link !== 'https://example.com/review/2024') {
      throw new Error(`Expected previous_year_review_link='https://example.com/review/2024', got '${newEng.data.previous_year_review_link}'`);
    }
    console.log(`  ✓ previous_year_review_link migrated correctly: ${newEng.data.previous_year_review_link}`);

    if (newEng.data.review_link) {
      throw new Error(`Expected review_link to be null, got '${newEng.data.review_link}'`);
    }
    console.log(`  ✓ review_link is null in new engagement`);

    console.log('  ✅ TEST 3 PASSED: review_link migration successful\n');
    return true;
  } catch (error) {
    console.error('  ❌ TEST 3 FAILED:', error.message);
    return false;
  }
}

// Test 4: Verify previous_year_review_id migration
async function test4_reviewIdMigration() {
  console.log('TEST 4: Verifying review_id → previous_year_review_id migration');

  try {
    const newEng = await apiCall('GET', `/engagement/${testState.newEngagementId}`);

    if (newEng.data.previous_year_review_id !== 'REVIEW-2024-001') {
      throw new Error(`Expected previous_year_review_id='REVIEW-2024-001', got '${newEng.data.previous_year_review_id}'`);
    }
    console.log(`  ✓ previous_year_review_id migrated correctly: ${newEng.data.previous_year_review_id}`);

    if (newEng.data.review_id) {
      throw new Error(`Expected review_id to be null, got '${newEng.data.review_id}'`);
    }
    console.log(`  ✓ review_id is null in new engagement`);

    console.log('  ✅ TEST 4 PASSED: review_id migration successful\n');
    return true;
  } catch (error) {
    console.error('  ❌ TEST 4 FAILED:', error.message);
    return false;
  }
}

// Test 5: Verify child records cloned
async function test5_childRecordsCloned() {
  console.log('TEST 5: Verifying child records (RFIs, sections) cloned correctly');

  try {
    // Get sections for new engagement
    const sections = await apiCall('GET', `/rfi_section?engagement_id=${testState.newEngagementId}`);
    if (sections.data.length !== 2) {
      throw new Error(`Expected 2 sections, got ${sections.data.length}`);
    }
    console.log(`  ✓ Sections cloned: ${sections.data.length} sections`);

    // Verify section names preserved
    const sectionNames = sections.data.map(s => s.name).sort();
    const expectedNames = ['Financial Information', 'Tax Documents'].sort();
    if (JSON.stringify(sectionNames) !== JSON.stringify(expectedNames)) {
      throw new Error(`Section names mismatch: ${sectionNames} vs ${expectedNames}`);
    }
    console.log(`  ✓ Section names preserved: ${sectionNames.join(', ')}`);

    // Get RFIs for new engagement
    const rfis = await apiCall('GET', `/rfi?engagement_id=${testState.newEngagementId}`);
    if (rfis.data.length !== 2) {
      throw new Error(`Expected 2 RFIs, got ${rfis.data.length}`);
    }
    console.log(`  ✓ RFIs cloned: ${rfis.data.length} RFIs`);

    // Verify RFI names preserved
    const rfiNames = rfis.data.map(r => r.name).sort();
    const expectedRfiNames = ['Balance Sheet', 'Tax Returns'].sort();
    if (JSON.stringify(rfiNames) !== JSON.stringify(expectedRfiNames)) {
      throw new Error(`RFI names mismatch: ${rfiNames} vs ${expectedRfiNames}`);
    }
    console.log(`  ✓ RFI names preserved: ${rfiNames.join(', ')}`);

    console.log('  ✅ TEST 5 PASSED: Child records cloned successfully\n');
    return true;
  } catch (error) {
    console.error('  ❌ TEST 5 FAILED:', error.message);
    return false;
  }
}

// Test 6: Verify dates reset and statuses reset
async function test6_datesAndStatusesReset() {
  console.log('TEST 6: Verifying dates reset to null, statuses reset to pending');

  try {
    const rfis = await apiCall('GET', `/rfi?engagement_id=${testState.newEngagementId}`);

    for (const rfi of rfis.data) {
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
      console.log(`  ✓ RFI ${rfi.name}: dates reset to null`);

      // Check status reset to pending
      if (rfi.status !== 'pending') {
        throw new Error(`RFI ${rfi.id}: status should be 'pending', got '${rfi.status}'`);
      }
      console.log(`  ✓ RFI ${rfi.name}: status reset to 'pending'`);

      // Check counters reset
      if (rfi.response_count !== 0) {
        throw new Error(`RFI ${rfi.id}: response_count should be 0, got ${rfi.response_count}`);
      }
      if (rfi.days_outstanding !== 0) {
        throw new Error(`RFI ${rfi.id}: days_outstanding should be 0, got ${rfi.days_outstanding}`);
      }
      console.log(`  ✓ RFI ${rfi.name}: counters reset to 0`);
    }

    // Check engagement status reset
    const newEng = await apiCall('GET', `/engagement/${testState.newEngagementId}`);
    if (newEng.data.progress !== 0) {
      throw new Error(`Engagement progress should be 0, got ${newEng.data.progress}`);
    }
    console.log(`  ✓ Engagement progress reset to 0`);

    if (newEng.data.status !== 'pending') {
      throw new Error(`Engagement status should be 'pending', got '${newEng.data.status}'`);
    }
    console.log(`  ✓ Engagement status reset to 'pending'`);

    console.log('  ✅ TEST 6 PASSED: Dates and statuses reset successfully\n');
    return true;
  } catch (error) {
    console.error('  ❌ TEST 6 FAILED:', error.message);
    return false;
  }
}

// Test 7: Test failure path - create duplicate and verify rollback
async function test7_failurePathRollback() {
  console.log('TEST 7: Testing failure path - duplicate detection and rollback');

  try {
    // The new engagement already exists for 2025, try to recreate again
    let errorCaught = false;
    let originalRepeatInterval = null;

    // First, reset source engagement repeat_interval back to yearly
    await apiCall('PATCH', `/engagement/${testState.sourceEngagementId}`, {
      repeat_interval: 'yearly'
    });
    originalRepeatInterval = 'yearly';
    console.log(`  ✓ Reset source engagement repeat_interval to 'yearly'`);

    try {
      await apiCall('POST', `/engagement/${testState.sourceEngagementId}/recreate`);
    } catch (error) {
      errorCaught = true;
      console.log(`  ✓ Recreation failed as expected: ${error.message}`);
    }

    if (!errorCaught) {
      throw new Error('Expected recreation to fail due to duplicate, but it succeeded');
    }

    // Verify source engagement repeat_interval was restored
    const sourceEng = await apiCall('GET', `/engagement/${testState.sourceEngagementId}`);
    if (sourceEng.data.repeat_interval !== originalRepeatInterval) {
      throw new Error(`Expected repeat_interval to be restored to '${originalRepeatInterval}', got '${sourceEng.data.repeat_interval}'`);
    }
    console.log(`  ✓ Source engagement repeat_interval restored to '${originalRepeatInterval}'`);

    // Verify no additional engagements created
    const engs = await apiCall('GET', `/engagement?client_id=${testState.clientId}&year=${TEST_CONFIG.year + 1}`);
    if (engs.data.length !== 1) {
      throw new Error(`Expected 1 engagement for year ${TEST_CONFIG.year + 1}, got ${engs.data.length}`);
    }
    console.log(`  ✓ No duplicate engagement created`);

    console.log('  ✅ TEST 7 PASSED: Rollback on failure successful\n');
    return true;
  } catch (error) {
    console.error('  ❌ TEST 7 FAILED:', error.message);
    return false;
  }
}

// Test 8: Verify recreation_log entries
async function test8_recreationLog() {
  console.log('TEST 8: Verifying recreation_log entries');

  try {
    const logs = await apiCall('GET', `/recreation_log?engagement_id=${testState.sourceEngagementId}`);

    if (logs.data.length < 2) {
      throw new Error(`Expected at least 2 log entries (1 success, 1 failure), got ${logs.data.length}`);
    }
    console.log(`  ✓ Found ${logs.data.length} recreation log entries`);

    // Find success log
    const successLog = logs.data.find(l => l.status === 'completed');
    if (!successLog) {
      throw new Error('No completed recreation log found');
    }
    console.log(`  ✓ Success log found: ${successLog.details}`);

    // Verify success log has details
    const successDetails = JSON.parse(successLog.details);
    if (!successDetails.source_id || !successDetails.new_id) {
      throw new Error('Success log missing required details');
    }
    console.log(`  ✓ Success log contains source_id: ${successDetails.source_id}, new_id: ${successDetails.new_id}`);

    // Find failure log
    const failureLog = logs.data.find(l => l.status === 'failed');
    if (!failureLog) {
      throw new Error('No failed recreation log found');
    }
    console.log(`  ✓ Failure log found: ${failureLog.error}`);

    console.log('  ✅ TEST 8 PASSED: Recreation logs verified\n');
    return true;
  } catch (error) {
    console.error('  ❌ TEST 8 FAILED:', error.message);
    return false;
  }
}

// Cleanup function
async function cleanup() {
  console.log('CLEANUP: Removing test data');
  try {
    if (testState.newEngagementId) {
      await apiCall('DELETE', `/engagement/${testState.newEngagementId}`);
      console.log(`  ✓ Deleted new engagement ${testState.newEngagementId}`);
    }
    if (testState.sourceEngagementId) {
      await apiCall('DELETE', `/engagement/${testState.sourceEngagementId}`);
      console.log(`  ✓ Deleted source engagement ${testState.sourceEngagementId}`);
    }
    if (testState.clientId) {
      await apiCall('DELETE', `/client/${testState.clientId}`);
      console.log(`  ✓ Deleted client ${testState.clientId}`);
    }
    console.log('  ✓ Cleanup complete\n');
  } catch (error) {
    console.error('  ⚠ Cleanup error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

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
    const passed = await test.fn();
    results.tests.push({ name: test.name, passed });
    if (passed) results.passed++;
    else results.failed++;
  }

  // Cleanup
  await cleanup();

  // Summary
  console.log('=== TEST SUMMARY ===');
  console.log(`Total: ${results.tests.length}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('\nDetails:');
  results.tests.forEach(t => {
    console.log(`  ${t.passed ? '✅' : '❌'} ${t.name}`);
  });

  return results;
}

// Export for browser execution
if (typeof window !== 'undefined') {
  window.testEngagementRecreation = runAllTests;
}

// Run if in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}
