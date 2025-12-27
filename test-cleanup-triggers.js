#!/usr/bin/env node

/**
 * Test Cleanup Trigger Rules
 * Tests all 8 trigger behaviors specified in requirements
 */

const sqlite3 = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
const BASE_URL = 'http://localhost:3000';

const db = sqlite3(DB_PATH);

// Helper functions
function query(sql, params = []) {
  try {
    return db.prepare(sql).all(...params);
  } catch (error) {
    console.error(`Query error: ${error.message}`);
    throw error;
  }
}

function run(sql, params = []) {
  try {
    return db.prepare(sql).run(...params);
  } catch (error) {
    console.error(`Run error: ${error.message}`);
    throw error;
  }
}

function get(sql, params = []) {
  try {
    return db.prepare(sql).get(...params);
  } catch (error) {
    console.error(`Get error: ${error.message}`);
    throw error;
  }
}

async function makeRequest(endpoint, method = 'GET', body = null, userRole = 'clerk') {
  const headers = {
    'Content-Type': 'application/json',
    'X-Test-User': JSON.stringify({
      id: 'test-user-1',
      email: 'test@example.com',
      role: userRole,
      type: 'auditor'
    })
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const text = await response.text();

  try {
    return { status: response.status, data: JSON.parse(text) };
  } catch {
    return { status: response.status, data: text };
  }
}

// Test setup
async function setupTestData() {
  console.log('\n=== Setting up test data ===\n');

  // Create test client
  run(`INSERT OR IGNORE INTO client (id, name, status, engagement_count, created_at)
       VALUES ('test-client-1', 'Test Client Active', 'active', 0, ${Date.now() / 1000})`);

  // Create test users
  run(`INSERT OR IGNORE INTO user (id, email, name, role, type, status, created_at)
       VALUES ('user-1', 'user1@test.com', 'User 1', 'clerk', 'auditor', 'active', ${Date.now() / 1000})`);
  run(`INSERT OR IGNORE INTO user (id, email, name, role, type, status, created_at)
       VALUES ('user-2', 'user2@test.com', 'User 2', 'manager', 'auditor', 'active', ${Date.now() / 1000})`);
  run(`INSERT OR IGNORE INTO user (id, email, name, role, type, status, created_at)
       VALUES ('user-3', 'user3@test.com', 'User 3', 'partner', 'auditor', 'active', ${Date.now() / 1000})`);
  run(`INSERT OR IGNORE INTO user (id, email, name, role, type, status, created_at)
       VALUES ('user-4', 'user4@test.com', 'User 4', 'partner', 'auditor', 'active', ${Date.now() / 1000})`);

  // Create test team
  run(`INSERT OR IGNORE INTO team (id, name, partners, users, created_at)
       VALUES ('team-1', 'Test Team', '["user-3", "user-4"]', '["user-1", "user-2"]', ${Date.now() / 1000})`);

  // Create test engagements
  run(`INSERT OR IGNORE INTO engagement (id, name, client_id, team_id, stage, progress, repeat_interval, status, users, created_at)
       VALUES ('eng-1', 'Engagement 1', 'test-client-1', 'team-1', 'info_gathering', 0, 'monthly', 'active', '["user-1", "user-2"]', ${Date.now() / 1000})`);

  run(`INSERT OR IGNORE INTO engagement (id, name, client_id, team_id, stage, progress, repeat_interval, status, users, created_at)
       VALUES ('eng-2', 'Engagement 2', 'test-client-1', 'team-1', 'commencement', 50, 'quarterly', 'active', '["user-1", "user-2"]', ${Date.now() / 1000})`);

  run(`INSERT OR IGNORE INTO engagement (id, name, client_id, team_id, stage, progress, repeat_interval, status, users, created_at)
       VALUES ('eng-3', 'Engagement 3', 'test-client-1', 'team-1', 'info_gathering', 10, 'yearly', 'active', '["user-1"]', ${Date.now() / 1000})`);

  console.log('✓ Test data created');
}

// Test 1: Client status → "Inactive"
async function test1_ClientInactive() {
  console.log('\n=== TEST 1: Client status → "Inactive" ===\n');

  const beforeEngs = query('SELECT id, repeat_interval, stage, progress FROM engagement WHERE client_id = ?', ['test-client-1']);
  console.log('Before update:', beforeEngs);

  // Update client to inactive via API
  const response = await makeRequest('/api/client/test-client-1', 'PATCH', { status: 'inactive' });
  console.log('API Response:', response);

  // Wait for triggers to process
  await new Promise(resolve => setTimeout(resolve, 500));

  const afterEngs = query('SELECT id, repeat_interval, stage, progress FROM engagement WHERE client_id = ?', ['test-client-1']);
  console.log('After update:', afterEngs);

  const deletedCount = beforeEngs.length - afterEngs.length;
  const allOnce = afterEngs.every(e => e.repeat_interval === 'once');

  console.log('\nResults:');
  console.log(`- Engagements before: ${beforeEngs.length}`);
  console.log(`- Engagements after: ${afterEngs.length}`);
  console.log(`- Deleted (InfoGathering + 0%): ${deletedCount}`);
  console.log(`- All repeat_interval='once': ${allOnce}`);

  const passed = allOnce && deletedCount === 1; // eng-1 should be deleted
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Client inactive trigger`);

  return passed;
}

// Test 2: User removed from team
async function test2_UserRemovedFromTeam() {
  console.log('\n=== TEST 2: User removed from team ===\n');

  // Reset engagements
  run(`UPDATE engagement SET users = '["user-1", "user-2"]' WHERE team_id = 'team-1'`);

  const beforeEngs = query('SELECT id, users FROM engagement WHERE team_id = ?', ['team-1']);
  console.log('Before team update:', beforeEngs.map(e => ({ id: e.id, users: e.users })));

  // Remove user-2 from team via API
  const response = await makeRequest('/api/team/team-1', 'PATCH', {
    users: ['user-1'] // Remove user-2
  });
  console.log('API Response:', response);

  await new Promise(resolve => setTimeout(resolve, 500));

  const afterEngs = query('SELECT id, users FROM engagement WHERE team_id = ?', ['team-1']);
  console.log('After team update:', afterEngs.map(e => ({ id: e.id, users: e.users })));

  const allRemoved = afterEngs.every(e => {
    const users = JSON.parse(e.users || '[]');
    return !users.includes('user-2');
  });

  console.log(`\n${allRemoved ? '✓ PASS' : '✗ FAIL'}: User removed from team engagements`);

  return allRemoved;
}

// Test 3: Review creation sends email to partners
async function test3_ReviewCreationEmail() {
  console.log('\n=== TEST 3: Review creation sends email to Partners ===\n');

  // Clear notifications
  run('DELETE FROM notification WHERE type = ?', ['review_created']);

  // Create review via API
  const response = await makeRequest('/api/review', 'POST', {
    name: 'Test Review',
    team_id: 'team-1',
    financial_year: 2025,
    status: 'active'
  }, 'partner');

  console.log('API Response:', response);

  await new Promise(resolve => setTimeout(resolve, 500));

  const notifications = query(`
    SELECT n.*, u.email, u.role
    FROM notification n
    JOIN user u ON n.recipient_id = u.id
    WHERE n.type = 'review_created'
  `);

  console.log('Notifications created:', notifications.length);
  notifications.forEach(n => console.log(`  - To: ${n.email} (${n.role})`));

  const allPartners = notifications.every(n => n.role === 'partner');
  const hasAllPartners = notifications.length === 2; // user-3 and user-4

  console.log(`\n${allPartners && hasAllPartners ? '✓ PASS' : '✗ FAIL'}: Review creation emails sent to all partners`);

  return allPartners && hasAllPartners;
}

// Test 4: Collaborator changes trigger notifications
async function test4_CollaboratorChanges() {
  console.log('\n=== TEST 4: Collaborator changes trigger notifications ===\n');

  // Create a review first
  run(`INSERT OR IGNORE INTO review (id, name, team_id, financial_year, status, collaborators, created_at)
       VALUES ('review-1', 'Test Review', 'team-1', 2025, 'active', '[]', ${Date.now() / 1000})`);

  // Clear notifications
  run('DELETE FROM notification WHERE type IN (?, ?)', ['collaborator_added', 'collaborator_removed']);

  // Add collaborator via API
  console.log('\n--- Adding collaborator ---');
  let response = await makeRequest('/api/review/review-1', 'PATCH', {
    collaborators: ['user-1']
  }, 'partner');

  await new Promise(resolve => setTimeout(resolve, 500));

  let addedNotifs = query('SELECT * FROM notification WHERE type = ?', ['collaborator_added']);
  console.log(`Collaborator added notifications: ${addedNotifs.length}`);

  // Remove collaborator via API
  console.log('\n--- Removing collaborator ---');
  response = await makeRequest('/api/review/review-1', 'PATCH', {
    collaborators: []
  }, 'partner');

  await new Promise(resolve => setTimeout(resolve, 500));

  let removedNotifs = query('SELECT * FROM notification WHERE type = ?', ['collaborator_removed']);
  console.log(`Collaborator removed notifications: ${removedNotifs.length}`);

  const passed = addedNotifs.length > 0 && removedNotifs.length > 0;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Collaborator change notifications`);

  return passed;
}

