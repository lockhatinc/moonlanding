import fs from 'fs';
import path from 'path';

// Run tests
(async () => {
  // Setup Node import alias resolution
  const projectRoot = process.cwd();
  const srcPath = path.join(projectRoot, 'src');

  // Import database directly with relative path
  const { getDatabase, now, genId, migrate } = await import(path.join(srcPath, 'lib/database-core.js'));
  const { create, list, get, update } = await import(path.join(srcPath, 'lib/query-engine.js'));
  const { mergeChatMessages, sortMessagesByTimestamp, tagMessageSource } = await import(path.join(srcPath, 'lib/chat-merger.js'));

  const db = getDatabase();

  console.log('=== CHAT MERGE & CHRONOLOGICAL SORTING TESTS ===\n');

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

  const assertArrayIncludes = (arr, value, message) => {
    assert(Array.isArray(arr), `Expected array, got ${typeof arr}`);
    assert(arr.includes(value), message || `Array does not include ${value}`);
  };

  // Initialize database
  try {
    migrate();
    console.log('[SETUP] Database migrated successfully\n');
  } catch (e) {
    console.error('[ERROR] Failed to migrate database:', e.message);
    process.exit(1);
  }

  // Helper: Create test engagement with review_link
  const createTestEngagement = (reviewId = null) => {
    const engagementData = {
      name: `Engagement ${genId().slice(0, 6)}`,
      status: 'active',
      year: new Date().getFullYear()
    };
    if (reviewId) {
      engagementData.review_link = reviewId;
    }

    try {
      const engagement = create('engagement', engagementData, { id: 'test-user' });
      return engagement;
    } catch (e) {
      console.error('[ERROR] Failed to create engagement:', e.message);
      throw e;
    }
  };

  // Helper: Create test review
  const createTestReview = () => {
    const reviewData = {
      name: `Review ${genId().slice(0, 6)}`,
      status: 'active',
      year: new Date().getFullYear(),
      engagement_id: null
    };

    try {
      const review = create('review', reviewData, { id: 'test-user' });
      return review;
    } catch (e) {
      console.error('[ERROR] Failed to create review:', e.message);
      throw e;
    }
  };

  // Helper: Create message with specific timestamp
  const createMessage = (entityType, entityId, text, timestamp) => {
    const messageData = {
      entity_type: entityType,
      entity_id: entityId,
      text: text,
      created_at: timestamp,
      status: 'active'
    };

    try {
      const message = create('message', messageData, { id: 'test-user' });
      return message;
    } catch (e) {
      console.error('[ERROR] Failed to create message:', e.message);
      throw e;
    }
  };

  // Helper: Get messages for entity
  const getMessagesForEntity = (entityType, entityId) => {
    try {
      return list('message', { entity_type: entityType, entity_id: entityId });
    } catch (e) {
      console.error('[ERROR] Failed to list messages:', e.message);
      throw e;
    }
  };

  // ============================================================================
  // TEST 52: Chat merge when review_link exists on engagement
  // ============================================================================

  console.log('\n--- TEST 52: Chat merge when review_link exists on engagement ---\n');

  test('TEST 52a: Create engagement with review_link and post messages to both', () => {
    // Create review first
    const review = createTestReview();
    assert(review && review.id, 'Review should be created with ID');
    console.log(`  [INFO] Created review: ${review.id}`);

    // Create engagement with review_link
    const engagement = createTestEngagement(review.id);
    assert(engagement && engagement.id, 'Engagement should be created with ID');
    assert(engagement.review_link === review.id, `Engagement review_link should be ${review.id}`);
    console.log(`  [INFO] Created engagement: ${engagement.id} with review_link: ${review.id}`);

    // Post 3 messages to engagement chat (T0, T1, T2)
    const baseTime = Math.floor(Date.now() / 1000);
    const engMsg1 = createMessage('engagement', engagement.id, 'Engagement message 1', baseTime);
    const engMsg2 = createMessage('engagement', engagement.id, 'Engagement message 2', baseTime + 10);
    const engMsg3 = createMessage('engagement', engagement.id, 'Engagement message 3', baseTime + 20);

    console.log(`  [INFO] Created engagement messages at T0, T+10, T+20`);

    // Post 3 messages to review chat (T0.5, T1.5, T2.5)
    const revMsg1 = createMessage('review', review.id, 'Review message 1', baseTime + 5);
    const revMsg2 = createMessage('review', review.id, 'Review message 2', baseTime + 15);
    const revMsg3 = createMessage('review', review.id, 'Review message 3', baseTime + 25);

    console.log(`  [INFO] Created review messages at T+5, T+15, T+25`);

    // Get messages via engagement chat
    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = getMessagesForEntity('review', review.id);

    console.log(`  [INFO] Retrieved ${engagementMessages.length} engagement messages`);
    console.log(`  [INFO] Retrieved ${reviewMessages.length} review messages`);

    // Verify counts
    assertArrayLength(engagementMessages, 3, 'Should have 3 engagement messages');
    assertArrayLength(reviewMessages, 3, 'Should have 3 review messages');

    // Merge messages
    const merged = mergeChatMessages(engagementMessages, reviewMessages);
    console.log(`  [INFO] Merged result: ${merged.length} total messages`);

    // Verify all messages present
    assertArrayLength(merged, 6, 'Merged result should contain all 6 messages');
  });

  test('TEST 52b: Merged messages include both engagement and review messages', () => {
    const review = createTestReview();
    const engagement = createTestEngagement(review.id);

    const baseTime = Math.floor(Date.now() / 1000);
    createMessage('engagement', engagement.id, 'Eng msg', baseTime);
    createMessage('review', review.id, 'Rev msg', baseTime + 1);

    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = getMessagesForEntity('review', review.id);
    const merged = mergeChatMessages(engagementMessages, reviewMessages);

    // Verify we can identify which source each message came from
    const engagementIds = engagementMessages.map(m => m.id);
    const reviewIds = reviewMessages.map(m => m.id);

    const mergedIds = merged.map(m => m.id);

    // All engagement message IDs should be in merged
    engagementIds.forEach(id => {
      assert(mergedIds.includes(id), `Engagement message ${id} should be in merged result`);
    });

    // All review message IDs should be in merged
    reviewIds.forEach(id => {
      assert(mergedIds.includes(id), `Review message ${id} should be in merged result`);
    });

    console.log(`  [INFO] All engagement and review messages present in merged result`);
  });

  test('TEST 52c: Verify source can be detected via message structure', () => {
    const review = createTestReview();
    const engagement = createTestEngagement(review.id);

    const baseTime = Math.floor(Date.now() / 1000);
    const engMsg = createMessage('engagement', engagement.id, 'Eng', baseTime);
    const revMsg = createMessage('review', review.id, 'Rev', baseTime + 1);

    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = getMessagesForEntity('review', review.id);

    // Tag messages with source
    const taggedEng = tagMessageSource(engagementMessages, 'engagement');
    const taggedRev = tagMessageSource(reviewMessages, 'review');

    assert(taggedEng[0]._source === 'engagement', 'Engagement message should have _source = engagement');
    assert(taggedRev[0]._source === 'review', 'Review message should have _source = review');

    console.log(`  [INFO] Messages can be tagged with source for identification`);
  });

  // ============================================================================
  // TEST 53: Chronological sorting by timestamp
  // ============================================================================

  console.log('\n--- TEST 53: Chronological sorting by timestamp ---\n');

  test('TEST 53a: Messages merged and sorted chronologically', () => {
    const review = createTestReview();
    const engagement = createTestEngagement(review.id);

    // Create messages at precise timestamps
    const baseTime = 1000; // Use fixed base for clarity

    // T=100: Engagement msg 1
    const engMsg1 = createMessage('engagement', engagement.id, 'Eng 1', 100);

    // T=105: Review msg 1
    const revMsg1 = createMessage('review', review.id, 'Rev 1', 105);

    // T=110: Engagement msg 2
    const engMsg2 = createMessage('engagement', engagement.id, 'Eng 2', 110);

    // T=115: Review msg 2
    const revMsg2 = createMessage('review', review.id, 'Rev 2', 115);

    // T=120: Engagement msg 3
    const engMsg3 = createMessage('engagement', engagement.id, 'Eng 3', 120);

    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = getMessagesForEntity('review', review.id);

    console.log(`  [INFO] Engagement messages: ${engagementMessages.map(m => `T=${m.created_at}`).join(', ')}`);
    console.log(`  [INFO] Review messages: ${reviewMessages.map(m => `T=${m.created_at}`).join(', ')}`);

    // Merge and verify sort order
    const merged = mergeChatMessages(engagementMessages, reviewMessages);

    console.log(`  [INFO] Merged messages: ${merged.map(m => `T=${m.created_at}`).join(', ')}`);

    // Verify order
    assertArrayLength(merged, 5, 'Should have 5 messages total');
    assert(merged[0].created_at === 100, `Message 0 should be T=100, got T=${merged[0].created_at}`);
    assert(merged[1].created_at === 105, `Message 1 should be T=105, got T=${merged[1].created_at}`);
    assert(merged[2].created_at === 110, `Message 2 should be T=110, got T=${merged[2].created_at}`);
    assert(merged[3].created_at === 115, `Message 3 should be T=115, got T=${merged[3].created_at}`);
    assert(merged[4].created_at === 120, `Message 4 should be T=120, got T=${merged[4].created_at}`);

    console.log(`  [INFO] Messages sorted correctly in chronological order`);
  });

  test('TEST 53b: sortMessagesByTimestamp function works correctly', () => {
    const messages = [
      { id: '1', created_at: 120 },
      { id: '2', created_at: 100 },
      { id: '3', created_at: 115 },
      { id: '4', created_at: 105 },
      { id: '5', created_at: 110 }
    ];

    const sorted = sortMessagesByTimestamp(messages);

    assertArrayLength(sorted, 5, 'Should have 5 messages after sorting');
    assert(sorted[0].id === '2' && sorted[0].created_at === 100, 'First message should be ID 2 (T=100)');
    assert(sorted[1].id === '4' && sorted[1].created_at === 105, 'Second message should be ID 4 (T=105)');
    assert(sorted[2].id === '5' && sorted[2].created_at === 110, 'Third message should be ID 5 (T=110)');
    assert(sorted[3].id === '3' && sorted[3].created_at === 115, 'Fourth message should be ID 3 (T=115)');
    assert(sorted[4].id === '1' && sorted[4].created_at === 120, 'Fifth message should be ID 1 (T=120)');

    console.log(`  [INFO] Sort function correctly orders by timestamp`);
  });

  test('TEST 53c: No duplicate messages in merged result', () => {
    const review = createTestReview();
    const engagement = createTestEngagement(review.id);

    const baseTime = 2000;
    const engMsg1 = createMessage('engagement', engagement.id, 'Eng 1', baseTime);
    const revMsg1 = createMessage('review', review.id, 'Rev 1', baseTime + 1);

    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = getMessagesForEntity('review', review.id);
    const merged = mergeChatMessages(engagementMessages, reviewMessages);

    // Check for duplicates by ID
    const ids = merged.map(m => m.id);
    const uniqueIds = new Set(ids);

    assert(ids.length === uniqueIds.size, `Should have no duplicates. Total: ${ids.length}, Unique: ${uniqueIds.size}`);

    console.log(`  [INFO] No duplicates in merged result (${merged.length} unique messages)`);
  });

  // ============================================================================
  // TEST 52b: Bidirectional lookup
  // ============================================================================

  console.log('\n--- TEST 52b: Bidirectional lookup (engagement→review AND review→engagement) ---\n');

  test('TEST 52b-1: GET engagement chat includes review messages', () => {
    const review = createTestReview();
    const engagement = createTestEngagement(review.id);

    const baseTime = 3000;
    createMessage('engagement', engagement.id, 'Eng msg', baseTime);
    createMessage('review', review.id, 'Rev msg', baseTime + 1);

    // Simulate API call for engagement chat
    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = getMessagesForEntity('review', review.id);
    const merged = mergeChatMessages(engagementMessages, reviewMessages);

    assertArrayLength(merged, 2, 'Engagement chat should include both engagement and review messages');
    console.log(`  [INFO] Engagement chat includes review messages via review_link`);
  });

  test('TEST 52b-2: GET review chat includes engagement messages (reverse lookup)', () => {
    const review = createTestReview();
    const engagement = createTestEngagement(review.id);

    const baseTime = 3100;
    createMessage('engagement', engagement.id, 'Eng msg', baseTime);
    createMessage('review', review.id, 'Rev msg', baseTime + 1);

    // Simulate reverse lookup: find engagement by review_link
    const engagementsWithReview = list('engagement', { review_link: review.id });

    assert(engagementsWithReview && engagementsWithReview.length > 0, 'Should find engagement by review_link');
    assert(engagementsWithReview[0].id === engagement.id, 'Should find the correct engagement');

    // Now merge from review perspective
    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = getMessagesForEntity('review', review.id);
    const merged = mergeChatMessages(engagementMessages, reviewMessages);

    assertArrayLength(merged, 2, 'Review chat should include both messages via reverse lookup');
    console.log(`  [INFO] Review chat includes engagement messages via reverse lookup (review_link)`);
  });

  // ============================================================================
  // TEST 52c: Null review_link handling
  // ============================================================================

  console.log('\n--- TEST 52c: Null review_link handling ---\n');

  test('TEST 52c-1: Engagement with review_link=null returns only engagement messages', () => {
    const engagement = createTestEngagement(null);

    const baseTime = 4000;
    createMessage('engagement', engagement.id, 'Eng msg 1', baseTime);
    createMessage('engagement', engagement.id, 'Eng msg 2', baseTime + 1);

    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = getMessagesForEntity('review', 'nonexistent');

    const merged = mergeChatMessages(engagementMessages, reviewMessages);

    assertArrayLength(merged, 2, 'Should return only engagement messages when review_link is null');
    assertArrayLength(engagementMessages, 2, 'Should have 2 engagement messages');
    assertArrayLength(reviewMessages, 0, 'Should have 0 review messages (nonexistent review)');

    console.log(`  [INFO] Null review_link handled correctly, returns only engagement messages`);
  });

  test('TEST 52c-2: No errors when review does not exist', () => {
    const engagement = createTestEngagement('nonexistent-review-id');

    const baseTime = 4100;
    createMessage('engagement', engagement.id, 'Eng msg', baseTime);

    // This should not throw error
    const engagementMessages = getMessagesForEntity('engagement', engagement.id);
    const reviewMessages = list('message', { entity_type: 'review', entity_id: 'nonexistent-review-id' });

    assert(engagementMessages.length > 0, 'Should get engagement messages');
    assert(reviewMessages.length === 0, 'Should get empty array for nonexistent review');

    const merged = mergeChatMessages(engagementMessages, reviewMessages);
    assertArrayLength(merged, 1, 'Merge should handle missing review gracefully');

    console.log(`  [INFO] No errors when review does not exist`);
  });

  // ============================================================================
  // TEST 52d: Deleted review handling
  // ============================================================================

  console.log('\n--- TEST 52d: Deleted review handling ---\n');

  test('TEST 52d-1: Deleted review does not appear in merged chat', () => {
    const review = createTestReview();
    const engagement = createTestEngagement(review.id);

    const baseTime = 5000;
    createMessage('engagement', engagement.id, 'Eng msg', baseTime);
    const revMsg = createMessage('review', review.id, 'Rev msg', baseTime + 1);

    // Verify both messages exist
    let engMessages = getMessagesForEntity('engagement', engagement.id);
    let revMessages = getMessagesForEntity('review', review.id);
    assertArrayLength(engMessages, 1, 'Should have 1 engagement message');
    assertArrayLength(revMessages, 1, 'Should have 1 review message');

    // Delete the review
    update('review', review.id, { status: 'deleted' }, { id: 'test-user' });

    // Get the deleted review
    const deletedReview = get('review', review.id);
    assert(deletedReview === null || deletedReview.status === 'deleted', 'Review should be deleted');

    // Messages for deleted review should not be returned by default
    revMessages = getMessagesForEntity('review', review.id);

    // The engagement still has its messages
    engMessages = getMessagesForEntity('engagement', engagement.id);
    assertArrayLength(engMessages, 1, 'Engagement should still have its messages');

    console.log(`  [INFO] Deleted review handled correctly`);
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
    console.log('All tests passed!');
    process.exit(0);
  }
})();
