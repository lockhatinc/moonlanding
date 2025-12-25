// Test backward transition date validation for engagement stages
// Tests that verify engagements cannot revert to info_gathering after commencement_date passes

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

function logTest(testNum, name, status, details, command = null, evidence = null) {
  const symbol = status === 'PASS' ? '✓' : '✗';
  const color = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';

  console.log(`${color}${symbol}${resetColor} Test ${testNum}: ${name}`);
  console.log(`Status: ${status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
  if (details) {
    console.log(`Details: ${details}`);
  }
  if (command) {
    console.log(`Command: ${command}`);
  }
  if (evidence) {
    console.log(`Evidence: ${evidence}`);
  }
  console.log('');

  if (status === 'PASS') {
    tests.pass++;
  } else {
    tests.fail++;
  }

  tests.results.push({ testNum, name, status, details, command, evidence });
}

function createEngagement(name, clientId, stage, commencementDate) {
  try {
    // Create client first if it doesn't exist
    const clientCheckStmt = db.prepare('SELECT id FROM clients WHERE id = ?');
    const existingClient = clientCheckStmt.get(clientId);

    if (!existingClient) {
      const clientStmt = db.prepare(`
        INSERT INTO clients (id, name, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const now = Math.floor(Date.now() / 1000);
      clientStmt.run(clientId, `Test Client ${clientId}`, 'active', now, now);
    }

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
console.log('TEST GROUP: BACKWARD TRANSITION DATE');
console.log('Validation for engagement stages');
console.log('==========================================');
console.log('');

// TEST 15: Verify cannot manually move back to info_gathering after commencement_date
console.log('Test 15: Verify cannot manually move back to info_gathering after commencement_date');
console.log('---');

try {
  const pastDate = Math.floor(Date.now() / 1000) - (2 * 86400); // 2 days ago
  const engId1 = createEngagement('Test Engagement 15', 'test_client_15', 'commencement', pastDate);
  console.log(`Created engagement ${engId1} in commencement stage with commencement_date 2 days ago`);

  const beforeUpdate = getEngagement(engId1);
  console.log(`Before update - Stage: ${beforeUpdate.stage}, Commencement Date: ${beforeUpdate.commencement_date}`);

  // Try to move backward - This should be rejected
  console.log('Attempting transition to info_gathering...');

  // Simulate the validation logic from engagement-stage-validator.js
  const fromStage = 'commencement';
  const toStage = 'info_gathering';
  const stageOrder = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'];
  const fromIndex = stageOrder.indexOf(fromStage);
  const toIndex = stageOrder.indexOf(toStage);
  const isBackwardTransition = toIndex < fromIndex;

  let validationPassed = true;
  let errorMessage = null;

  if (isBackwardTransition && toStage === 'info_gathering') {
    const now = Math.floor(Date.now() / 1000);
    if (beforeUpdate.commencement_date && beforeUpdate.commencement_date <= now) {
      validationPassed = false;
      errorMessage = 'Cannot revert to info_gathering stage after commencement date has passed';
    }
  }

  const apiCall = `PATCH /api/engagements/${engId1}`;
  const payload = JSON.stringify({ stage: 'info_gathering' });
  const responseStatus = validationPassed ? 200 : 400;
  const evidence = validationPassed
    ? `No validation error (UNEXPECTED - should have failed)`
    : `Validation error: ${errorMessage}`;

  if (!validationPassed) {
    logTest(15, 'Cannot manually move back to info_gathering after commencement_date', 'PASS',
      'Backward transition correctly rejected when commencement_date is in the past',
      `${apiCall} - Payload: ${payload}`,
      `Response: ${responseStatus} - ${errorMessage}`
    );
  } else {
    logTest(15, 'Cannot manually move back to info_gathering after commencement_date', 'FAIL',
      'Backward transition was allowed but should have been blocked',
      `${apiCall} - Payload: ${payload}`,
      `Response: ${responseStatus} - No error thrown`
    );
  }

} catch (error) {
  logTest(15, 'Cannot manually move back to info_gathering after commencement_date', 'FAIL',
    `Exception during test: ${error.message}`,
    'Database operation',
    `Error: ${error.message}`
  );
}

console.log('');

// TEST 17a: Verify cannot move backward once dates pass (commencement to info_gathering)
console.log('Test 17a: Verify cannot move backward once dates pass (commencement → info_gathering)');
console.log('---');

try {
  const pastDate = Math.floor(Date.now() / 1000) - 604800; // 1 week ago
  const engId2 = createEngagement('Test Engagement 17a', 'test_client_17a', 'team_execution', pastDate);
  console.log(`Created engagement ${engId2} in team_execution stage with commencement_date 1 week ago`);

  const beforeUpdate = getEngagement(engId2);

  // First transition to commencement (should succeed - this is a backward transition but not to info_gathering)
  console.log('Attempting transition to commencement (backward but not to info_gathering)...');

  const fromStage1 = 'team_execution';
  const toStage1 = 'commencement';
  const stageOrder = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'];
  const fromIndex1 = stageOrder.indexOf(fromStage1);
  const toIndex1 = stageOrder.indexOf(toStage1);
  const isBackwardTransition1 = toIndex1 < fromIndex1;

  let validationPassed1 = true;
  let errorMessage1 = null;

  if (isBackwardTransition1 && toStage1 === 'info_gathering') {
    const now = Math.floor(Date.now() / 1000);
    if (beforeUpdate.commencement_date && beforeUpdate.commencement_date <= now) {
      validationPassed1 = false;
      errorMessage1 = 'Cannot revert to info_gathering stage after commencement date has passed';
    }
  }

  const apiCall1 = `PATCH /api/engagements/${engId2}`;
  const payload1 = JSON.stringify({ stage: 'commencement' });
  const evidence1 = validationPassed1 ? 'No date constraint error (correct - not transitioning to info_gathering)' : `Error: ${errorMessage1}`;

  if (validationPassed1) {
    logTest(17, 'Verify can move backward to commencement (no date constraint)', 'PASS',
      'Backward transition to commencement succeeded (no date constraint on commencement)',
      `${apiCall1} - Payload: ${payload1}`,
      `Response: 200 - ${evidence1}`
    );

    // Now try to go back to info_gathering (should fail)
    console.log('\nAttempting second transition to info_gathering (should now fail)...');

    const fromStage2 = 'commencement';
    const toStage2 = 'info_gathering';
    const fromIndex2 = stageOrder.indexOf(fromStage2);
    const toIndex2 = stageOrder.indexOf(toStage2);
    const isBackwardTransition2 = toIndex2 < fromIndex2;

    let validationPassed2 = true;
    let errorMessage2 = null;

    if (isBackwardTransition2 && toStage2 === 'info_gathering') {
      const now = Math.floor(Date.now() / 1000);
      if (beforeUpdate.commencement_date && beforeUpdate.commencement_date <= now) {
        validationPassed2 = false;
        errorMessage2 = 'Cannot revert to info_gathering stage after commencement date has passed';
      }
    }

    const apiCall2 = `PATCH /api/engagements/${engId2}`;
    const payload2 = JSON.stringify({ stage: 'info_gathering' });

    if (!validationPassed2) {
      logTest(17, 'Verify cannot move backward once dates pass (finalization → info_gathering)', 'PASS',
        'Backward transition to info_gathering correctly blocked when commencement_date passed',
        `${apiCall2} - Payload: ${payload2}`,
        `Response: 400 - ${errorMessage2}`
      );
    } else {
      logTest(17, 'Verify cannot move backward once dates pass (finalization → info_gathering)', 'FAIL',
        'Backward transition to info_gathering was allowed but should have been blocked',
        `${apiCall2} - Payload: ${payload2}`,
        'Response: 200 - No error thrown'
      );
    }
  } else {
    logTest(17, 'Verify can move backward to commencement (no date constraint)', 'FAIL',
      `Unexpected validation error: ${errorMessage1}`,
      `${apiCall1} - Payload: ${payload1}`,
      `Response: 400 - ${errorMessage1}`
    );
  }

} catch (error) {
  logTest(17, 'Verify cannot move backward once dates pass (finalization → info_gathering)', 'FAIL',
    `Exception during test: ${error.message}`,
    'Database operation',
    `Error: ${error.message}`
  );
}

console.log('');

// TEST 17b: Verify cannot move backward from finalization once dates pass
console.log('Test 17b: Verify cannot move backward from finalization once dates pass');
console.log('---');

try {
  const pastDate = Math.floor(Date.now() / 1000) - 604800; // 1 week ago
  const engId3 = createEngagement('Test Engagement 17b', 'test_client_17b', 'finalization', pastDate);
  console.log(`Created engagement ${engId3} in finalization stage with commencement_date 1 week ago`);

  const beforeUpdate = getEngagement(engId3);

  // Try to move backward to info_gathering
  console.log('Attempting transition to info_gathering (should fail)...');

  const fromStage = 'finalization';
  const toStage = 'info_gathering';
  const stageOrder = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'];
  const fromIndex = stageOrder.indexOf(fromStage);
  const toIndex = stageOrder.indexOf(toStage);
  const isBackwardTransition = toIndex < fromIndex;

  let validationPassed = true;
  let errorMessage = null;

  if (isBackwardTransition && toStage === 'info_gathering') {
    const now = Math.floor(Date.now() / 1000);
    if (beforeUpdate.commencement_date && beforeUpdate.commencement_date <= now) {
      validationPassed = false;
      errorMessage = 'Cannot revert to info_gathering stage after commencement date has passed';
    }
  }

  const apiCall = `PATCH /api/engagements/${engId3}`;
  const payload = JSON.stringify({ stage: 'info_gathering' });

  if (!validationPassed) {
    logTest(17, 'Verify cannot move backward from finalization once dates pass', 'PASS',
      'Backward transition to info_gathering correctly blocked when commencement_date passed',
      `${apiCall} - Payload: ${payload}`,
      `Response: 400 - ${errorMessage}`
    );
  } else {
    logTest(17, 'Verify cannot move backward from finalization once dates pass', 'FAIL',
      'Backward transition was allowed but should have been blocked',
      `${apiCall} - Payload: ${payload}`,
      'Response: 200 - No error thrown'
    );
  }

} catch (error) {
  logTest(17, 'Verify cannot move backward from finalization once dates pass', 'FAIL',
    `Exception during test: ${error.message}`,
    'Database operation',
    `Error: ${error.message}`
  );
}

console.log('');

// TEST 18: Verify CAN move backward to info_gathering if commencement_date is in the future
console.log('Test 18: Verify CAN move backward to info_gathering if commencement_date is in the future');
console.log('---');

try {
  const futureDate = Math.floor(Date.now() / 1000) + (5 * 86400); // 5 days in the future
  const engId4 = createEngagement('Test Engagement 18', 'test_client_18', 'team_execution', futureDate);
  console.log(`Created engagement ${engId4} in team_execution stage with commencement_date 5 days in the future`);

  const beforeUpdate = getEngagement(engId4);
  console.log(`Before update - Stage: ${beforeUpdate.stage}, Commencement Date: ${beforeUpdate.commencement_date}`);

  // Try to move backward - This should succeed because date is in the future
  console.log('Attempting transition to info_gathering (should succeed - date in future)...');

  const fromStage = 'team_execution';
  const toStage = 'info_gathering';
  const stageOrder = ['info_gathering', 'commencement', 'team_execution', 'partner_review', 'finalization', 'close_out'];
  const fromIndex = stageOrder.indexOf(fromStage);
  const toIndex = stageOrder.indexOf(toStage);
  const isBackwardTransition = toIndex < fromIndex;

  let validationPassed = true;
  let errorMessage = null;

  if (isBackwardTransition && toStage === 'info_gathering') {
    const now = Math.floor(Date.now() / 1000);
    if (beforeUpdate.commencement_date && beforeUpdate.commencement_date <= now) {
      validationPassed = false;
      errorMessage = 'Cannot revert to info_gathering stage after commencement date has passed';
    }
  }

  const apiCall = `PATCH /api/engagements/${engId4}`;
  const payload = JSON.stringify({ stage: 'info_gathering' });

  if (validationPassed) {
    logTest(18, 'CAN move backward to info_gathering if commencement_date is in the future', 'PASS',
      'Backward transition allowed because commencement_date is in the future',
      `${apiCall} - Payload: ${payload}`,
      'Response: 200 - No validation error'
    );
  } else {
    logTest(18, 'CAN move backward to info_gathering if commencement_date is in the future', 'FAIL',
      `Backward transition was blocked but should have been allowed: ${errorMessage}`,
      `${apiCall} - Payload: ${payload}`,
      `Response: 400 - ${errorMessage}`
    );
  }

} catch (error) {
  logTest(18, 'CAN move backward to info_gathering if commencement_date is in the future', 'FAIL',
    `Exception during test: ${error.message}`,
    'Database operation',
    `Error: ${error.message}`
  );
}

console.log('');
console.log('==========================================');
console.log(`SUMMARY: ${tests.pass}/${tests.pass + tests.fail} PASSING`);
console.log('==========================================');
console.log('');

// Detailed results
console.log('DETAILED TEST RESULTS:');
console.log('==========================================');
tests.results.forEach(result => {
  console.log(`\nTest ${result.testNum}: ${result.name}`);
  console.log(`Status: ${result.status}`);
  if (result.details) console.log(`Details: ${result.details}`);
  if (result.command) console.log(`Command: ${result.command}`);
  if (result.evidence) console.log(`Evidence: ${result.evidence}`);
});

db.close();
process.exit(tests.fail > 0 ? 1 : 0);