// Test 5: RFI clerk restriction
async function test5_RfiClerkRestriction() {
  console.log('\n=== TEST 5: RFI clerk restriction (cannot force status without file/response) ===\n');

  // Create test RFI
  run(`INSERT OR IGNORE INTO rfi (id, engagement_id, question, status, files_count, response_count, created_at)
       VALUES ('rfi-1', 'eng-2', 'Test RFI', 0, 0, 0, ${Date.now() / 1000})`);

  // Test 5a: Clerk tries to complete RFI without file/response
  console.log('\n--- Clerk tries to complete RFI without file/response ---');
  let response = await makeRequest('/api/rfi/rfi-1', 'PATCH', {
    status: 1 // completed
  }, 'clerk');

  console.log('Response:', response);
  const clerkRejected = response.status === 400 || response.status === 403;
  console.log(`Clerk blocked: ${clerkRejected ? '✓' : '✗'}`);

  // Test 5b: Partner can force status
  console.log('\n--- Partner forces status without file/response ---');
  response = await makeRequest('/api/rfi/rfi-1', 'PATCH', {
    status: 1
  }, 'partner');

  console.log('Response:', response);
  const partnerAllowed = response.status === 200;
  console.log(`Partner allowed: ${partnerAllowed ? '✓' : '✗'}`);

  // Verify database state
  const rfi = get('SELECT status FROM rfi WHERE id = ?', ['rfi-1']);
  console.log(`Final RFI status: ${rfi.status}`);

  const passed = clerkRejected && partnerAllowed;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: RFI clerk restriction enforced`);

  return passed;
}

// Test 6: Atomic operations
async function test6_AtomicOperations() {
  console.log('\n=== TEST 6: Atomic operations (all-or-nothing) ===\n');

  // This is more of a conceptual test - we'll verify that partial states don't exist
  // by checking referential integrity and trigger consistency

  const orphanedEngagements = query(`
    SELECT e.id
    FROM engagement e
    LEFT JOIN client c ON e.client_id = c.id
    WHERE e.client_id IS NOT NULL AND c.id IS NULL
  `);

  const orphanedRfis = query(`
    SELECT r.id
    FROM rfi r
    LEFT JOIN engagement e ON r.engagement_id = e.id
    WHERE e.id IS NULL
  `);

  const orphanedReviews = query(`
    SELECT r.id
    FROM review r
    LEFT JOIN team t ON r.team_id = t.id
    WHERE r.team_id IS NOT NULL AND t.id IS NULL
  `);

  console.log('Orphaned engagements:', orphanedEngagements.length);
  console.log('Orphaned RFIs:', orphanedRfis.length);
  console.log('Orphaned reviews:', orphanedReviews.length);

  const passed = orphanedEngagements.length === 0 &&
                 orphanedRfis.length === 0 &&
                 orphanedReviews.length === 0;

  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: No orphaned records (atomic operations maintained)`);

  return passed;
}

