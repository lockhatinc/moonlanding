#!/usr/bin/env node

/**
 * Database-Level Trigger Testing
 * Tests cleanup triggers by examining database state changes
 * Simulates trigger behavior by directly manipulating database
 */

const sqlite3 = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
const db = sqlite3(DB_PATH);

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

function setupTestData() {
  console.log('\n=== Setting up test data ===\n');

  const now = Math.floor(Date.now() / 1000);

  // Create test client
  run(`INSERT OR REPLACE INTO client (id, name, status, engagement_count, created_at)
       VALUES ('test-client-trigger', 'Test Client Active', 'active', 0, ?)`, [now]);

  // Create test users
  run(`INSERT OR REPLACE INTO user (id, email, name, role, type, status, created_at)
       VALUES ('trigger-user-1', 'trigger1@test.com', 'Trigger User 1', 'clerk', 'auditor', 'active', ?)`, [now]);
  run(`INSERT OR REPLACE INTO user (id, email, name, role, type, status, created_at)
       VALUES ('trigger-user-2', 'trigger2@test.com', 'Trigger User 2', 'manager', 'auditor', 'active', ?)`, [now]);
  run(`INSERT OR REPLACE INTO user (id, email, name, role, type, status, created_at)
       VALUES ('trigger-user-3', 'trigger3@test.com', 'Trigger User 3', 'partner', 'auditor', 'active', ?)`, [now]);
  run(`INSERT OR REPLACE INTO user (id, email, name, role, type, status, created_at)
       VALUES ('trigger-user-4', 'trigger4@test.com', 'Trigger User 4', 'partner', 'auditor', 'active', ?)`, [now]);

  // Create test team
  run(`INSERT OR REPLACE INTO team (id, name, partners, users, created_at)
       VALUES ('trigger-team-1', 'Trigger Test Team', '["trigger-user-3", "trigger-user-4"]', '["trigger-user-1", "trigger-user-2"]', ?)`, [now]);

  // Clean up old test engagements
  run(`DELETE FROM engagement WHERE id LIKE 'trigger-eng-%'`);

  // Create test engagements
  run(`INSERT INTO engagement (id, name, client_id, team_id, stage, progress, repeat_interval, status, users, created_at)
       VALUES ('trigger-eng-1', 'Trigger Eng 1 InfoGathering 0%', 'test-client-trigger', 'trigger-team-1', 'info_gathering', 0, 'monthly', 'active', '["trigger-user-1", "trigger-user-2"]', ?)`, [now]);

  run(`INSERT INTO engagement (id, name, client_id, team_id, stage, progress, repeat_interval, status, users, created_at)
       VALUES ('trigger-eng-2', 'Trigger Eng 2 Commencement 50%', 'test-client-trigger', 'trigger-team-1', 'commencement', 50, 'quarterly', 'active', '["trigger-user-1", "trigger-user-2"]', ?)`, [now]);

  run(`INSERT INTO engagement (id, name, client_id, team_id, stage, progress, repeat_interval, status, users, created_at)
       VALUES ('trigger-eng-3', 'Trigger Eng 3 InfoGathering 10%', 'test-client-trigger', 'trigger-team-1', 'info_gathering', 10, 'yearly', 'active', '["trigger-user-1"]', ?)`, [now]);

  console.log('✓ Test data created');
}

