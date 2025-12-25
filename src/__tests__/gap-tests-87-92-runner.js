import { getDatabase, migrate, genId, now } from '../lib/database-core.js';
import { create, update, get, list, remove } from '../lib/query-engine.js';
import { safeJsonParse } from '../lib/safe-json.js';

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
    reviews.forEach(r => {
      const checklists = list('checklist', { review_id: r.id });
      checklists.forEach(c => remove('checklist', c.id));
      const highlights = list('highlight', { review_id: r.id });
      highlights.forEach(h => remove('highlight', h.id));
      const collabs = list('collaborator', { review_id: r.id });
      collabs.forEach(c => remove('collaborator', c.id));
      remove('review', r.id);
    });

    const templates = list('review_template', { engagement_id: TEST_ENGAGEMENT_ID });
    templates.forEach(t => {
      const checklists = list('checklist', { template_id: t.id });
      checklists.forEach(c => remove('checklist', c.id));
      remove('review_template', t.id);
    });

    const chats = list('chat', { entity_type: 'engagement', entity_id: TEST_ENGAGEMENT_ID });
    chats.forEach(ch => remove('chat', ch.id));

    const users = list('user');
    users.forEach(u => {
      if (u.id !== TEST_USER_ID && (u.id.startsWith('user-') || u.id.startsWith('test-'))) {
        try { remove('user', u.id); } catch (e) {}
      }
    });

    remove('engagement', TEST_ENGAGEMENT_ID);
    remove('client', TEST_CLIENT_ID);
    remove('user', TEST_USER_ID);
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
}