// Test 7: Engagement user array sync with team
async function test7_EngagementUserArraySync() {
  console.log('\n=== TEST 7: Engagement user array syncs with team changes ===\n');

  // Create fresh engagement
  run(`INSERT OR REPLACE INTO engagement (id, name, client_id, team_id, stage, progress, repeat_interval, status, users, created_at)
       VALUES ('eng-sync-1', 'Sync Test', 'test-client-1', 'team-1', 'commencement', 0, 'once', 'active', '["user-1", "user-2", "user-3"]', ${Date.now() / 1000})`);

  const before = get('SELECT users FROM engagement WHERE id = ?', ['eng-sync-1']);
  console.log('Before team update:', before.users);

  // Remove user-1 and user-2 from team
  await makeRequest('/api/team/team-1', 'PATCH', {
    users: [] // Remove all users
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  const after = get('SELECT users FROM engagement WHERE id = ?', ['eng-sync-1']);
  console.log('After team update:', after.users);

  const afterUsers = JSON.parse(after.users || '[]');
  const removedFromEngagement = !afterUsers.includes('user-1') && !afterUsers.includes('user-2');
  const partnerStillExists = afterUsers.includes('user-3'); // Partners not auto-removed

  console.log(`Users removed from engagement: ${removedFromEngagement ? '✓' : '✗'}`);

  const passed = removedFromEngagement;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Engagement users sync with team`);

  return passed;
}

// Test 8: Notification email content validation
async function test8_NotificationEmailContent() {
  console.log('\n=== TEST 8: Notification triggers fire with correct content ===\n');

  // Clear notifications
  run('DELETE FROM notification');

  // Create review to trigger notification
  const response = await makeRequest('/api/review', 'POST', {
    name: 'Content Test Review',
    team_id: 'team-1',
    financial_year: 2025,
    status: 'active'
  }, 'partner');

  await new Promise(resolve => setTimeout(resolve, 500));

  const notifications = query('SELECT subject, content, type FROM notification WHERE type = ?', ['review_created']);

  console.log(`Notifications created: ${notifications.length}`);

  if (notifications.length > 0) {
    const first = notifications[0];
    console.log('\nSample notification:');
    console.log(`  Subject: ${first.subject}`);
    console.log(`  Type: ${first.type}`);
    console.log(`  Has content: ${first.content ? 'Yes' : 'No'}`);

    const hasSubject = first.subject && first.subject.length > 0;
    const hasContent = first.content && first.content.length > 0;

    const passed = hasSubject && hasContent && notifications.length === 2;
    console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Notification content is valid`);

    return passed;
  }

  console.log('\n✗ FAIL: No notifications created');
  return false;
}

// Main test runner
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     CLEANUP TRIGGER RULES VALIDATION TESTS             ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Wait for server to be ready
  console.log('\nWaiting for server to be ready...');
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        serverReady = true;
        console.log('✓ Server is ready');
        break;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!serverReady) {
    console.error('\n✗ FAIL: Server did not start within 30 seconds');
    process.exit(1);
  }

  await setupTestData();

  const results = {
    test1: await test1_ClientInactive(),
    test2: await test2_UserRemovedFromTeam(),
    test3: await test3_ReviewCreationEmail(),
    test4: await test4_CollaboratorChanges(),
    test5: await test5_RfiClerkRestriction(),
    test6: await test6_AtomicOperations(),
    test7: await test7_EngagementUserArraySync(),
    test8: await test8_NotificationEmailContent(),
  };

  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL RESULTS                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  const totalPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n${totalPassed}/${totalTests} tests passed`);

  db.close();

  process.exit(totalPassed === totalTests ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('\n✗ FATAL ERROR:', error);
  db.close();
  process.exit(1);
});