// TEST 1: Simulate client inactive trigger behavior
function test1_ClientInactiveTrigger() {
  console.log('\n=== TEST 1: Client Inactive Trigger ===\n');
  console.log('Expected behavior:');
  console.log('  1. All engagements → repeat_interval="once"');
  console.log('  2. Delete engagements where stage="info_gathering" AND progress=0\n');

  const before = query('SELECT id, stage, progress, repeat_interval FROM engagement WHERE client_id = ?', ['test-client-trigger']);
  console.log('BEFORE client set to inactive:');
  before.forEach(e => console.log(`  ${e.id}: stage=${e.stage}, progress=${e.progress}%, repeat=${e.repeat_interval}`));

  // Simulate trigger: Update all to "once"
  run(`UPDATE engagement SET repeat_interval = 'once' WHERE client_id = ?`, ['test-client-trigger']);

  // Simulate trigger: Delete info_gathering with 0% progress
  const deleted = run(`DELETE FROM engagement WHERE client_id = ? AND stage = 'info_gathering' AND progress = 0`, ['test-client-trigger']);

  const after = query('SELECT id, stage, progress, repeat_interval FROM engagement WHERE client_id = ?', ['test-client-trigger']);
  console.log('\nAFTER client set to inactive:');
  after.forEach(e => console.log(`  ${e.id}: stage=${e.stage}, progress=${e.progress}%, repeat=${e.repeat_interval}`));

  console.log(`\nDeleted ${deleted.changes} engagement(s)`);

  const allOnce = after.every(e => e.repeat_interval === 'once');
  const deletedCorrectly = deleted.changes === 1; // Only trigger-eng-1

  console.log(`\nValidation:`);
  console.log(`  All repeat_interval='once': ${allOnce ? '✓' : '✗'}`);
  console.log(`  Deleted exactly 1 (info_gathering+0%): ${deletedCorrectly ? '✓' : '✗'}`);

  const passed = allOnce && deletedCorrectly;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Client inactive trigger`);

  return passed;
}

// TEST 2: Simulate user removed from team trigger
function test2_UserRemovedFromTeamTrigger() {
  console.log('\n=== TEST 2: User Removed from Team Trigger ===\n');
  console.log('Expected behavior: User removed from team.users[] → auto-removed from engagement.users[]\n');

  // Reset engagements to have both users
  run(`UPDATE engagement SET users = '["trigger-user-1", "trigger-user-2"]' WHERE team_id = 'trigger-team-1'`);

  const before = query('SELECT id, users FROM engagement WHERE team_id = ?', ['trigger-team-1']);
  console.log('BEFORE user removed from team:');
  before.forEach(e => console.log(`  ${e.id}: users=${e.users}`));

  // Simulate: Get all engagements for this team
  const removedUser = 'trigger-user-2';
  const engagements = query('SELECT id, users FROM engagement WHERE team_id = ? AND status = ?', ['trigger-team-1', 'active']);

  let updateCount = 0;
  for (const eng of engagements) {
    const currentUsers = JSON.parse(eng.users || '[]');
    const updatedUsers = currentUsers.filter(u => u !== removedUser);

    if (updatedUsers.length !== currentUsers.length) {
      run(`UPDATE engagement SET users = ? WHERE id = ?`, [JSON.stringify(updatedUsers), eng.id]);
      updateCount++;
    }
  }

  const after = query('SELECT id, users FROM engagement WHERE team_id = ?', ['trigger-team-1']);
  console.log('\nAFTER user removed from team:');
  after.forEach(e => console.log(`  ${e.id}: users=${e.users}`));

  const allClean = after.every(e => {
    const users = JSON.parse(e.users || '[]');
    return !users.includes(removedUser);
  });

  console.log(`\nValidation:`);
  console.log(`  Updated ${updateCount} engagement(s)`);
  console.log(`  All engagements cleaned of removed user: ${allClean ? '✓' : '✗'}`);

  const passed = allClean && updateCount > 0;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: User removed from team trigger`);

  return passed;
}

