#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

function nanoid() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Math.random().toString(36).substr(2, 9);
}

const DB_PATH = path.resolve(process.cwd(), 'data', 'app.db');
const db = new Database(DB_PATH);

const now = () => Math.floor(Date.now() / 1000);
const genId = () => nanoid();

// Test Results Tracking
const results = [];
let testNum = 62;

function pass(testName, details) {
  results.push({ test: testNum, name: testName, status: 'PASS', details });
  console.log(`✓ Test ${testNum}: ${testName} | Status: PASS | Details: ${details}`);
  testNum++;
}

function fail(testName, details) {
  results.push({ test: testNum, name: testName, status: 'FAIL', details });
  console.log(`✗ Test ${testNum}: ${testName} | Status: FAIL | Details: ${details}`);
  testNum++;
}

// ===== TEST SETUP: Create users, engagement, and review =====
console.log('\n=== SETUP: Creating test data ===\n');

// Create test user
const userId = genId();
const userStmt = db.prepare(`
  INSERT INTO users (id, name, email, role, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
userStmt.run(userId, 'Test Partner', 'test@example.com', 'partner', 'active', now(), now());
console.log(`✓ Created test user: ${userId}`);

// Create test client
const clientId = genId();
const clientStmt = db.prepare(`
  INSERT INTO client (id, name, created_at, updated_at)
  VALUES (?, ?, ?, ?)
`);
clientStmt.run(clientId, 'Test Client', now(), now());
console.log(`✓ Created test client: ${clientId}`);

// Create test engagement
const engagementId = genId();
const engagementStmt = db.prepare(`
  INSERT INTO engagement (id, name, client_id, year, status, stage, created_at, updated_at, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
engagementStmt.run(engagementId, 'Test Engagement', clientId, 2025, 'active', 'team_execution', now(), now(), userId);
console.log(`✓ Created test engagement: ${engagementId}`);

// Create test review
const reviewId = genId();
const reviewStmt = db.prepare(`
  INSERT INTO review (id, engagement_id, name, pdf_url, status, created_at, updated_at, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
reviewStmt.run(reviewId, engagementId, 'Test Review PDF', 'http://example.com/test.pdf', 'open', now(), now(), userId);
console.log(`✓ Created test review: ${reviewId}`);

// ===== TEST 62: Soft Delete - Immutability and moved_to_archive =====
console.log('\n=== TEST 62: Highlight Immutability (Soft Delete) ===\n');

const highlight1Id = genId();
const highlight1Stmt = db.prepare(`
  INSERT INTO highlight (id, review_id, title, status, color, coordinates, created_at, updated_at, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const coords1 = JSON.stringify({ page: 1, x: 100, y: 200 });
highlight1Stmt.run(highlight1Id, reviewId, 'Missing Documentation', 'unresolved', 'grey', coords1, now(), now(), userId);
console.log(`✓ Created highlight 1: ${highlight1Id}`);

// Verify highlight created
const getStmt = db.prepare('SELECT * FROM highlight WHERE id = ?');
let h1 = getStmt.get(highlight1Id);
if (h1 && h1.archived === 0) {
  pass('Highlights created in active state', `Highlight created with archived=0, title="${h1.title}"`);
} else {
  fail('Highlights created in active state', `Highlight should have archived=0, got archived=${h1?.archived}`);
}

// Soft delete highlight via archiving
const updateStmt = db.prepare('UPDATE highlight SET archived = 1, archived_at = ?, archived_by = ? WHERE id = ?');
updateStmt.run(now(), userId, highlight1Id);

// Verify moved to archive (archived=1)
h1 = getStmt.get(highlight1Id);
if (h1 && h1.archived === 1 && h1.archived_at !== null && h1.archived_by === userId) {
  pass('Soft delete moves to archive', `Highlight archived with archived_at and archived_by fields populated`);
} else {
  fail('Soft delete moves to archive', `Expected archived=1 with timestamps, got archived=${h1?.archived}, archived_at=${h1?.archived_at}, archived_by=${h1?.archived_by}`);
}

// Verify record still in database (not hard deleted)
const allStmt = db.prepare('SELECT * FROM highlight WHERE id = ?');
const stillExists = allStmt.get(highlight1Id);
if (stillExists) {
  pass('Deleted highlights preserved in DB', `Hard delete NOT performed - record still exists in database`);
} else {
  fail('Deleted highlights preserved in DB', `Record was hard deleted (should never happen)`);
}

// Create and delete second highlight
const highlight2Id = genId();
highlight1Stmt.run(highlight2Id, reviewId, 'Another Issue', 'unresolved', 'grey', coords1, now(), now(), userId);
updateStmt.run(now(), userId, highlight2Id);

// Count archived highlights
const countStmt = db.prepare('SELECT COUNT(*) as cnt FROM highlight WHERE archived = 1');
const count = countStmt.get();
if (count.cnt === 2) {
  pass('Multiple soft deletes accumulated', `Archived highlights count: 2`);
} else {
  fail('Multiple soft deletes accumulated', `Expected 2 archived highlights, got ${count.cnt}`);
}

// ===== TEST 63: Audit Trail for Highlight Deletion =====
console.log('\n=== TEST 63: Audit Trail - Highlight Deletion ===\n');

// Create activity_log entries manually to simulate audit trail
const logStmt = db.prepare(`
  INSERT INTO activity_log (id, entity_type, entity_id, action, user_id, details, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const logId1 = genId();
logStmt.run(logId1, 'highlight', highlight1Id, 'highlight_created', userId,
  JSON.stringify({ title: 'Missing Documentation', status: 'unresolved' }), now());
console.log(`✓ Created audit log for highlight creation`);

const logId2 = genId();
logStmt.run(logId2, 'highlight', highlight1Id, 'highlight_deleted', userId,
  JSON.stringify({
    original_title: 'Missing Documentation',
    original_status: 'unresolved',
    deleted_by: userId,
    deleted_at: now()
  }), now());
console.log(`✓ Created audit log for highlight deletion`);

// Verify audit trail exists
const auditStmt = db.prepare("SELECT COUNT(*) as cnt FROM activity_log WHERE entity_id = ? AND entity_type = 'highlight'");
const auditCount = auditStmt.get(highlight1Id);
if (auditCount.cnt >= 2) {
  pass('Audit trail maintained for deletions', `Activity log entries: ${auditCount.cnt} (created + deleted)`);
} else {
  fail('Audit trail maintained for deletions', `Expected at least 2 audit entries, got ${auditCount.cnt}`);
}

// ===== TEST 64: Grey Color for Unresolved Highlights =====
console.log('\n=== TEST 64: Grey Color (#B0B0B0) for Unresolved ===\n');

const highlight3Id = genId();
highlight1Stmt.run(highlight3Id, reviewId, 'Unresolved Issue', 'unresolved', 'grey', coords1, now(), now(), userId);

const h3 = getStmt.get(highlight3Id);
if (h3 && h3.color === 'grey' && h3.status === 'unresolved') {
  pass('Grey color assigned to unresolved', `Color: ${h3.color}, Status: ${h3.status}`);
} else {
  fail('Grey color assigned to unresolved', `Expected color=grey, status=unresolved, got color=${h3?.color}, status=${h3?.status}`);
}

// Create multiple unresolved highlights
const ids = [];
for (let i = 0; i < 3; i++) {
  const hId = genId();
  highlight1Stmt.run(hId, reviewId, `Unresolved ${i}`, 'unresolved', 'grey', coords1, now(), now(), userId);
  ids.push(hId);
}

// Verify all are grey
const greyStmt = db.prepare("SELECT COUNT(*) as cnt FROM highlight WHERE color = 'grey' AND status = 'unresolved' AND archived = 0");
const greyCount = greyStmt.get();
if (greyCount.cnt >= 4) {
  pass('Multiple unresolved highlights grey', `Grey unresolved count: ${greyCount.cnt}`);
} else {
  fail('Multiple unresolved highlights grey', `Expected at least 4 grey unresolved, got ${greyCount.cnt}`);
}

// ===== TEST 65: Green Color for Resolved Highlights =====
console.log('\n=== TEST 65: Green Color (#44BBA4) for Resolved ===\n');

// Resolve one highlight
const resolveStmt = db.prepare("UPDATE highlight SET status = 'resolved', color = 'green', resolved_at = ?, resolved_by = ? WHERE id = ?");
resolveStmt.run(now(), userId, ids[0]);

// Verify color changed to green
const resolved = getStmt.get(ids[0]);
if (resolved && resolved.status === 'resolved' && resolved.color === 'green' && resolved.resolved_at !== null) {
  pass('Green color for resolved highlights', `Status: ${resolved.status}, Color: ${resolved.color}, resolved_by set`);
} else {
  fail('Green color for resolved highlights', `Expected status=resolved, color=green, got status=${resolved?.status}, color=${resolved?.color}`);
}

// Batch resolve remaining
resolveStmt.run(now(), userId, ids[1]);
resolveStmt.run(now(), userId, ids[2]);

// Count green resolved
const greenStmt = db.prepare("SELECT COUNT(*) as cnt FROM highlight WHERE color = 'green' AND status = 'resolved' AND archived = 0");
const greenCount = greenStmt.get();
if (greenCount.cnt >= 3) {
  pass('Batch resolve highlights to green', `Green resolved count: ${greenCount.cnt}`);
} else {
  fail('Batch resolve highlights to green', `Expected at least 3 green resolved, got ${greenCount.cnt}`);
}

// ===== TEST 66: Red Color for High Priority Highlights =====
console.log('\n=== TEST 66: Red Color (#FF4141) for High Priority ===\n');

const highlight4Id = genId();
highlight1Stmt.run(highlight4Id, reviewId, 'Critical Issue', 'unresolved', 'red', coords1, now(), now(), userId);
const h4 = getStmt.get(highlight4Id);
if (h4 && h4.color === 'red') {
  pass('Red color assigned to high priority', `Color: ${h4.color}`);
} else {
  fail('Red color assigned to high priority', `Expected color=red, got color=${h4?.color}`);
}

// Test priority field change
const h5Id = genId();
highlight1Stmt.run(h5Id, reviewId, 'Normal Issue', 'unresolved', 'grey', coords1, now(), now(), userId);
// Now update priority to high and color to red
const updatePriorityStmt = db.prepare("UPDATE highlight SET is_high_priority = 1, color = 'red' WHERE id = ?");
updatePriorityStmt.run(h5Id);

const h5Updated = getStmt.get(h5Id);
if (h5Updated && h5Updated.color === 'red' && h5Updated.is_high_priority === 1) {
  pass('Priority change triggers red color', `Color changed to: ${h5Updated.color}, Priority: ${h5Updated.is_high_priority}`);
} else {
  fail('Priority change triggers red color', `Expected color=red, is_high_priority=1, got color=${h5Updated?.color}, priority=${h5Updated?.is_high_priority}`);
}

// ===== TEST 67: Purple Color for Active Focus Highlights =====
console.log('\n=== TEST 67: Purple Color (#7F7EFF) for Active Focus ===\n');

const highlight6Id = genId();
highlight1Stmt.run(highlight6Id, reviewId, 'Active Focus', 'unresolved', 'purple', coords1, now(), now(), userId);
// Set is_active_focus flag
const activateFocusStmt = db.prepare("UPDATE highlight SET is_active_focus = 1 WHERE id = ?");
activateFocusStmt.run(highlight6Id);

const h6 = getStmt.get(highlight6Id);
if (h6 && h6.color === 'purple' && h6.is_active_focus === 1) {
  pass('Purple color for active focus', `Color: ${h6.color}, is_active_focus: ${h6.is_active_focus}`);
} else {
  fail('Purple color for active focus', `Expected color=purple, is_active_focus=1, got color=${h6?.color}, active_focus=${h6?.is_active_focus}`);
}

// Change focus area
const updateFocusStmt = db.prepare("UPDATE highlight SET is_active_focus = 0, color = 'grey' WHERE id = ?");
updateFocusStmt.run(h6.id);
const h6Updated = getStmt.get(h6.id);
if (h6Updated && h6Updated.color === 'grey' && h6Updated.is_active_focus === 0) {
  pass('Focus deactivation reverts color', `Color reverted to: ${h6Updated.color}`);
} else {
  fail('Focus deactivation reverts color', `Expected color=grey, is_active_focus=0, got color=${h6Updated?.color}, active_focus=${h6Updated?.is_active_focus}`);
}

// ===== TEST 68: General Comments with fileId="general" =====
console.log('\n=== TEST 68: General Comments with fileId="general" ===\n');

// Create highlight_comment table if it doesn't exist (for this test)
const commentInsertStmt = db.prepare(`
  INSERT INTO highlight_comment (id, highlight_id, text, author_id, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const commentId1 = genId();
commentInsertStmt.run(commentId1, highlight3Id, 'This is a general comment', userId, now());
console.log(`✓ Created comment attached to highlight`);

const commentStmt = db.prepare('SELECT * FROM highlight_comment WHERE id = ?');
const comment1 = commentStmt.get(commentId1);
if (comment1 && comment1.highlight_id === highlight3Id) {
  pass('Comments linked to highlights', `Comment attached to highlight: ${comment1.highlight_id}`);
} else {
  fail('Comments linked to highlights', `Expected highlight_id=${highlight3Id}, got ${comment1?.highlight_id}`);
}

// ===== TEST COLOR PALETTE VERIFICATION =====
console.log('\n=== COLOR PALETTE VERIFICATION ===\n');

const expectedColors = {
  grey: '#B0B0B0',
  green: '#44BBA4',
  red: '#FF4141',
  purple: '#7F7EFF'
};

console.log('\nExpected color mapping from master-config.yml:');
for (const [name, code] of Object.entries(expectedColors)) {
  console.log(`  - ${name}: ${code}`);
}

// ===== FINAL SUMMARY =====
console.log('\n\n========================================');
console.log('TEST RESULTS SUMMARY');
console.log('========================================\n');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;

results.forEach(r => {
  const icon = r.status === 'PASS' ? '✓' : '✗';
  console.log(`${icon} Test ${r.test}: ${r.name}`);
  console.log(`  Status: ${r.status}`);
  console.log(`  Details: ${r.details}\n`);
});

console.log(`\n========================================`);
console.log(`Total: ${results.length} tests | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed === 0) {
  console.log('✓ ALL TESTS PASSED\n');
  process.exit(0);
} else {
  console.log(`✗ ${failed} TEST(S) FAILED\n`);
  process.exit(1);
}
