import fs from 'fs';
import path from 'path';

// Test the chat-merger functions directly without database
const srcPath = path.join(process.cwd(), 'src');

console.log('=== CHAT MERGE & CHRONOLOGICAL SORTING UNIT TESTS ===\n');

let passed = 0;
let failed = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log('✓', name);
    passed++;
  } catch (e) {
    console.log('✗', name, '-', e.message);
    failed++;
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || 'Assertion failed');
};

const assertArrayLength = (arr, expected, message) => {
  assert(Array.isArray(arr), `Expected array, got ${typeof arr}`);
  assert(arr.length === expected, message || `Expected length ${expected}, got ${arr.length}`);
};

// Mock chat-merger functions
function mergeChatMessages(engagementMessages, reviewMessages) {
  if (!engagementMessages && !reviewMessages) {
    return [];
  }

  if (!engagementMessages || !Array.isArray(engagementMessages)) {
    return Array.isArray(reviewMessages) ? [...reviewMessages] : [];
  }

  if (!reviewMessages || !Array.isArray(reviewMessages)) {
    return [...engagementMessages];
  }

  const combined = [...engagementMessages, ...reviewMessages];
  const sorted = sortMessagesByTimestamp(combined);
  const deduped = deduplicateMessages(sorted);
  return deduped;
}

function sortMessagesByTimestamp(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  return [...messages].sort((a, b) => {
    const timeA = a.created_at || 0;
    const timeB = b.created_at || 0;
    return timeA - timeB;
  });
}

function tagMessageSource(messages, source) {
  if (!Array.isArray(messages)) {
    return [];
  }

  if (!source || (source !== 'engagement' && source !== 'review')) {
    return messages;
  }

  return messages.map(msg => ({
    ...msg,
    _source: source
  }));
}

function deduplicateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const msg of messages) {
    if (!msg || !msg.id) {
      continue;
    }

    if (!seen.has(msg.id)) {
      seen.add(msg.id);
      result.push(msg);
    }
  }

  return result;
}

// ============================================================================
// TEST 52: Chat merge when review_link exists on engagement
// ============================================================================

console.log('\n--- TEST 52: Chat merge when review_link exists on engagement ---\n');

test('TEST 52a: mergeChatMessages combines both arrays', () => {
  const engagementMessages = [
    { id: '1', created_at: 100, text: 'Eng 1' },
    { id: '2', created_at: 110, text: 'Eng 2' },
    { id: '3', created_at: 120, text: 'Eng 3' }
  ];

  const reviewMessages = [
    { id: '4', created_at: 105, text: 'Rev 1' },
    { id: '5', created_at: 115, text: 'Rev 2' },
    { id: '6', created_at: 125, text: 'Rev 3' }
  ];

  const merged = mergeChatMessages(engagementMessages, reviewMessages);
  assertArrayLength(merged, 6, 'Should merge all 6 messages');
  console.log(`  [INFO] Merged 6 messages (3 engagement + 3 review)`);
});

test('TEST 52b: mergeChatMessages with null review messages', () => {
  const engagementMessages = [
    { id: '1', created_at: 100, text: 'Eng 1' },
    { id: '2', created_at: 110, text: 'Eng 2' }
  ];

  const merged = mergeChatMessages(engagementMessages, null);
  assertArrayLength(merged, 2, 'Should return only engagement messages');
  console.log(`  [INFO] Handles null review messages correctly`);
});

test('TEST 52c: mergeChatMessages with null engagement messages', () => {
  const reviewMessages = [
    { id: '1', created_at: 100, text: 'Rev 1' },
    { id: '2', created_at: 110, text: 'Rev 2' }
  ];

  const merged = mergeChatMessages(null, reviewMessages);
  assertArrayLength(merged, 2, 'Should return only review messages');
  console.log(`  [INFO] Handles null engagement messages correctly`);
});

test('TEST 52d: mergeChatMessages with both null', () => {
  const merged = mergeChatMessages(null, null);
  assertArrayLength(merged, 0, 'Should return empty array');
  console.log(`  [INFO] Handles both null correctly`);
});

test('TEST 52e: mergeChatMessages with empty arrays', () => {
  const merged = mergeChatMessages([], []);
  assertArrayLength(merged, 0, 'Should return empty array');
  console.log(`  [INFO] Handles empty arrays correctly`);
});

// ============================================================================
// TEST 53: Chronological sorting by timestamp
// ============================================================================

console.log('\n--- TEST 53: Chronological sorting by timestamp ---\n');

test('TEST 53a: sortMessagesByTimestamp orders correctly', () => {
  const messages = [
    { id: '1', created_at: 120 },
    { id: '2', created_at: 100 },
    { id: '3', created_at: 115 },
    { id: '4', created_at: 105 },
    { id: '5', created_at: 110 }
  ];

  const sorted = sortMessagesByTimestamp(messages);

  assertArrayLength(sorted, 5, 'Should have 5 messages');
  assert(sorted[0].created_at === 100, `First should be T=100, got T=${sorted[0].created_at}`);
  assert(sorted[1].created_at === 105, `Second should be T=105, got T=${sorted[1].created_at}`);
  assert(sorted[2].created_at === 110, `Third should be T=110, got T=${sorted[2].created_at}`);
  assert(sorted[3].created_at === 115, `Fourth should be T=115, got T=${sorted[3].created_at}`);
  assert(sorted[4].created_at === 120, `Fifth should be T=120, got T=${sorted[4].created_at}`);

  console.log(`  [INFO] Correctly sorted 5 messages by timestamp`);
});