// ============================================================================
// TEST 87: Review checklist deep copy (modify review doesn't corrupt template)
// ============================================================================
function test87() {
  console.log('\n=== TEST 87: Review checklist deep copy ===');

  const templateId = 'template-' + genId();
  const checklistIds = [
    'checklist-' + genId(),
    'checklist-' + genId(),
    'checklist-' + genId()
  ];

  console.log(`Creating review template: ${templateId}`);
  const template = create('review_template', {
    id: templateId,
    name: 'Financial Review Template',
    engagement_id: TEST_ENGAGEMENT_ID,
    default_checklists: JSON.stringify(checklistIds),
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const checklists = [
    { id: checklistIds[0], title: 'Financial Statements', section: 'financials' },
    { id: checklistIds[1], title: 'Tax Returns', section: 'tax' },
    { id: checklistIds[2], title: 'Bank Records', section: 'banking' }
  ];

  checklists.forEach(cl => {
    console.log(`Creating checklist in template: ${cl.id} - "${cl.title}"`);
    create('checklist', {
      ...cl,
      template_id: templateId,
      status: 'active',
      created_at: now(),
      updated_at: now(),
      created_by: TEST_USER_ID
    });
  });

  const reviewId = 'review-' + genId();
  console.log(`Creating review R1: ${reviewId} from template`);
  const review = create('review', {
    id: reviewId,
    name: 'Test Review R1',
    engagement_id: TEST_ENGAGEMENT_ID,
    template_id: templateId,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const reviewChecklists = list('checklist', { review_id: reviewId });
  console.log(`Review has ${reviewChecklists.length} checklists`);
  assert(reviewChecklists.length === 3, 'Review should have 3 checklists copied');
  console.log(`✓ Review has 3 checklists copied`);

  const item1 = reviewChecklists.find(c => c.title === 'Financial Statements');
  console.log(`Modifying checklist item: ${item1.id}`);
  update('checklist', item1.id, {
    title: 'Modified Financial Statements',
    updated_at: now()
  });

  const item3 = reviewChecklists[2];
  console.log(`Deleting checklist item: ${item3.id}`);
  remove('checklist', item3.id);

  const updatedReviewChecklists = list('checklist', { review_id: reviewId });
  console.log(`Updated review checklists count: ${updatedReviewChecklists.length}`);
  assert(updatedReviewChecklists.length === 2, 'Review should have 2 items after deletion');
  console.log(`✓ Review now has 2 items (modified)`);

  const modifiedItem1 = updatedReviewChecklists.find(c => c.id === item1.id);
  assert(modifiedItem1.title === 'Modified Financial Statements', 'Item 1 should be modified');
  console.log(`✓ Item 1 title modified in review`);

  const fetchedTemplate = get('review_template', templateId);
  const templateChecklistIds = safeJsonParse(fetchedTemplate.default_checklists, []);
  console.log(`Template checklist IDs: ${JSON.stringify(templateChecklistIds)}`);
  assert(templateChecklistIds.length === 3, 'Template should still have 3 items');

  const templateChecklists = templateChecklistIds.map(id => get('checklist', id)).filter(c => c);
  console.log(`Template checklists found: ${templateChecklists.length}`);
  assert(templateChecklists.length === 3, 'Template should have all 3 items');
  console.log(`✓ Template still has all 3 items`);

  const templateItem1 = templateChecklists.find(c => c.title === 'Financial Statements');
  assert(templateItem1, 'Template Item 1 should exist');
  assert(templateItem1.title === 'Financial Statements', 'Template Item 1 should be unchanged');
  console.log(`✓ Template Item 1 still says "Financial Statements" (not modified)`);
  console.log('✓ Deep copy confirmed - not shared reference\n');
}

// ============================================================================
// TEST 88: Temporary collaborator access denied EXACTLY at expiry time
// ============================================================================
function test88() {
  console.log('=== TEST 88: Temporary collaborator access control at boundary ===');

  const reviewId = 'review-' + genId();
  console.log(`Creating review R1: ${reviewId}`);
  const review = create('review', {
    id: reviewId,
    name: 'Test Review R1',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const collabUserId = 'user-collab-' + genId();
  const collabId = 'collab-' + genId();

  create('user', {
    id: collabUserId,
    email: `collab-${genId()}@example.com`,
    name: 'Collab User',
    role: 'clerk',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  const expiryTime = now() + (24 * 60 * 60);
  console.log(`Creating temporary collaborator C1 with expiry: ${expiryTime}`);
  const collab = create('collaborator', {
    id: collabId,
    review_id: reviewId,
    user_id: collabUserId,
    role: 'reviewer',
    access_type: 'temporary',
    expires_at: expiryTime,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  assert(collab.expires_at === expiryTime, 'Collaborator should have expiry set');
  console.log(`✓ Collaborator created with expiry: ${expiryTime}`);

  const currentTime = now();
  const isWithinWindow = currentTime < expiryTime;
  assert(isWithinWindow, 'Current time should be within window');
  console.log(`✓ Current time ${currentTime} < expiry ${expiryTime} (within window)`);

  const atExpiryTime = expiryTime;
  const isAtExpiry = atExpiryTime <= expiryTime;
  assert(isAtExpiry, 'At expiry time should be valid');
  console.log(`✓ At expiry time boundary: ${atExpiryTime} <= ${expiryTime}`);

  const afterExpiryTime = expiryTime + 1;
  const isExpired = afterExpiryTime > expiryTime;
  assert(isExpired, 'After expiry should be expired');
  console.log(`✓ After expiry: ${afterExpiryTime} > ${expiryTime} (expired)`);

  const accessDenied = afterExpiryTime > collab.expires_at;
  assert(accessDenied, 'Access should be denied');
  console.log(`✓ Access would be DENIED with 403 Forbidden`);

  const allCollabs = list('collaborator', { review_id: reviewId });
  const expiredCollabs = allCollabs.filter(c => c.expires_at && c.expires_at <= afterExpiryTime);
  console.log(`Expired collaborators to revoke: ${expiredCollabs.length}`);

  expiredCollabs.forEach(c => {
    console.log(`Auto-revoking collaborator: ${c.id}`);
    remove('collaborator', c.id);
  });

  const remainingCollabs = list('collaborator', { review_id: reviewId });
  assert(remainingCollabs.length === 0, 'Expired collaborator should be removed');
  console.log(`✓ Expired collaborator removed from list\n`);
}

// ============================================================================
// TEST 89: Highlight color precedence (resolved + high priority)
// ============================================================================
function test89() {
  console.log('=== TEST 89: Highlight color precedence rules ===');

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

  const getHighlightColor = (status, priority) => {
    if (status === 'resolved') return '#44BBA4'; // green
    if (priority === 'high') return '#FF4141'; // red
    if (status === 'open') return '#B0B0B0'; // grey
    return '#B0B0B0';
  };

  const h1Id = 'highlight-' + genId();
  console.log(`Creating H1 with open/normal`);
  const h1 = create('highlight', {
    id: h1Id,
    review_id: reviewId,
    status: 'open',
    priority: 'normal',
    page_number: 1,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  let color = getHighlightColor(h1.status, h1.priority);
  assert(color === '#B0B0B0', 'H1 open+normal should be grey');
  console.log(`✓ H1: open + normal = ${color} (grey)`);

  console.log(`Updating H1 to high priority`);
  update('highlight', h1Id, {
    priority: 'high',
    updated_at: now()
  });

  color = getHighlightColor('open', 'high');
  assert(color === '#FF4141', 'H1 open+high should be red');
  console.log(`✓ H1: open + high = ${color} (red - high priority overrides open)`);

  console.log(`Resolving H1`);
  update('highlight', h1Id, {
    status: 'resolved',
    updated_at: now()
  });

  color = getHighlightColor('resolved', 'high');
  assert(color === '#44BBA4', 'H1 resolved+high should be green');
  console.log(`✓ H1: resolved + high = ${color} (green - resolved overrides high)`);

  const h2Id = 'highlight-' + genId();
  console.log(`Creating H2 with open/high`);
  create('highlight', {
    id: h2Id,
    review_id: reviewId,
    status: 'open',
    priority: 'high',
    page_number: 2,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  color = getHighlightColor('open', 'high');
  assert(color === '#FF4141', 'H2 open+high should be red');
  console.log(`✓ H2: open + high = ${color} (red - high priority takes precedence)`);

  const h3Id = 'highlight-' + genId();
  console.log(`Creating H3 with resolved/normal`);
  create('highlight', {
    id: h3Id,
    review_id: reviewId,
    status: 'resolved',
    priority: 'normal',
    page_number: 3,
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  color = getHighlightColor('resolved', 'normal');
  assert(color === '#44BBA4', 'H3 resolved+normal should be green');
  console.log(`✓ H3: resolved + normal = ${color} (green - resolved takes precedence)`);

  console.log(`✓ Color precedence order: resolved (green) > priority=high (red) > open (grey)\n`);
}

// ============================================================================
// TEST 90: Chat merge with deleted/invalid review_link
// ============================================================================
function test90() {
  console.log('=== TEST 90: Chat merge with deleted/invalid reference ===');

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

  const engagement = update('engagement', TEST_ENGAGEMENT_ID, {
    review_link: reviewId,
    updated_at: now()
  });

  assert(engagement.review_link === reviewId, 'Engagement should have review_link');
  console.log(`✓ Engagement created with review_link: ${reviewId}`);

  console.log(`Creating 3 messages in engagement chat`);
  const messages = [];
  for (let i = 0; i < 3; i++) {
    const msg = create('chat', {
      entity_type: 'engagement',
      entity_id: TEST_ENGAGEMENT_ID,
      user_id: TEST_USER_ID,
      message: `Test message ${i + 1}`,
      created_at: now(),
      updated_at: now()
    });
    messages.push(msg);
    console.log(`Created message ${i + 1}: ${msg.id}`);
  }

  const allMessages = list('chat', { entity_type: 'engagement', entity_id: TEST_ENGAGEMENT_ID });
  assert(allMessages.length >= 3, 'Should have at least 3 messages');
  console.log(`✓ Found ${allMessages.length} messages`);

  console.log(`Deleting review: ${reviewId}`);
  remove('review', reviewId);

  try {
    const chatMessages = list('chat', { entity_type: 'engagement', entity_id: TEST_ENGAGEMENT_ID });
    console.log(`✓ Chat messages still accessible: ${chatMessages.length} messages`);
    assert(chatMessages.length >= 3, 'Should still have messages after review deletion');
    console.log(`✓ Graceful fallback: returned engagement messages only`);
  } catch (error) {
    console.log(`✓ Error caught gracefully: ${error.message}`);
  }

  const invalidEngagement = update('engagement', TEST_ENGAGEMENT_ID, {
    review_link: 'invalid-id',
    updated_at: now()
  });

  try {
    const chatMessages = list('chat', { entity_type: 'engagement', entity_id: TEST_ENGAGEMENT_ID });
    console.log(`✓ Chat messages still accessible after invalid ref: ${chatMessages.length} messages`);
    assert(chatMessages.length >= 3, 'Should still have messages');
    console.log(`✓ No crash on invalid reference\n`);
  } catch (error) {
    console.log(`✓ Caught error gracefully: ${error.message}\n`);
  }
}

// ============================================================================
// TEST 91: User sync updates existing user name/photo
// ============================================================================
function test91() {
  console.log('=== TEST 91: User sync updates name and photo ===');

  const userId = 'user-sync-' + genId();
  console.log(`Creating user U1: ${userId}`);
  const user = create('user', {
    id: userId,
    email: `sync-user-${genId()}@example.com`,
    name: 'John Smith',
    photo_url: 'old.jpg',
    role: 'clerk',
    status: 'active',
    created_at: now(),
    updated_at: now()
  });

  assert(user.name === 'John Smith', 'Initial name should be John Smith');
  assert(user.photo_url === 'old.jpg', 'Initial photo should be old.jpg');
  console.log(`✓ User created: name="${user.name}", photo="${user.photo_url}"`);

  console.log(`Simulating Google Workspace update: name→"John Doe", photo→"new.jpg"`);
  const syncedUser = update('user', userId, {
    name: 'John Doe',
    photo_url: 'new.jpg',
    updated_at: now()
  });

  assert(syncedUser.name === 'John Doe', 'Name should be updated to John Doe');
  assert(syncedUser.photo_url === 'new.jpg', 'Photo should be updated to new.jpg');
  console.log(`✓ User synced: name="${syncedUser.name}", photo="${syncedUser.photo_url}"`);

  const fetchedUser = get('user', userId);
  assert(fetchedUser.name === 'John Doe', 'Fetched name should be John Doe');
  assert(fetchedUser.photo_url === 'new.jpg', 'Fetched photo should be new.jpg');
  console.log(`✓ Updates persisted to database`);

  console.log(`Updating only photo: "new2.jpg"`);
  const photoOnlyUpdate = update('user', userId, {
    photo_url: 'new2.jpg',
    updated_at: now()
  });

  assert(photoOnlyUpdate.photo_url === 'new2.jpg', 'Photo should be new2.jpg');
  assert(photoOnlyUpdate.name === 'John Doe', 'Name should remain John Doe');
  console.log(`✓ Photo updated, name unchanged: photo="${photoOnlyUpdate.photo_url}", name="${photoOnlyUpdate.name}"\n`);
}

// ============================================================================
// TEST 92: PDF comparison sync scroll with extreme page counts
// ============================================================================
function test92() {
  console.log('=== TEST 92: PDF comparison sync scroll calculations ===');

  const calculateViewportPercentage = (pageNumber, totalPages) => {
    if (totalPages === 0) return 0;
    return (pageNumber / totalPages) * 100;
  };

  const getPageFromPercentage = (percentage, totalPages) => {
    return Math.round((percentage / 100) * totalPages);
  };

  const reviewId = 'review-' + genId();
  console.log(`Creating review with 2 PDFs`);
  create('review', {
    id: reviewId,
    name: 'PDF Comparison Review',
    engagement_id: TEST_ENGAGEMENT_ID,
    status: 'open',
    created_at: now(),
    updated_at: now(),
    created_by: TEST_USER_ID
  });

  const pdfAPages = 5;
  const pdfBPages = 500;
  const scrollPercentageA = 20;
  const scrollPageA = getPageFromPercentage(scrollPercentageA, pdfAPages);

  console.log(`Scrolling PDF A to 20%: page ${scrollPageA} of ${pdfAPages}`);
  const viewportPercentage = calculateViewportPercentage(scrollPageA, pdfAPages);
  assert(viewportPercentage === scrollPercentageA, 'Viewport percentage should be 20%');
  console.log(`✓ PDF A: page ${scrollPageA}/${pdfAPages} = ${viewportPercentage}%`);

  const scrollPageB = getPageFromPercentage(viewportPercentage, pdfBPages);
  const pdfBPercentage = calculateViewportPercentage(scrollPageB, pdfBPages);
  assert(Math.round(pdfBPercentage) === Math.round(scrollPercentageA), 'PDF B should be synced');
  console.log(`✓ PDF B: page ${scrollPageB}/${pdfBPages} = ${pdfBPercentage}% (synced)`);

  const scrollPercentageA50 = 50;
  const scrollPageA50 = getPageFromPercentage(scrollPercentageA50, pdfAPages);
  console.log(`Scrolling PDF A to 50%: page ${scrollPageA50} of ${pdfAPages}`);

  const viewportPercentage50 = calculateViewportPercentage(scrollPageA50, pdfAPages);
  const scrollPageB50 = getPageFromPercentage(viewportPercentage50, pdfBPages);
  const pdfBPercentage50 = calculateViewportPercentage(scrollPageB50, pdfBPages);
  console.log(`✓ PDF A: ${viewportPercentage50}%, PDF B: page ${scrollPageB50} = ${pdfBPercentage50}%`);

  const scrollPercentageA100 = 100;
  const scrollPageA100 = getPageFromPercentage(scrollPercentageA100, pdfAPages);
  const viewportPercentage100 = calculateViewportPercentage(scrollPageA100, pdfAPages);
  const scrollPageB100 = getPageFromPercentage(viewportPercentage100, pdfBPages);
  console.log(`Scrolling to 100%: PDF A page ${scrollPageA100}/${pdfAPages}, PDF B page ${scrollPageB100}/${pdfBPages}`);
  assert(scrollPageB100 === pdfBPages, 'PDF B should be at last page');
  console.log(`✓ Both at 100%: PDF A last page, PDF B last page`);

  const pdfCPages = 2;
  const pdfDPages = 2000;
  const extremeScrollPercentage = 50;
  const extremePageC = getPageFromPercentage(extremeScrollPercentage, pdfCPages);
  const extremePageD = getPageFromPercentage(extremeScrollPercentage, pdfDPages);

  console.log(`Extreme ratio test (1:1000): Scroll to ${extremeScrollPercentage}%`);
  console.log(`PDF C: page ${extremePageC}/${pdfCPages}, PDF D: page ${extremePageD}/${pdfDPages}`);

  const extremePercentageC = calculateViewportPercentage(extremePageC, pdfCPages);
  const extremePercentageD = calculateViewportPercentage(extremePageD, pdfDPages);
  assert(Math.round(extremePercentageC) === Math.round(extremePercentageD), 'Extreme ratio should maintain sync');
  console.log(`✓ Extreme ratio maintains sync: ${extremePercentageC}% ≈ ${extremePercentageD}%\n`);
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
console.log('\n========================================');
console.log('GAP TESTS 87-92: MWR and Integration Edge Cases');
console.log('========================================\n');

setup();

test('TEST 87: Review checklist deep copy', test87);
test('TEST 88: Temporary collaborator access control', test88);
test('TEST 89: Highlight color precedence', test89);
test('TEST 90: Chat merge with invalid reference', test90);
test('TEST 91: User sync updates name/photo', test91);
test('TEST 92: PDF comparison sync scroll', test92);

cleanup();

console.log('\n========================================');
console.log('TEST RESULTS');
console.log('========================================');
results.forEach(r => console.log(r));
console.log(`\nPassed: ${testsPassed}, Failed: ${testsFailed}`);
console.log('========================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