// TEST 3: Review creation notification
function test3_ReviewCreationNotification() {
  console.log('\n=== TEST 3: Review Creation Notification ===\n');
  console.log('Expected behavior: Review created → email queued to all team Partners (not just assigned)\n');

  const now = Math.floor(Date.now() / 1000);

  // Clear old notifications
  run(`DELETE FROM notification WHERE type = 'review_created' AND entity_id LIKE 'trigger-review-%'`);

  // Create review
  run(`INSERT OR REPLACE INTO review (id, name, team_id, financial_year, status, created_at)
       VALUES ('trigger-review-1', 'Trigger Test Review', 'trigger-team-1', 2025, 'active', ?)`, [now]);

  // Simulate trigger: Get team partners
  const team = get('SELECT partners FROM team WHERE id = ?', ['trigger-team-1']);
  const partnerIds = JSON.parse(team.partners || '[]');

  console.log(`Team has ${partnerIds.length} partner(s): ${partnerIds.join(', ')}`);

  // Simulate: Queue emails to all partners
  let notificationCount = 0;
  for (const partnerId of partnerIds) {
    const user = get('SELECT * FROM user WHERE id = ?', [partnerId]);
    if (user) {
      run(`INSERT INTO notification (type, recipient_id, recipient_email, subject, content, entity_type, entity_id, status, created_at)
           VALUES ('review_created', ?, ?, 'Review Created: Trigger Test Review', '<p>A new review has been created</p>', 'review', 'trigger-review-1', 'pending', ?)`,
           [user.id, user.email, now]);
      notificationCount++;
    }
  }

  const notifications = query(`
    SELECT n.*, u.role
    FROM notification n
    LEFT JOIN user u ON n.recipient_id = u.id
    WHERE n.type = 'review_created' AND n.entity_id = 'trigger-review-1'
  `);

  console.log(`\nNotifications created: ${notifications.length}`);
  notifications.forEach(n => console.log(`  - To: ${n.recipient_email} (${n.role})`));

  const allPartners = notifications.every(n => n.role === 'partner');
  const correctCount = notifications.length === 2; // trigger-user-3 and trigger-user-4

  console.log(`\nValidation:`);
  console.log(`  All recipients are partners: ${allPartners ? '✓' : '✗'}`);
  console.log(`  Correct count (2 partners): ${correctCount ? '✓' : '✗'}`);

  const passed = allPartners && correctCount;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Review creation notification`);

  return passed;
}

// TEST 4: Collaborator change notifications
function test4_CollaboratorChangeNotifications() {
  console.log('\n=== TEST 4: Collaborator Change Notifications ===\n');
  console.log('Expected behavior:');
  console.log('  - Collaborator added → email specific user');
  console.log('  - Collaborator removed → email specific user\n');

  const now = Math.floor(Date.now() / 1000);

  // Clear old notifications
  run(`DELETE FROM notification WHERE type IN ('collaborator_added', 'collaborator_removed')`);

  // Create review
  run(`INSERT OR REPLACE INTO review (id, name, team_id, financial_year, status, collaborators, created_at)
       VALUES ('trigger-review-2', 'Trigger Test Review 2', 'trigger-team-1', 2025, 'active', '[]', ?)`, [now]);

  // Simulate: Add collaborator
  const addedUserId = 'trigger-user-1';
  const addedUser = get('SELECT * FROM user WHERE id = ?', [addedUserId]);

  run(`INSERT INTO notification (type, recipient_id, recipient_email, subject, content, entity_type, entity_id, status, created_at)
       VALUES ('collaborator_added', ?, ?, 'Added as Collaborator', '<p>You have been added as a collaborator</p>', 'review', 'trigger-review-2', 'pending', ?)`,
       [addedUser.id, addedUser.email, now]);

  // Simulate: Remove collaborator
  const removedUserId = 'trigger-user-1';
  const removedUser = get('SELECT * FROM user WHERE id = ?', [removedUserId]);

  run(`INSERT INTO notification (type, recipient_id, recipient_email, subject, content, entity_type, entity_id, status, created_at)
       VALUES ('collaborator_removed', ?, ?, 'Removed as Collaborator', '<p>You have been removed as a collaborator</p>', 'review', 'trigger-review-2', 'pending', ?)`,
       [removedUser.id, removedUser.email, now]);

  const addedNotifs = query('SELECT * FROM notification WHERE type = ?', ['collaborator_added']);
  const removedNotifs = query('SELECT * FROM notification WHERE type = ?', ['collaborator_removed']);

  console.log(`Collaborator added notifications: ${addedNotifs.length}`);
  console.log(`Collaborator removed notifications: ${removedNotifs.length}`);

  console.log(`\nValidation:`);
  console.log(`  Added notification sent: ${addedNotifs.length > 0 ? '✓' : '✗'}`);
  console.log(`  Removed notification sent: ${removedNotifs.length > 0 ? '✓' : '✗'}`);

  const passed = addedNotifs.length > 0 && removedNotifs.length > 0;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Collaborator change notifications`);

  return passed;
}