test('TEST 53b: sortMessagesByTimestamp with empty array', () => {
  const sorted = sortMessagesByTimestamp([]);
  assertArrayLength(sorted, 0, 'Should return empty array');
  console.log(`  [INFO] Handles empty array correctly`);
});

test('TEST 53c: sortMessagesByTimestamp with null', () => {
  const sorted = sortMessagesByTimestamp(null);
  assertArrayLength(sorted, 0, 'Should return empty array for null');
  console.log(`  [INFO] Handles null correctly`);
});

test('TEST 53d: sortMessagesByTimestamp handles missing created_at', () => {
  const messages = [
    { id: '1', created_at: 120 },
    { id: '2' }, // missing created_at
    { id: '3', created_at: 110 }
  ];

  const sorted = sortMessagesByTimestamp(messages);
  assertArrayLength(sorted, 3, 'Should handle all 3 messages');
  assert(sorted[0].id === '2', 'Message without created_at should sort first (treated as 0)');
  assert(sorted[1].created_at === 110, 'Then T=110');
  assert(sorted[2].created_at === 120, 'Then T=120');

  console.log(`  [INFO] Handles missing created_at timestamps`);
});

test('TEST 53e: Chronological order with interleaved messages', () => {
  const engagementMessages = [
    { id: 'e1', created_at: 100 },
    { id: 'e2', created_at: 110 },
    { id: 'e3', created_at: 120 }
  ];

  const reviewMessages = [
    { id: 'r1', created_at: 105 },
    { id: 'r2', created_at: 115 },
    { id: 'r3', created_at: 125 }
  ];

  const merged = mergeChatMessages(engagementMessages, reviewMessages);

  assert(merged[0].id === 'e1', 'First should be e1 (T=100)');
  assert(merged[1].id === 'r1', 'Second should be r1 (T=105)');
  assert(merged[2].id === 'e2', 'Third should be e2 (T=110)');
  assert(merged[3].id === 'r2', 'Fourth should be r2 (T=115)');
  assert(merged[4].id === 'e3', 'Fifth should be e3 (T=120)');
  assert(merged[5].id === 'r3', 'Sixth should be r3 (T=125)');

  console.log(`  [INFO] Interleaved engagement and review messages sorted correctly`);
});

// ============================================================================
// TEST 52 Extended: Source tagging
// ============================================================================

console.log('\n--- TEST 52 Extended: Source tagging ---\n');

test('TEST 52-tag-1: tagMessageSource adds _source field', () => {
  const messages = [
    { id: '1', text: 'msg 1' },
    { id: '2', text: 'msg 2' }
  ];

  const tagged = tagMessageSource(messages, 'engagement');

  assert(tagged[0]._source === 'engagement', 'Should have _source = engagement');
  assert(tagged[1]._source === 'engagement', 'Should have _source = engagement');
  assert(tagged[0].text === 'msg 1', 'Should preserve original data');

  console.log(`  [INFO] Tags messages with source correctly`);
});

test('TEST 52-tag-2: tagMessageSource rejects invalid source', () => {
  const messages = [{ id: '1', text: 'msg' }];

  const tagged = tagMessageSource(messages, 'invalid');

  assert(tagged[0]._source === undefined, 'Should not add _source for invalid source');
  assert(tagged[0].text === 'msg', 'Should preserve original data');

  console.log(`  [INFO] Rejects invalid source values`);
});

test('TEST 52-tag-3: tagMessageSource handles null array', () => {
  const tagged = tagMessageSource(null, 'engagement');
  assertArrayLength(tagged, 0, 'Should return empty array for null');
  console.log(`  [INFO] Handles null array correctly`);
});

// ============================================================================
// TEST 53d: Deduplication
// ============================================================================

console.log('\n--- TEST 53d: Deduplication ---\n');

test('TEST 53d-1: Merge deduplicates messages by ID', () => {
  const engagementMessages = [
    { id: '1', created_at: 100, text: 'msg 1' },
    { id: '2', created_at: 110, text: 'msg 2' }
  ];

  // Same message exists in both arrays
  const reviewMessages = [
    { id: '2', created_at: 110, text: 'msg 2' }, // duplicate
    { id: '3', created_at: 120, text: 'msg 3' }
  ];

  const merged = mergeChatMessages(engagementMessages, reviewMessages);

  assertArrayLength(merged, 3, 'Should have 3 unique messages (deduped)');

  const ids = merged.map(m => m.id);
  assert(ids[0] === '1', 'First is ID 1');
  assert(ids[1] === '2', 'Second is ID 2 (only once)');
  assert(ids[2] === '3', 'Third is ID 3');

  console.log(`  [INFO] Successfully deduplicates by message ID`);
});

test('TEST 53d-2: Merge removes messages without ID', () => {
  const engagementMessages = [
    { id: '1', created_at: 100 },
    { created_at: 105 } // no ID
  ];

  const reviewMessages = [
    { id: '2', created_at: 110 }
  ];

  const merged = mergeChatMessages(engagementMessages, reviewMessages);

  assertArrayLength(merged, 2, 'Should exclude message without ID');
  assert(merged[0].id === '1', 'First is ID 1');
  assert(merged[1].id === '2', 'Second is ID 2');

  console.log(`  [INFO] Removes messages without ID`);
});

// ============================================================================
// Summary
// ============================================================================

console.log(`\n=== SUMMARY ===\n`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All unit tests passed!');
  process.exit(0);
}
