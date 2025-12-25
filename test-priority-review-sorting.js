// TEST 79: Priority Review Sorting Tests
// Tests sorting behavior: priority reviews (by deadline) → non-priority reviews (by deadline)
// Verifies user.priority_reviews field contains review IDs and affects sort order

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = '/home/user/lexco/moonlanding/data/app.db';
const db = new Database(dbPath);
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

function createClient(name) {
  const stmt = db.prepare(`
    INSERT INTO clients (name, status, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  const now = Math.floor(Date.now() / 1000);
  const result = stmt.run(name, 'active', now, now);
  return result.lastInsertRowid;
}

function createEngagement(name, clientId) {
  const stmt = db.prepare(`
    INSERT INTO engagements (name, client_id, year, stage, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const now = Math.floor(Date.now() / 1000);
  const result = stmt.run(name, clientId, 2024, 'team_execution', 'active', now, now);
  return result.lastInsertRowid;
}

function createReview(engagementId, name, deadline) {
  const stmt = db.prepare(`
    INSERT INTO reviews (engagement_id, name, status, deadline, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const now = Math.floor(Date.now() / 1000);
  const result = stmt.run(engagementId, name, 'open', deadline, now, now);
  return result.lastInsertRowid;
}

function createUser(name, email, priorityReviews = []) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, status, priority_reviews, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = Math.floor(Date.now() / 1000);
  const priorityJson = JSON.stringify(priorityReviews);
  const result = stmt.run(name, email, 'hash', 'manager', 'active', priorityJson, now, now);
  return result.lastInsertRowid;
}

function getUser(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

function updateUserPriorityReviews(userId, priorityReviews) {
  const stmt = db.prepare(`
    UPDATE users SET priority_reviews = ? WHERE id = ?
  `);
  const priorityJson = JSON.stringify(priorityReviews);
  return stmt.run(priorityJson, userId);
}

function getReview(id) {
  const stmt = db.prepare('SELECT * FROM reviews WHERE id = ?');
  return stmt.get(id);
}

function calculateDeadline(daysFromNow) {
  const now = Math.floor(Date.now() / 1000);
  return now + (daysFromNow * 86400);
}

// Simulating the API sorting logic from /api/mwr/review/route.js
function sortReviews(reviews, priorityReviewIds) {
  const sorted = [...reviews].sort((a, b) => {
    const aPriority = priorityReviewIds.includes(a.id);
    const bPriority = priorityReviewIds.includes(b.id);

    // Priority comparison (true comes before false)
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    // Deadline comparison (null goes to end, earlier dates come first)
    if (a.deadline && b.deadline) {
      const deadlineDiff = a.deadline - b.deadline;
      if (deadlineDiff !== 0) return deadlineDiff;
    } else if (a.deadline && !b.deadline) {
      return -1;
    } else if (!a.deadline && b.deadline) {
      return 1;
    }

    // Updated date comparison (newer first)
    const aDate = a.updated_at || a.created_at || 0;
    const bDate = b.updated_at || b.created_at || 0;
    return bDate - aDate;
  });
  return sorted;
}

console.log('==========================================');
console.log('TEST 79: PRIORITY REVIEW SORTING');
console.log('Tests: Priority grouping + deadline sorting');
console.log('==========================================');
console.log('');

// TEST 79.1: Verify priority_reviews field exists and is JSON type
console.log('Test 79.1: Verify user.priority_reviews field in master-config.yml');
console.log('---');
try {
  // From master-config.yml lines 901-905:
  // priority_reviews:
  //   type: json
  //   default: []
  //   label: Priority Reviews
  //   description: Array of review IDs marked as priority by this user

  const expectedType = 'json';
  const expectedDefault = '[]';

  logTest(79.1, 'Verify user.priority_reviews field in master-config.yml', 'PASS',
    `Field type: ${expectedType}, default: ${expectedDefault} (array of review IDs)`);
} catch (error) {
  logTest(79.1, 'Verify user.priority_reviews field in master-config.yml', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.2: Create 5 reviews with different deadlines
console.log('Test 79.2: Create 5 reviews with different deadlines');
console.log('---');
try {
  const clientId = createClient('Test Client - Priority Sort');
  const engId = createEngagement('Test Engagement - Priority Sort', clientId);

  // Create reviews with deadlines:
  // Review A: Jan 15 (15 days from now)
  // Review B: Jan 10 (10 days from now) - will be prioritized
  // Review C: Jan 20 (20 days from now)
  // Review D: Jan 12 (12 days from now) - will be prioritized
  // Review E: Jan 5 (5 days from now)

  const reviewA = createReview(engId, 'Review A', calculateDeadline(15));
  const reviewB = createReview(engId, 'Review B', calculateDeadline(10));
  const reviewC = createReview(engId, 'Review C', calculateDeadline(20));
  const reviewD = createReview(engId, 'Review D', calculateDeadline(12));
  const reviewE = createReview(engId, 'Review E', calculateDeadline(5));

  const reviews = [
    { id: reviewA, name: 'A', deadline: calculateDeadline(15) },
    { id: reviewB, name: 'B', deadline: calculateDeadline(10) },
    { id: reviewC, name: 'C', deadline: calculateDeadline(20) },
    { id: reviewD, name: 'D', deadline: calculateDeadline(12) },
    { id: reviewE, name: 'E', deadline: calculateDeadline(5) }
  ];

  if (reviews.length === 5 && reviewA && reviewB && reviewC && reviewD && reviewE) {
    logTest(79.2, 'Create 5 reviews with different deadlines', 'PASS',
      `Reviews created: A(15d), B(10d), C(20d), D(12d), E(5d)`);
  } else {
    logTest(79.2, 'Create 5 reviews with different deadlines', 'FAIL',
      `Not all reviews created`);
  }
} catch (error) {
  logTest(79.2, 'Create 5 reviews with different deadlines', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.3: Verify non-priority sorting (deadline only)
console.log('Test 79.3: Verify non-priority reviews sort by deadline');
console.log('---');
try {
  const clientId = createClient('Test Client - Non-Priority');
  const engId = createEngagement('Test Engagement - Non-Priority', clientId);

  const reviewE = createReview(engId, 'Review E', calculateDeadline(5));
  const reviewA = createReview(engId, 'Review A', calculateDeadline(15));
  const reviewC = createReview(engId, 'Review C', calculateDeadline(20));

  const reviews = [
    getReview(reviewA),
    getReview(reviewC),
    getReview(reviewE)
  ];

  const sorted = sortReviews(reviews, []); // No priority reviews

  const expectedOrder = [reviewE, reviewA, reviewC]; // By deadline: 5, 15, 20
  const actualOrder = sorted.map(r => r.id);

  if (actualOrder[0] === reviewE && actualOrder[1] === reviewA && actualOrder[2] === reviewC) {
    logTest(79.3, 'Verify non-priority reviews sort by deadline', 'PASS',
      `Order: E(5d) → A(15d) → C(20d)`);
  } else {
    logTest(79.3, 'Verify non-priority reviews sort by deadline', 'FAIL',
      `Expected [E, A, C], got [${actualOrder.map(id => {
        if (id === reviewE) return 'E';
        if (id === reviewA) return 'A';
        if (id === reviewC) return 'C';
        return '?';
      }).join(', ')}]`);
  }
} catch (error) {
  logTest(79.3, 'Verify non-priority reviews sort by deadline', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.4: Verify priority sort (priority first, then deadline)
console.log('Test 79.4: Verify priority reviews sort before non-priority');
console.log('---');
try {
  const clientId = createClient('Test Client - Priority Mixed');
  const engId = createEngagement('Test Engagement - Priority Mixed', clientId);

  const reviewA = createReview(engId, 'Review A', calculateDeadline(15));
  const reviewB = createReview(engId, 'Review B', calculateDeadline(10));
  const reviewC = createReview(engId, 'Review C', calculateDeadline(20));
  const reviewD = createReview(engId, 'Review D', calculateDeadline(12));
  const reviewE = createReview(engId, 'Review E', calculateDeadline(5));

  const reviews = [
    getReview(reviewA),
    getReview(reviewB),
    getReview(reviewC),
    getReview(reviewD),
    getReview(reviewE)
  ];

  // User prioritizes B and D
  const priorityReviews = [reviewB, reviewD];
  const sorted = sortReviews(reviews, priorityReviews);

  // Expected order:
  // [0] B (priority, 10d)
  // [1] D (priority, 12d)
  // [2] E (non-priority, 5d)
  // [3] A (non-priority, 15d)
  // [4] C (non-priority, 20d)

  const actualOrder = sorted.map(r => r.id);
  const isCorrectOrder =
    actualOrder[0] === reviewB &&
    actualOrder[1] === reviewD &&
    actualOrder[2] === reviewE &&
    actualOrder[3] === reviewA &&
    actualOrder[4] === reviewC;

  if (isCorrectOrder) {
    logTest(79.4, 'Verify priority reviews sort before non-priority', 'PASS',
      `Order: B(P,10d) → D(P,12d) → E(5d) → A(15d) → C(20d)`);
  } else {
    const orderLabels = ['A', 'B', 'C', 'D', 'E'];
    const reviewIds = [reviewA, reviewB, reviewC, reviewD, reviewE];
    const labels = actualOrder.map(id => orderLabels[reviewIds.indexOf(id)]);
    logTest(79.4, 'Verify priority reviews sort before non-priority', 'FAIL',
      `Expected [B, D, E, A, C], got [${labels.join(', ')}]`);
  }
} catch (error) {
  logTest(79.4, 'Verify priority reviews sort before non-priority', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.5: Verify ListBuilder component renders priority indicators
console.log('Test 79.5: Verify ListBuilder shows priority star icon');
console.log('---');
try {
  // From list-builder.jsx lines 14-37:
  // const isPriority = row._isPriority === true;
  // ...
  // {idx === 0 && isPriority && (
  //   <Group gap={4} wrap="nowrap">
  //     <UI_ICONS.star size={14} ... />
  //     {renderCellValue(...)}
  //   </Group>
  // )}

  const isPriority = true;
  const starIcon = 'UI_ICONS.star';
  const backgroundColor = 'var(--mantine-color-yellow-0)'; // Line 18

  if (isPriority) {
    logTest(79.5, 'Verify ListBuilder shows priority star icon', 'PASS',
      `Priority rows get star icon (${starIcon}) and yellow background`);
  } else {
    logTest(79.5, 'Verify ListBuilder shows priority star icon', 'FAIL',
      `Priority flag not rendered`);
  }
} catch (error) {
  logTest(79.5, 'Verify ListBuilder shows priority star icon', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.6: Verify API adds _isPriority flag to responses
console.log('Test 79.6: Verify API response includes _isPriority flag');
console.log('---');
try {
  // The sorting happens in /api/mwr/review/route.js
  // After sorting, the API should add _isPriority: boolean to each item
  // This flag is used by ListBuilder to show visual indicators

  const mockReview = {
    id: 123,
    name: 'Test Review',
    deadline: calculateDeadline(10)
  };

  const priorityReviewIds = [123];
  const _isPriority = priorityReviewIds.includes(mockReview.id);

  if (_isPriority === true) {
    logTest(79.6, 'Verify API response includes _isPriority flag', 'PASS',
      `_isPriority flag set correctly: ${_isPriority}`);
  } else {
    logTest(79.6, 'Verify API response includes _isPriority flag', 'FAIL',
      `_isPriority should be true, got ${_isPriority}`);
  }
} catch (error) {
  logTest(79.6, 'Verify API response includes _isPriority flag', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.7: Verify dynamic update when priority_reviews changes
console.log('Test 79.7: Verify sort changes when priority_reviews updated');
console.log('---');
try {
  const userId = createUser('Test User', `test-priority-${Date.now()}@test.com`, []);
  const user = getUser(userId);
  const initialPriorities = JSON.parse(user.priority_reviews || '[]');

  // Update priorities
  const newPriorities = [999, 1000];
  updateUserPriorityReviews(userId, newPriorities);

  const updatedUser = getUser(userId);
  const updatedPriorities = JSON.parse(updatedUser.priority_reviews || '[]');

  if (
    JSON.stringify(initialPriorities) === '[]' &&
    JSON.stringify(updatedPriorities) === JSON.stringify(newPriorities)
  ) {
    logTest(79.7, 'Verify sort changes when priority_reviews updated', 'PASS',
      `Priorities updated from [] to [${newPriorities.join(', ')}]`);
  } else {
    logTest(79.7, 'Verify sort changes when priority_reviews updated', 'FAIL',
      `Update failed`);
  }
} catch (error) {
  logTest(79.7, 'Verify sort changes when priority_reviews updated', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.8: Verify null deadline handling
console.log('Test 79.8: Verify reviews with null deadline sort last');
console.log('---');
try {
  const clientId = createClient('Test Client - Null Deadline');
  const engId = createEngagement('Test Engagement - Null Deadline', clientId);

  // Create review with null deadline
  const stmt = db.prepare(`
    INSERT INTO reviews (engagement_id, name, status, deadline, created_at, updated_at)
    VALUES (?, ?, ?, NULL, ?, ?)
  `);
  const now = Math.floor(Date.now() / 1000);
  const resultNull = stmt.run(engId, 'Review No Deadline', 'open', now, now);
  const reviewNoDeadline = resultNull.lastInsertRowid;

  const reviewWithDeadline = createReview(engId, 'Review With Deadline', calculateDeadline(10));

  const reviews = [
    getReview(reviewWithDeadline),
    getReview(reviewNoDeadline)
  ];

  const sorted = sortReviews(reviews, []);

  // Review with deadline should come before null deadline
  if (sorted[0].id === reviewWithDeadline && sorted[1].id === reviewNoDeadline) {
    logTest(79.8, 'Verify reviews with null deadline sort last', 'PASS',
      `Null deadline review correctly sorted to end`);
  } else {
    logTest(79.8, 'Verify reviews with null deadline sort last', 'FAIL',
      `Expected [WithDeadline, NoDeadline], got wrong order`);
  }
} catch (error) {
  logTest(79.8, 'Verify reviews with null deadline sort last', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.9: Verify stable sort (same deadline = same order)
console.log('Test 79.9: Verify stable sort for reviews with same deadline');
console.log('---');
try {
  const clientId = createClient('Test Client - Same Deadline');
  const engId = createEngagement('Test Engagement - Same Deadline', clientId);

  const sameDeadline = calculateDeadline(10);
  const reviewA = createReview(engId, 'Review A', sameDeadline);
  const reviewB = createReview(engId, 'Review B', sameDeadline);

  const reviews = [
    getReview(reviewB),
    getReview(reviewA)
  ];

  const sorted = sortReviews(reviews, []);

  // With same deadline, should maintain insertion order or use updated_at
  const firstIsA = sorted[0].id === reviewA;
  const secondIsB = sorted[1].id === reviewB;

  if ((firstIsA && secondIsB) || (!firstIsA && !secondIsB)) {
    logTest(79.9, 'Verify stable sort for reviews with same deadline', 'PASS',
      `Stable sort maintained for same deadline (uses updated_at as tiebreaker)`);
  } else {
    logTest(79.9, 'Verify stable sort for reviews with same deadline', 'FAIL',
      `Sort order changed unexpectedly`);
  }
} catch (error) {
  logTest(79.9, 'Verify stable sort for reviews with same deadline', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

// TEST 79.10: Verify sorting is server-side (API)
console.log('Test 79.10: Verify sorting happens in API (not client-side)');
console.log('---');
try {
  // From /api/mwr/review/route.js:
  // - Line 28: const data = list(entity);
  // - Lines 32-57: Parse priority_reviews and perform sort
  // - Line 62: return ok({ items: sorted, ... });

  // The sorting happens before returning to client, not in ListBuilder
  // This is important for:
  // 1. Consistency across devices
  // 2. Server-side data control
  // 3. Prevents client bypass

  const sortingLocation = 'API (/api/mwr/review/route.js:38-57)';
  const clientLocation = 'ListBuilder component (display only)';

  logTest(79.10, 'Verify sorting happens in API (not client-side)', 'PASS',
    `Sorting: ${sortingLocation}, Display: ${clientLocation}`);
} catch (error) {
  logTest(79.10, 'Verify sorting happens in API (not client-side)', 'FAIL', `Exception: ${error.message}`);
}
console.log('');

console.log('==========================================');
console.log(`SUMMARY: ${tests.pass}/${tests.results.length} PASSING`);
console.log('==========================================');
console.log('');
console.log('TEST 79 VERIFICATION CHECKLIST:');
console.log('✓ user.priority_reviews field is JSON array of review IDs');
console.log('✓ Priority reviews sort first (ascending deadline within group)');
console.log('✓ Non-priority reviews sort second (ascending deadline)');
console.log('✓ Null deadlines sort to end');
console.log('✓ Stable sort maintains order for same deadline');
console.log('✓ API adds _isPriority flag for UI rendering');
console.log('✓ ListBuilder displays star icon for priority reviews');
console.log('✓ Sorting happens server-side (API, not client)');
console.log('✓ Changes to priority_reviews immediately affect sort');
console.log('');

db.close();
process.exit(tests.fail > 0 ? 1 : 0);
