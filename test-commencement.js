// Direct test using database queries
// This tests the Commencement stage transitions directly

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = '/home/user/lexco/moonlanding/data/app.db';
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const tests = {
  pass: 0,
  fail: 0,
  results: []
};

function logTest(testNum, name, status, details) {
  const symbol = status === 'PASS' ? '✓' : '✗';
  const color = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';

  console.log(`${color}${symbol}${resetColor} Test ${testNum}: ${name}`);
  console.log(`  Status: ${status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
  if (details) {
    console.log(`  Details: ${details}`);
  }
  console.log('');

  if (status === 'PASS') {
    tests.pass++;
  } else {
    tests.fail++;
  }

  tests.results.push({ testNum, name, status, details });
}

function createEngagement(name, clientId, stage, commencementDate) {
  try {
    // Insert engagement
    const stmt = db.prepare(`
      INSERT INTO engagements (name, client_id, year, stage, status, commencement_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Math.floor(Date.now() / 1000);
    const result = stmt.run(
      name,
      clientId,
      2024,
      stage,
      'active',
      commencementDate,
      now,
      now
    );

    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error creating engagement:', error.message);
    throw error;
  }
}

function getEngagement(id) {
  try {
    const stmt = db.prepare('SELECT * FROM engagements WHERE id = ?');
    return stmt.get(id);
  } catch (error) {
    console.error('Error getting engagement:', error.message);
    throw error;
  }
}

function updateEngagement(id, data) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`
      UPDATE engagements SET ${updates.join(', ')} WHERE id = ?
    `);

    return stmt.run(...values);
  } catch (error) {
    console.error('Error updating engagement:', error.message);
    throw error;
  }
}

console.log('==========================================');
console.log('TEST GROUP 2B: COMMENCEMENT STAGE');
console.log('Tests 16-17: Stage Transitions');
console.log('==========================================');
console.log('');

// Test 16: Commencement can be entered via manual move
console.log('Test 16: Commencement can be entered via auto-transition or manual move');
console.log('---');

try {
  const pastDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday
  const engId1 = createEngagement('Test Engagement 1', 'test_client_1', 'info_gathering', pastDate);
  console.log(`Created engagement: ${engId1}`);

  // Test manual transition
  console.log('Testing manual move from InfoGathering to Commencement...');
  updateEngagement(engId1, { stage: 'commencement', last_transition_at: Math.floor(Date.now() / 1000) });

  const updated = getEngagement(engId1);
  if (updated.stage === 'commencement') {
    logTest(16, 'Commencement via auto-transition or manual move', 'PASS', 'Manual transition from info_gathering to commencement succeeded');
  } else {
    logTest(16, 'Commencement via auto-transition or manual move', 'FAIL', `Manual transition resulted in stage: ${updated.stage} (expected: commencement)`);
  }
} catch (error) {
  logTest(16, 'Commencement via auto-transition or manual move', 'FAIL', `Exception: ${error.message}`);
}

console.log('');

// Test 17: Cannot move backward to InfoGathering once dates pass
console.log('Test 17: Cannot move backward to InfoGathering once dates pass');
console.log('---');

try {
  const pastDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday
  const engId2 = createEngagement('Test Engagement 2', 'test_client_2', 'commencement', pastDate);
  console.log(`Created engagement: ${engId2}`);

  // Try to move backward - This should be rejected based on the backward: [] configuration
  // The master-config.yml shows commencement stage has backward: [info_gathering]
  // So technically the transition is allowed in the config, but we need to check if there's
  // validation logic that prevents it

  console.log('Attempting backward transition to info_gathering...');
  console.log('Note: Configuration shows commencement.backward includes info_gathering');
  console.log('This test checks if the transition is allowed or blocked by validation logic');

  updateEngagement(engId2, { stage: 'info_gathering', last_transition_at: Math.floor(Date.now() / 1000) });

  const updated = getEngagement(engId2);
  if (updated.stage === 'commencement') {
    logTest(17, 'Cannot move backward to InfoGathering once dates pass', 'PASS', 'Backward transition was correctly blocked (stage: commencement)');
  } else if (updated.stage === 'info_gathering') {
    logTest(17, 'Cannot move backward to InfoGathering once dates pass', 'FAIL', 'Backward transition was allowed but should have been blocked (stage: info_gathering)');
  } else {
    logTest(17, 'Cannot move backward to InfoGathering once dates pass', 'FAIL', `Unexpected stage: ${updated.stage}`);
  }
} catch (error) {
  logTest(17, 'Cannot move backward to InfoGathering once dates pass', 'FAIL', `Exception: ${error.message}`);
}

console.log('');
console.log('==========================================');
console.log(`SUMMARY: ${tests.pass}/2 PASSING`);
console.log('==========================================');

db.close();
process.exit(tests.fail > 0 ? 1 : 0);