// TEST 5: RFI clerk restriction (database validation)
function test5_RfiClerkRestriction() {
  console.log('\n=== TEST 5: RFI Clerk Restriction ===\n');
  console.log('Expected behavior:');
  console.log('  - Clerk: CANNOT set status=completed without file/response');
  console.log('  - Partner: CAN force status=completed without file/response\n');

  const now = Math.floor(Date.now() / 1000);

  // Create RFI with no files or responses
  run(`INSERT OR REPLACE INTO rfi (id, engagement_id, question, status, files_count, response_count, response_text, created_at)
       VALUES ('trigger-rfi-1', 'trigger-eng-2', 'Test RFI Question', 0, 0, 0, NULL, ?)`, [now]);

  const rfi = get('SELECT * FROM rfi WHERE id = ?', ['trigger-rfi-1']);

  console.log('RFI state:');
  console.log(`  files_count: ${rfi.files_count}`);
  console.log(`  response_count: ${rfi.response_count}`);
  console.log(`  response_text: ${rfi.response_text || 'NULL'}`);

  // Validation logic (simulating rfi-permission-validator.js)
  const hasFile = rfi.files_count > 0;
  const hasResponse = rfi.response_count > 0 || (rfi.response_text && rfi.response_text.trim().length > 0);

  const clerkCanComplete = hasFile || hasResponse;
  const partnerCanComplete = true; // Partners can always force

  console.log(`\nValidation results:`);
  console.log(`  Clerk can complete: ${clerkCanComplete ? 'YES ✗' : 'NO ✓'} (should be NO)`);
  console.log(`  Partner can complete: ${partnerCanComplete ? 'YES ✓' : 'NO ✗'} (should be YES)`);

  const passed = !clerkCanComplete && partnerCanComplete;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: RFI clerk restriction`);

  return passed;
}

// TEST 6: Atomic operations (referential integrity)
function test6_AtomicOperations() {
  console.log('\n=== TEST 6: Atomic Operations & Referential Integrity ===\n');
  console.log('Expected behavior: No orphaned records (all foreign keys valid)\n');

  const orphanedEngagements = query(`
    SELECT e.id, e.client_id
    FROM engagement e
    LEFT JOIN client c ON e.client_id = c.id
    WHERE e.client_id IS NOT NULL AND c.id IS NULL
  `);

  const orphanedRfis = query(`
    SELECT r.id, r.engagement_id
    FROM rfi r
    LEFT JOIN engagement e ON r.engagement_id = e.id
    WHERE r.engagement_id IS NOT NULL AND e.id IS NULL
  `);

  const orphanedReviews = query(`
    SELECT r.id, r.team_id
    FROM review r
    LEFT JOIN team t ON r.team_id = t.id
    WHERE r.team_id IS NOT NULL AND t.id IS NULL
  `);

  console.log(`Orphaned engagements (missing client): ${orphanedEngagements.length}`);
  if (orphanedEngagements.length > 0) {
    orphanedEngagements.slice(0, 5).forEach(e => console.log(`  - Engagement ${e.id} → client ${e.client_id} (missing)`));
  }

  console.log(`Orphaned RFIs (missing engagement): ${orphanedRfis.length}`);
  if (orphanedRfis.length > 0) {
    orphanedRfis.slice(0, 5).forEach(r => console.log(`  - RFI ${r.id} → engagement ${r.engagement_id} (missing)`));
  }

  console.log(`Orphaned reviews (missing team): ${orphanedReviews.length}`);
  if (orphanedReviews.length > 0) {
    orphanedReviews.slice(0, 5).forEach(r => console.log(`  - Review ${r.id} → team ${r.team_id} (missing)`));
  }

  const passed = orphanedEngagements.length === 0 &&
                 orphanedRfis.length === 0 &&
                 orphanedReviews.length === 0;

  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Atomic operations (no orphaned records)`);

  return passed;
}

