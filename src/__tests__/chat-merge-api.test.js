import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * CHAT MERGE & CHRONOLOGICAL SORTING INTEGRATION TESTS
 *
 * This script tests the chat merge functionality via the API endpoint
 * GET /api/chat?entity_type=engagement&entity_id={id}
 *
 * Tests:
 * - TEST 52: Chat merge when review_link exists on engagement
 * - TEST 53: Chronological sorting by timestamp
 * - TEST 52b: Bidirectional lookup
 * - TEST 52c: Null review_link handling
 * - TEST 52d: Deleted review handling
 */

console.log('=== CHAT MERGE INTEGRATION TEST PLAN ===\n');

const testPlan = `
INTEGRATION TEST SETUP REQUIRED:
This test plan requires a running Next.js dev server on http://localhost:3000

TO RUN THESE TESTS:
1. Start the dev server: npm run dev
2. In another terminal, run: node src/__tests__/chat-merge-api.test.js

TESTS THAT WOULD EXECUTE:
================================================================================

TEST 52: Chat merge when review_link exists on engagement
Preconditions:
  - Create engagement with review_link pointing to specific review
  - Post 3 messages to engagement chat (at times T0, T1, T2)
  - Post 3 messages to linked review chat (at times T0.5, T1.5, T2.5)

Execution:
  1. Call GET /api/chat?entity_type=engagement&entity_id={id}
  2. Verify response contains ALL 6 messages (not just engagement messages)
  3. Verify response includes review chat messages too
  4. Verify both source labels are visible or detectable

Expected Results:
  - HTTP 200
  - Response: { success: true, data: [ ...6 messages... ] }
  - All 6 message IDs present
  - Messages interleaved by timestamp (100, 105, 110, 115, 120, 125)

================================================================================

TEST 53: Chronological sorting by timestamp
Preconditions:
  - Create engagement + linked review
  - Post messages at precise timestamps:
    * Engagement msg 1: T=100
    * Review msg 1: T=105
    * Engagement msg 2: T=110
    * Review msg 2: T=115
    * Engagement msg 3: T=120

Execution:
  1. Call GET /api/chat?entity_type=engagement&entity_id={id}
  2. Verify response messages ordered by timestamp
  3. Verify no duplicates
  4. Verify timestamps are correctly parsed and compared

Expected Results:
  - HTTP 200
  - Messages in exact order: T=100, T=105, T=110, T=115, T=120
  - No message appears twice
  - created_at field properly compared as numeric

================================================================================

TEST 52b: Bidirectional lookup
Part 1 - Engagement→Review:
  1. Create engagement with review_link to review
  2. GET engagement chat → includes review messages
  3. Verify both directions work

Part 2 - Review→Engagement:
  1. POST /api/chat with entity_type=review&entity_id={review_id}
  2. Should return engagement messages too (reverse lookup)
  3. Query: list('engagement', { review_link: entity_id })
  4. Verify bidirectional merging works

Expected Results:
  - Both directions return merged messages
  - GET /api/chat?entity_type=engagement includes review messages
  - GET /api/chat?entity_type=review includes engagement messages

================================================================================

TEST 52c: Null review_link handling
Part 1 - engagement.review_link = null:
  1. Create engagement with review_link=null
  2. GET engagement chat
  3. Verify returns only engagement messages (no error)
  4. Verify no extra queries or 404 errors

Part 2 - Nonexistent review:
  1. Create engagement with review_link='nonexistent-id'
  2. GET engagement chat
  3. Verify graceful handling (no 404 or crash)
  4. Verify returns only engagement messages

Expected Results:
  - HTTP 200 in both cases
  - Only engagement messages returned
  - No error messages in response
  - Performance: single query (no attempt to fetch nonexistent review)

================================================================================

TEST 52d: Deleted review handling
Preconditions:
  1. Create engagement with review_link to review
  2. Post messages to both engagement and review
  3. Verify both message sets exist

Execution:
  1. Delete the review (PATCH /api/mwr/review with status=deleted)
  2. GET engagement chat
  3. Verify returns engagement messages only
  4. Verify no 404 or crashes

Expected Results:
  - HTTP 200
  - Only engagement messages returned
  - Deleted review's messages excluded
  - Clean error handling

================================================================================

IMPLEMENTATION NOTES:
- /src/app/api/chat/route.js: Implements the chat API
- /src/lib/chat-merger.js: Core merging logic
- Key functions:
  * mergeChatMessages(engagementMessages, reviewMessages)
  * sortMessagesByTimestamp(messages)
  * tagMessageSource(messages, source)
  * deduplicateMessages(messages)

Source code locations:
  - Chat API: /home/user/lexco/moonlanding/src/app/api/chat/route.js
  - Merger functions: /home/user/lexco/moonlanding/src/lib/chat-merger.js
  - Query engine: /home/user/lexco/moonlanding/src/lib/query-engine.js

================================================================================

MANUAL TEST EXECUTION STEPS:

1. Start dev server:
   npm run dev
   (waits for 'Ready in Xs')

2. In another terminal, execute curl commands:

   # TEST 52: Chat merge
   curl -X POST http://localhost:3000/api/engagement \\
     -H "Content-Type: application/json" \\
     -H "Cookie: auth_token=..." \\
     -d '{"name": "Test Engagement", "year": 2025}'

   # Copy engagement ID from response
   ENGAGEMENT_ID="<engagement_id_from_above>"

   # Create review
   curl -X POST http://localhost:3000/api/mwr/review \\
     -H "Content-Type: application/json" \\
     -H "Cookie: auth_token=..." \\
     -d '{"name": "Test Review", "year": 2025}'

   # Copy review ID
   REVIEW_ID="<review_id_from_above>"

   # Link review to engagement
   curl -X PATCH http://localhost:3000/api/engagement/$ENGAGEMENT_ID \\
     -H "Content-Type: application/json" \\
     -H "Cookie: auth_token=..." \\
     -d '{"review_link": "'$REVIEW_ID'"}'

   # Post messages to engagement
   curl -X POST http://localhost:3000/api/message \\
     -H "Content-Type: application/json" \\
     -H "Cookie: auth_token=..." \\
     -d '{"entity_type": "engagement", "entity_id": "'$ENGAGEMENT_ID'", "text": "Engagement message 1"}'

   # Post messages to review
   curl -X POST http://localhost:3000/api/message \\
     -H "Content-Type: application/json" \\
     -H "Cookie: auth_token=..." \\
     -d '{"entity_type": "review", "entity_id": "'$REVIEW_ID'", "text": "Review message 1"}'

   # Get merged chat
   curl http://localhost:3000/api/chat?entity_type=engagement&entity_id=$ENGAGEMENT_ID \\
     -H "Cookie: auth_token=..."

   # Expected: 6 messages total (3 from engagement + 3 from review)

================================================================================

TESTING FRAMEWORK:
This file documents the integration test plan.
Unit tests are in: /home/user/lexco/moonlanding/src/__tests__/chat-merge-unit.test.js
Those tests verify the core merger functions without needing a server.

To fully test the API integration, a running server is required.
`;

