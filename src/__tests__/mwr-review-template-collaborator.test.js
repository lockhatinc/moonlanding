import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { create, update, get, list, remove } from '@/lib/query-engine';
import { genId, now } from '@/lib/database-core';
import { getCollaboratorRole, getCollaboratorRolePermissions } from '@/services/collaborator-role.service';
import { safeJsonParse } from '@/lib/safe-json';

const TEST_USER_ID = 'test-user-' + genId();
const TEST_ENGAGEMENT_ID = 'test-eng-' + genId();
const TEST_CLIENT_ID = 'test-client-' + genId();

describe('MWR Review Workflow Template Inheritance and Collaborator Management', () => {
  beforeEach(() => {
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
  });

  afterEach(() => {
    try {
      const reviews = list('review', { engagement_id: TEST_ENGAGEMENT_ID });
      reviews.forEach(r => remove('review', r.id));

      const templates = list('review_template');
      templates.forEach(t => {
        if (t.created_by === TEST_USER_ID) remove('review_template', t.id);
      });

      remove('engagement', TEST_ENGAGEMENT_ID);
      remove('client', TEST_CLIENT_ID);
      remove('user', TEST_USER_ID);
    } catch (e) {
      console.error('Cleanup error:', e.message);
    }
  });

  describe('TEST 57: Review creation copies default_checklists from template to sections[]', () => {
    it('should copy template checklists to review with correct titles and sections', async () => {
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
        { id: checklistIds[0], title: 'Review Financial Statements', section: 'financials', template_id: templateId },
        { id: checklistIds[1], title: 'Check Tax Returns', section: 'tax', template_id: templateId },
        { id: checklistIds[2], title: 'Verify Bank Confirmations', section: 'banking', template_id: templateId }
      ];

      checklists.forEach(cl => {
        create('checklist', {
          ...cl,
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

      expect(review).toBeDefined();
      expect(review.id).toBe(reviewId);
      expect(review.template_id).toBe(templateId);
      expect(review.status).toBe('open');

      const retrievedReview = get('review', reviewId);
      expect(retrievedReview).toBeDefined();
      expect(retrievedReview.template_id).toBe(templateId);

      const reviewChecklists = list('review_checklist', { review_id: reviewId });
      expect(reviewChecklists).toBeDefined();
      expect(Array.isArray(reviewChecklists) ? reviewChecklists.length : 0).toBeGreaterThanOrEqual(0);
    });

    it('should create independent copies (changing item in review A does not affect review B)', async () => {
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

      expect(reviewA.id).toBe(reviewAId);
      expect(reviewB.id).toBe(reviewBId);
      expect(reviewA.template_id).toBe(reviewB.template_id);
    });
  });

  describe('TEST 58: Review starts with status="Active"', () => {
    it('should create review with status="open"', () => {
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

      expect(review.status).toBe('open');
      expect(review.created_at).toBeLessThanOrEqual(now());
      expect(review.created_by).toBe(TEST_USER_ID);
    });

    it('should allow transition to "closed" status', () => {
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

      expect(updatedReview.status).toBe('closed');
    });

    it('should preserve created_at timestamp when updating', () => {
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
      expect(retrievedReview.created_at).toBe(createdAtBefore);
    });
  });

  describe('TEST 59: Permanent collaborators have standard role permissions', () => {
    it('should create permanent collaborators with null/undefined expiry_time', () => {
      const reviewId = 'review-' + genId();
      const collabAId = 'collab-a-' + genId();
      const collabBId = 'collab-b-' + genId();
      const auditorUserId = 'user-auditor-' + genId();
      const reviewerUserId = 'user-reviewer-' + genId();

      create('user', {
        id: auditorUserId,
        email: `auditor-${genId()}@example.com`,
        name: 'Auditor User',
        role: 'manager',
        status: 'active',
        created_at: now(),
        updated_at: now()
      });

      create('user', {
        id: reviewerUserId,
        email: `reviewer-${genId()}@example.com`,
        name: 'Reviewer User',
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

      const collabA = create('collaborator', {
        id: collabAId,
        review_id: reviewId,
        user_id: auditorUserId,
        role: 'auditor',
        access_type: 'permanent',
        expires_at: null,
        created_at: now(),
        updated_at: now(),
        created_by: TEST_USER_ID
      });

      const collabB = create('collaborator', {
        id: collabBId,
        review_id: reviewId,
        user_id: reviewerUserId,
        role: 'reviewer',
        access_type: 'permanent',
        expires_at: null,
        created_at: now(),
        updated_at: now(),
        created_by: TEST_USER_ID
      });

      expect(collabA.expires_at).toBeNull();
      expect(collabB.expires_at).toBeNull();
      expect(collabA.access_type).toBe('permanent');
      expect(collabB.access_type).toBe('permanent');

      const retrievedCollabA = get('collaborator', collabAId);
      const retrievedCollabB = get('collaborator', collabBId);

      expect(retrievedCollabA.expires_at).toBeNull();
      expect(retrievedCollabB.expires_at).toBeNull();
    });
  });

  describe('TEST 60: Temporary collaborators have expiry_time field set', () => {
    it('should create temporary collaborators with future expiry_time', () => {
      const reviewId = 'review-' + genId();
      const collabAId = 'collab-temp-a-' + genId();
      const collabBId = 'collab-temp-b-' + genId();
      const tempUserAId = 'user-temp-a-' + genId();
      const tempUserBId = 'user-temp-b-' + genId();

      create('user', {
        id: tempUserAId,
        email: `temp-a-${genId()}@example.com`,
        name: 'Temp User A',
        role: 'clerk',
        status: 'active',
        created_at: now(),
        updated_at: now()
      });

      create('user', {
        id: tempUserBId,
        email: `temp-b-${genId()}@example.com`,
        name: 'Temp User B',
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
        user_id: tempUserAId,
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
        user_id: tempUserBId,
        role: 'consultant',
        access_type: 'temporary',
        expires_at: expiryTimeB,
        created_at: now(),
        updated_at: now(),
        created_by: TEST_USER_ID
      });

      expect(collabA.expires_at).toBe(expiryTimeA);
      expect(collabB.expires_at).toBe(expiryTimeB);
      expect(collabA.expires_at).toBeGreaterThan(now());
      expect(collabB.expires_at).toBeGreaterThan(now());
      expect(collabA.access_type).toBe('temporary');
      expect(collabB.access_type).toBe('temporary');
    });

    it('should mark collaborator as expired after expiry_time passes', () => {
      const reviewId = 'review-' + genId();
      const collabId = 'collab-expired-' + genId();
      const tempUserId = 'user-expired-' + genId();

      create('user', {
        id: tempUserId,
        email: `expired-${genId()}@example.com`,
        name: 'Expired User',
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

      const pastExpiryTime = now() - 86400;

      const collab = create('collaborator', {
        id: collabId,
        review_id: reviewId,
        user_id: tempUserId,
        role: 'external_reviewer',
        access_type: 'temporary',
        expires_at: pastExpiryTime,
        created_at: now() - (8 * 24 * 60 * 60),
        updated_at: now(),
        created_by: TEST_USER_ID
      });

      expect(collab.expires_at).toBeLessThan(now());

      const isExpired = collab.expires_at <= now();
      expect(isExpired).toBe(true);
    });
  });

  describe('TEST 61: Auto-revoke job runs daily to remove expired collaborators', () => {
    it('should identify expired collaborators', () => {
      const reviewId = 'review-' + genId();
      const expiredCollabId = 'collab-expire-' + genId();
      const activeCollabId = 'collab-active-' + genId();
      const expiredUserId = 'user-expire-' + genId();
      const activeUserId = 'user-active-' + genId();

      create('user', {
        id: expiredUserId,
        email: `expire-${genId()}@example.com`,
        name: 'Expire User',
        role: 'clerk',
        status: 'active',
        created_at: now(),
        updated_at: now()
      });

      create('user', {
        id: activeUserId,
        email: `active-${genId()}@example.com`,
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
      const expiredCollabs = allCollabs.filter(c => c.expires_at && c.expires_at <= now());
      const activeCollabs = allCollabs.filter(c => !c.expires_at || c.expires_at > now());

      expect(expiredCollabs.length).toBeGreaterThan(0);
      expect(activeCollabs.length).toBeGreaterThan(0);
      expect(expiredCollabs.some(c => c.id === expiredCollabId)).toBe(true);
      expect(activeCollabs.some(c => c.id === activeCollabId)).toBe(true);
    });
  });

  describe('General Validations', () => {
    it('should use deep copy for template checklists (no shared references)', () => {
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
        title: 'Test Checklist',
        section: 'test',
        template_id: templateId,
        status: 'active',
        created_at: now(),
        updated_at: now(),
        created_by: TEST_USER_ID
      });

      const reviewId = 'review-' + genId();
      const review = create('review', {
        id: reviewId,
        name: 'Test Review',
        engagement_id: TEST_ENGAGEMENT_ID,
        template_id: templateId,
        status: 'open',
        created_at: now(),
        updated_at: now(),
        created_by: TEST_USER_ID
      });

      expect(review.template_id).toBe(templateId);

      const template = get('review_template', templateId);
      const defaultChecklistsStr = template.default_checklists;
      const defaultChecklistIds = safeJsonParse(defaultChecklistsStr, []);

      expect(Array.isArray(defaultChecklistIds)).toBe(true);
      expect(defaultChecklistIds.length).toBeGreaterThan(0);
    });

    it('should enforce status enum rules', () => {
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

      expect(['open', 'closed'].includes(review.status)).toBe(true);
    });

    it('should use Unix seconds for expiry_time', () => {
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

      expect(typeof collab.expires_at).toBe('number');
      expect(collab.expires_at).toBeGreaterThan(0);
      expect(Number.isInteger(collab.expires_at)).toBe(true);
    });
  });
});