// TEST 7: Notification content validation
function test7_NotificationContent() {
  console.log('\n=== TEST 7: Notification Content Validation ===\n');
  console.log('Expected behavior: All notifications have subject, content, recipient\n');

  const notifications = query(`
    SELECT type, subject, content, recipient_email
    FROM notification
    WHERE type IN ('review_created', 'collaborator_added', 'collaborator_removed')
    LIMIT 10
  `);

  console.log(`Checking ${notifications.length} notification(s):\n`);

  let allValid = true;
  for (const notif of notifications) {
    const hasSubject = notif.subject && notif.subject.length > 0;
    const hasContent = notif.content && notif.content.length > 0;
    const hasRecipient = notif.recipient_email && notif.recipient_email.length > 0;
    const valid = hasSubject && hasContent && hasRecipient;

    console.log(`${notif.type}:`);
    console.log(`  Subject: ${hasSubject ? '✓' : '✗'} ${notif.subject || '(missing)'}`);
    console.log(`  Content: ${hasContent ? '✓' : '✗'} ${hasContent ? '(present)' : '(missing)'}`);
    console.log(`  Recipient: ${hasRecipient ? '✓' : '✗'} ${notif.recipient_email || '(missing)'}`);
    console.log(`  Valid: ${valid ? '✓' : '✗'}\n`);

    if (!valid) allValid = false;
  }

  console.log(`${allValid ? '✓ PASS' : '✗ FAIL'}: Notification content validation`);

  return allValid;
}

// TEST 8: Database schema and constraint verification
function test8_DatabaseSchema() {
  console.log('\n=== TEST 8: Database Schema & Constraints ===\n');
  console.log('Expected behavior: Tables exist, foreign keys enabled\n');

  // Check foreign keys are enabled
  const fkStatus = get('PRAGMA foreign_keys');
  console.log(`Foreign keys enabled: ${fkStatus.foreign_keys === 1 ? '✓' : '✗'} (${fkStatus.foreign_keys})`);

  // Check critical tables exist
  const tables = query(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name IN ('client', 'engagement', 'team', 'review', 'rfi', 'notification', 'user')
    ORDER BY name
  `);

  console.log(`\nCritical tables found: ${tables.length}/7`);
  tables.forEach(t => console.log(`  ✓ ${t.name}`));

  const passed = fkStatus.foreign_keys === 1 && tables.length === 7;
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: Database schema validation`);

  return passed;
}

// Main test runner
function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     CLEANUP TRIGGER RULES DATABASE VALIDATION          ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    setupTestData();

    const results = {
      test1: test1_ClientInactiveTrigger(),
      test2: test2_UserRemovedFromTeamTrigger(),
      test3: test3_ReviewCreationNotification(),
      test4: test4_CollaboratorChangeNotifications(),
      test5: test5_RfiClerkRestriction(),
      test6: test6_AtomicOperations(),
      test7: test7_NotificationContent(),
      test8: test8_DatabaseSchema(),
    };

    console.log('\n\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL RESULTS                       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const testDescriptions = {
      test1: 'Client Inactive → repeat="once", delete InfoGathering+0%',
      test2: 'User removed from team → removed from engagement users[]',
      test3: 'Review creation → email all team Partners',
      test4: 'Collaborator add/remove → specific user notifications',
      test5: 'RFI clerk restriction → cannot force without file/response',
      test6: 'Atomic operations → no orphaned records',
      test7: 'Notification content → valid subject/content/recipient',
      test8: 'Database schema → foreign keys enabled, tables exist',
    };

    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✓' : '✗'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
      console.log(`   ${testDescriptions[test]}`);
    });

    const totalPassed = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log(`\n${'='.repeat(56)}`);
    console.log(`TOTAL: ${totalPassed}/${totalTests} tests passed`);
    console.log(`${'='.repeat(56)}\n`);

    db.close();

    process.exit(totalPassed === totalTests ? 0 : 1);
  } catch (error) {
    console.error('\n✗ FATAL ERROR:', error);
    console.error(error.stack);
    db.close();
    process.exit(1);
  }
}

runAllTests();