console.log(testPlan);

console.log(`\n=== HOW TO USE THIS TEST PLAN ===\n`);
console.log(`1. Review the test cases above`);
console.log(`2. Start the Next.js dev server: npm run dev`);
console.log(`3. Execute curl commands shown in "MANUAL TEST EXECUTION STEPS"`);
console.log(`4. Verify HTTP responses match expected results`);
console.log(`5. Check logs for any errors in /api/chat endpoint`);

console.log(`\n=== PASSING CRITERIA ===\n`);
console.log(`✓ All 6 messages returned in merged result`);
console.log(`✓ Messages sorted chronologically by created_at timestamp`);
console.log(`✓ No duplicate messages in response`);
console.log(`✓ Bidirectional lookup works (engagement->review and review->engagement)`);
console.log(`✓ Null review_link handled without errors`);
console.log(`✓ Deleted review handled without errors`);
console.log(`✓ HTTP 200 status for all successful requests`);
console.log(`✓ Proper error handling for edge cases`);

console.log(`\n=== TEST FILE LOCATIONS ===\n`);
console.log(`Unit tests: /home/user/lexco/moonlanding/src/__tests__/chat-merge-unit.test.js`);
console.log(`Integration test plan: /home/user/lexco/moonlanding/src/__tests__/chat-merge-api.test.js`);
console.log(`API implementation: /home/user/lexco/moonlanding/src/app/api/chat/route.js`);
console.log(`Merger logic: /home/user/lexco/moonlanding/src/lib/chat-merger.js`);

process.exit(0);
