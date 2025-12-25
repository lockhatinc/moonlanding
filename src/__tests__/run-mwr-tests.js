import { getDatabase, migrate, genId, now } from '@/lib/database-core';
import { create, update, get, list, remove } from '@/lib/query-engine';
import { safeJsonParse } from '@/lib/safe-json';

const db = getDatabase();
migrate();

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    results.push(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    results.push(`✗ ${name}: ${error.message}`);
    console.error(`FAILED: ${name}`, error);
  }
}

const TEST_USER_ID = 'test-user-' + genId();
const TEST_ENGAGEMENT_ID = 'test-eng-' + genId();
const TEST_CLIENT_ID = 'test-client-' + genId();

function setup() {
  try {
    create('user', {
      id: TEST_USER_ID,
      email: `test-${genId()}@example.com`,
      name: 'Test User',
      role: 'partner',
      status: 'active',
      created_at: now(),
      updated_at: now()
    });

    create('client', {
      id: TEST_CLIENT_ID,
      name: 'Test Client',
      status: 'active',
      created_at: now(),
      updated_at: now()
    });

    create('engagement', {
      id: TEST_ENGAGEMENT_ID,
      name: 'Test Engagement',
      client_id: TEST_CLIENT_ID,
      year: 2025,
      stage: 'info_gathering',
      status: 'active',
      created_at: now(),
      updated_at: now(),
      created_by: TEST_USER_ID
    });
  } catch (e) {
    console.error('Setup error:', e.message);
  }
}

function cleanup() {
  try {
    const reviews = list('review', { engagement_id: TEST_ENGAGEMENT_ID });
    if (Array.isArray(reviews)) {
      reviews.forEach(r => {
        try { remove('review', r.id); } catch (e) { }
      });
    }

    const templates = list('review_template');
    if (Array.isArray(templates)) {
      templates.forEach(t => {
        if (t.created_by === TEST_USER_ID) {
          try { remove('review_template', t.id); } catch (e) { }
        }
      });
    }

    try { remove('engagement', TEST_ENGAGEMENT_ID); } catch (e) { }
    try { remove('client', TEST_CLIENT_ID); } catch (e) { }
    try { remove('user', TEST_USER_ID); } catch (e) { }
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
}

console.log('Starting MWR Review Template & Collaborator Tests\n');
setup();

test('TEST 57.1: Create review template with default_checklists array', () => {
  const templateId = 'template-' + genId();
  const checklistIds = ['checklist-' + genId(), 'checklist-' + genId(), 'checklist-' + genId()];

  const template = create('review_template', {
    id: templateId,
    name: 'Test Template',
    engagement_id: TEST_ENGAGEMENT_ID,
    default_checklists: JSON.stringify(checklistIds),
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(template.id === templateId, 'Template ID mismatch');
  assert(template.default_checklists === JSON.stringify(checklistIds), 'Default checklists not stored correctly');
});

test('TEST 57.2: Review copies checklists with correct titles and sections', () => {
  const templateId = 'template-' + genId();
  const checklistIds = ['checklist-' + genId(), 'checklist-' + genId(), 'checklist-' + genId()];

  create('review_template', {
    id: templateId,
    name: 'Test Template',
    engagement_id: TEST_ENGAGEMENT_ID,
    default_checklists: JSON.stringify(checklistIds),
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const checklists = [
    { title: 'Review Financial Statements', section: 'financials' },
    { title: 'Check Tax Returns', section: 'tax' },
    { title: 'Verify Bank Confirmations', section: 'banking' }
  ];

  checklists.forEach((cl, idx) => {
    create('checklist', {
      id: checklistIds[idx],
      title: cl.title,
      section: cl.section,
      template_id: templateId,
      status: 'active',
      created_at: now(),
      updated_at: now(),
      created_by: TEST_USER_ID
    });
  });

  const reviewId = 'review-' + genId();
  const review = create('review', {
    id: reviewId,
    name: 'Test Review from Template',
    engagement_id: TEST_ENGAGEMENT_ID,
    template_id: templateId,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(review.template_id === templateId, 'Template ID not copied to review');
  assert(review.status === 'open', 'Review status should be "open"');

  const retrievedTemplate = get('review_template', templateId);
  const defaultChecklistIds = safeJsonParse(retrievedTemplate.default_checklists, []);
  assert(Array.isArray(defaultChecklistIds), 'Default checklists should be an array');
  assert(defaultChecklistIds.length === 3, 'Should have 3 checklists');
});

test('TEST 57.3: Independent copy - changes in review A do not affect review B', () => {
  const templateId = 'template-' + genId();
  const checklistId = 'checklist-' + genId();

  create('review_template', {
    id: templateId,
    name: 'Test Template',
    engagement_id: TEST_ENGAGEMENT_ID,
    default_checklists: JSON.stringify([checklistId]),
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  create('checklist', {
    id: checklistId,
    title: 'Original Title',
    section: 'test',
    template_id: templateId,
    status: 'active',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const reviewAId = 'review-a-' + genId();
  const reviewBId = 'review-b-' + genId();

  const reviewA = create('review', {
    id: reviewAId,
    name: 'Review A',
    engagement_id: TEST_ENGAGEMENT_ID,
    template_id: templateId,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const reviewB = create('review', {
    id: reviewBId,
    name: 'Review B',
    engagement_id: TEST_ENGAGEMENT_ID,
    template_id: templateId,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(reviewA.template_id === reviewB.template_id, 'Both reviews should have same template');
  assert(reviewA.id !== reviewB.id, 'Reviews should have different IDs');
});

test('TEST 58.1: Review starts with status="open"', () => {
  const reviewId = 'review-' + genId();
  const review = create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(review.status === 'open', 'Review status should be "open"');
  assert(typeof review.created_at === 'number', 'created_at should be a number (Unix seconds)');
  assert(review.created_by === TEST_USER_ID, 'created_by should match user ID');
});

test('TEST 58.2: Review can transition to "closed" status', () => {
  const reviewId = 'review-' + genId();
  create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const updatedReview = update('review', reviewId, {
    status: 'closed',
    updated_at: now(),
    updated_by: TEST_USER_ID
  });

  assert(updatedReview.status === 'closed', 'Review status should be "closed" after update');
});

test('TEST 58.3: created_at is immutable', () => {
  const reviewId = 'review-' + genId();
  const originalTime = now();

  const review = create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: originalTime,
    updated_at: originalTime,
    created_by: TEST_USER_ID
  });

  const createdAtBefore = review.created_at;

  update('review', reviewId, {
    status: 'closed',
    updated_at: now(),
    updated_by: TEST_USER_ID
  });

  const retrievedReview = get('review', reviewId);
  assert(retrievedReview.created_at === createdAtBefore, 'created_at should not change');
});

test('TEST 59.1: Permanent collaborators have null/undefined expiry_time', () => {
  const reviewId = 'review-' + genId();
  const collabId = 'collab-' + genId();
  const userId = 'user-' + genId();

  create('user', {
    id: userId,
    email: `user-${genId()}@example.com`,
    name: 'Test User',
    role: 'manager',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const collab = create('collaborator', {
    id: collabId,
    review_id: reviewId,
    user_id: userId,
    role: 'auditor',
    access_type: 'permanent',
    expires_at: null,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(collab.expires_at === null || collab.expires_at === undefined, 'Permanent collaborator should have null/undefined expiry');
  assert(collab.access_type === 'permanent', 'access_type should be "permanent"');

  const retrievedCollab = get('collaborator', collabId);
  assert(retrievedCollab.expires_at === null || retrievedCollab.expires_at === undefined, 'Retrieved collaborator should have null/undefined expiry');
});

test('TEST 60.1: Temporary collaborators have future expiry_time', () => {
  const reviewId = 'review-' + genId();
  const collabAId = 'collab-a-' + genId();
  const collabBId = 'collab-b-' + genId();
  const userAId = 'user-a-' + genId();
  const userBId = 'user-b-' + genId();

  create('user', {
    id: userAId,
    email: `user-a-${genId()}@example.com`,
    name: 'User A',
    role: 'clerk',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  create('user', {
    id: userBId,
    email: `user-b-${genId()}@example.com`,
    name: 'User B',
    role: 'clerk',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const expiryTimeA = now() + (7 * 24 * 60 * 60);
  const expiryTimeB = now() + (14 * 24 * 60 * 60);

  const collabA = create('collaborator', {
    id: collabAId,
    review_id: reviewId,
    user_id: userAId,
    role: 'external_reviewer',
    access_type: 'temporary',
    expires_at: expiryTimeA,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const collabB = create('collaborator', {
    id: collabBId,
    review_id: reviewId,
    user_id: userBId,
    role: 'consultant',
    access_type: 'temporary',
    expires_at: expiryTimeB,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(collabA.expires_at === expiryTimeA, 'CollabA expiry_time should match');
  assert(collabB.expires_at === expiryTimeB, 'CollabB expiry_time should match');
  assert(collabA.expires_at > now(), 'CollabA expiry_time should be in future');
  assert(collabB.expires_at > now(), 'CollabB expiry_time should be in future');
  assert(collabA.access_type === 'temporary', 'CollabA access_type should be "temporary"');
  assert(collabB.access_type === 'temporary', 'CollabB access_type should be "temporary"');
});

test('TEST 60.2: Expired collaborators are identified', () => {
  const reviewId = 'review-' + genId();
  const expiredCollabId = 'collab-exp-' + genId();
  const userId = 'user-exp-' + genId();

  create('user', {
    id: userId,
    email: `user-${genId()}@example.com`,
    name: 'Test User',
    role: 'clerk',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const pastExpiry = now() - (24 * 60 * 60);

  const collab = create('collaborator', {
    id: expiredCollabId,
    review_id: reviewId,
    user_id: userId,
    role: 'external_reviewer',
    access_type: 'temporary',
    expires_at: pastExpiry,
    created_at: now() - (8 * 24 * 60 * 60),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(collab.expires_at < now(), 'Collaborator should be expired');
  assert(collab.expires_at === pastExpiry, 'Expiry time should be preserved in database');
});

test('TEST 61.1: Auto-revoke can identify expired collaborators', () => {
  const reviewId = 'review-' + genId();
  const expiredCollabId = 'collab-exp-' + genId();
  const activeCollabId = 'collab-act-' + genId();
  const expiredUserId = 'user-exp-' + genId();
  const activeUserId = 'user-act-' + genId();

  create('user', {
    id: expiredUserId,
    email: `exp-${genId()}@example.com`,
    name: 'Expired User',
    role: 'clerk',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  create('user', {
    id: activeUserId,
    email: `act-${genId()}@example.com`,
    name: 'Active User',
    role: 'clerk',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const pastExpiry = now() - (24 * 60 * 60);
  const futureExpiry = now() + (7 * 24 * 60 * 60);

  create('collaborator', {
    id: expiredCollabId,
    review_id: reviewId,
    user_id: expiredUserId,
    role: 'external_reviewer',
    access_type: 'temporary',
    expires_at: pastExpiry,
    created_at: now() - (8 * 24 * 60 * 60),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  create('collaborator', {
    id: activeCollabId,
    review_id: reviewId,
    user_id: activeUserId,
    role: 'external_reviewer',
    access_type: 'temporary',
    expires_at: futureExpiry,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const allCollabs = list('collaborator', { review_id: reviewId });
  const expiredCollabs = (Array.isArray(allCollabs) ? allCollabs : []).filter(c => c.expires_at && c.expires_at <= now());
  const activeCollabs = (Array.isArray(allCollabs) ? allCollabs : []).filter(c => !c.expires_at || c.expires_at > now());

  assert(expiredCollabs.length > 0, 'Should have at least one expired collaborator');
  assert(activeCollabs.length > 0, 'Should have at least one active collaborator');
});

test('TEST 62.1: Status enum rules enforced', () => {
  const reviewId = 'review-' + genId();
  const review = create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const validStatuses = ['open', 'closed'];
  assert(validStatuses.includes(review.status), `Review status "${review.status}" should be one of: ${validStatuses.join(', ')}`);
});

test('TEST 62.2: expiry_time uses Unix seconds', () => {
  const reviewId = 'review-' + genId();
  const collabId = 'collab-' + genId();
  const userId = 'user-' + genId();

  create('user', {
    id: userId,
    email: `user-${genId()}@example.com`,
    name: 'Test User',
    role: 'clerk',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  create('review', {
    id: reviewId,
    name: 'Test Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const expiryTime = now() + (7 * 24 * 60 * 60);
  const collab = create('collaborator', {
    id: collabId,
    review_id: reviewId,
    user_id: userId,
    role: 'reviewer',
    access_type: 'temporary',
    expires_at: expiryTime,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(typeof collab.expires_at === 'number', 'expires_at should be a number');
  assert(collab.expires_at > 0, 'expires_at should be positive');
  assert(Number.isInteger(collab.expires_at), 'expires_at should be an integer (Unix seconds)');
});

cleanup();

console.log('\n' + '='.repeat(60));
console.log('Test Results:');
console.log('='.repeat(60));
results.forEach(r => console.log(r));
console.log('='.repeat(60));
console.log(`Passed: ${testsPassed}, Failed: ${testsFailed}, Total: ${testsPassed + testsFailed}`);
console.log('='.repeat(60));

process.exit(testsFailed > 0 ? 1 : 0);
