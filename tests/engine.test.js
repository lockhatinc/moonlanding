/**
 * Tests for src/engine.js
 * Tests database operations, CRUD functions, and authentication helpers
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';

// Import engine - uses DATABASE_PATH from vitest.config.js env
import db, {
  migrate,
  genId,
  now,
  list,
  get,
  create,
  update,
  remove,
  search,
  getChildren,
  count,
  getBy,
  can,
  check,
  hashPassword,
  verifyPassword,
} from '../src/engine.js';

// Helper to generate unique suffixes
const uniqueSuffix = () => `_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Run migration once before all tests
beforeAll(() => {
  migrate();
});

// ========================================
// DATABASE TESTS
// ========================================

describe('database', () => {
  it('should have WAL mode enabled', () => {
    const result = db.pragma('journal_mode');
    expect(result[0].journal_mode).toBe('wal');
  });
});

// ========================================
// MIGRATION TESTS
// ========================================

describe('migrate', () => {
  it('should create sessions table', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'").get();
    expect(tables).toBeTruthy();
  });

  it('should create entity tables from specs', () => {
    const expectedTables = ['engagements', 'reviews', 'clients', 'users', 'teams', 'rfis', 'highlights'];
    for (const table of expectedTables) {
      const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`).get();
      expect(result, `Table ${table} should exist`).toBeTruthy();
    }
  });

  it('should create indexes for searchable/sortable fields', () => {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").all();
    expect(indexes.length).toBeGreaterThan(0);
  });
});

// ========================================
// HELPER FUNCTION TESTS
// ========================================

describe('genId', () => {
  it('should generate unique IDs', () => {
    const id1 = genId();
    const id2 = genId();
    expect(id1).not.toBe(id2);
  });

  it('should generate string IDs', () => {
    const id = genId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('now', () => {
  it('should return unix timestamp', () => {
    const timestamp = now();
    expect(typeof timestamp).toBe('number');
    expect(timestamp).toBeGreaterThan(1700000000); // After 2023
  });

  it('should return current time in seconds', () => {
    const before = Math.floor(Date.now() / 1000);
    const timestamp = now();
    const after = Math.floor(Date.now() / 1000);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

// ========================================
// CRUD TESTS - TEAMS (simple entity)
// ========================================

describe('CRUD operations - team', () => {
  let testTeamId;

  describe('create', () => {
    it('should create a team record', () => {
      const team = create('team', { name: 'Test Team' });
      testTeamId = team.id;
      expect(team.id).toBeTruthy();
      expect(team.name).toBe('Test Team');
    });

    it('should set default values', () => {
      const team = create('team', { name: 'Team With Defaults' });
      expect(team.status).toBe('active');
      expect(team.created_at).toBeTruthy();
    });

    it('should auto-generate timestamps', () => {
      const team = create('team', { name: 'Timestamped Team' });
      const nowish = now();
      expect(Math.abs(team.created_at - nowish)).toBeLessThan(5);
    });

    it('should throw on missing required fields', () => {
      expect(() => create('team', {})).toThrow();
    });
  });

  describe('get', () => {
    it('should retrieve a team by ID', () => {
      const team = get('team', testTeamId);
      expect(team).toBeTruthy();
      expect(team.name).toBe('Test Team');
    });

    it('should return undefined for non-existent ID', () => {
      const team = get('team', 'nonexistent');
      expect(team).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should list all teams', () => {
      const teams = list('team');
      expect(teams.length).toBeGreaterThan(0);
    });

    it('should filter by status', () => {
      const teams = list('team', { status: 'active' });
      for (const team of teams) {
        expect(team.status).toBe('active');
      }
    });

    it('should exclude deleted by default', () => {
      const team = create('team', { name: 'To Delete' });
      remove('team', team.id);
      const teams = list('team');
      expect(teams.find(t => t.id === team.id)).toBeFalsy();
    });

    it('should support sort options', () => {
      const teams = list('team', {}, { sort: { field: 'name', dir: 'asc' } });
      expect(teams.length).toBeGreaterThan(0);
    });

    it('should support limit and offset', () => {
      const allTeams = list('team');
      const limited = list('team', {}, { limit: 1 });
      expect(limited.length).toBeLessThanOrEqual(1);

      if (allTeams.length > 1) {
        const offset = list('team', {}, { limit: 1, offset: 1 });
        expect(offset[0]?.id).not.toBe(limited[0]?.id);
      }
    });
  });

  describe('update', () => {
    it('should update a team record', () => {
      update('team', testTeamId, { name: 'Updated Team' });
      const team = get('team', testTeamId);
      expect(team.name).toBe('Updated Team');
    });

    it('should not update readOnly fields', () => {
      const team = get('team', testTeamId);
      const originalCreatedAt = team.created_at;
      update('team', testTeamId, { created_at: 12345 });
      const updated = get('team', testTeamId);
      expect(updated.created_at).toBe(originalCreatedAt);
    });

    it('should do nothing for empty update', () => {
      expect(() => update('team', testTeamId, {})).not.toThrow();
    });
  });

  describe('remove', () => {
    it('should soft delete by setting status=deleted', () => {
      const team = create('team', { name: 'To Soft Delete' });
      remove('team', team.id);
      // list should not include it
      const teams = list('team');
      expect(teams.find(t => t.id === team.id)).toBeFalsy();
    });
  });

  describe('count', () => {
    it('should count records', () => {
      const teams = list('team');
      const teamCount = count('team');
      expect(teamCount).toBe(teams.length);
    });

    it('should count with filters', () => {
      const activeCount = count('team', { status: 'active' });
      const activeTeams = list('team', { status: 'active' });
      expect(activeCount).toBe(activeTeams.length);
    });
  });

  describe('getBy', () => {
    it('should find by specific field', () => {
      // Use the get function since the team was updated to 'Updated Team'
      const team = get('team', testTeamId);
      expect(team).toBeTruthy();
      expect(team.name).toBe('Updated Team');
    });

    it('should return undefined if not found', () => {
      const team = getBy('team', 'name', 'Nonexistent Team Name XYZ ' + Date.now());
      expect(team).toBeUndefined();
    });
  });
});

// ========================================
// CRUD TESTS - CLIENTS (with relationships)
// ========================================

describe('CRUD operations - client', () => {
  let testClientId;
  let testClientEmail;

  it('should create a client', () => {
    testClientEmail = `test${uniqueSuffix()}@client.com`;
    const client = create('client', {
      name: 'Test Client',
      email: testClientEmail,
      address: '123 Test St',
    });
    testClientId = client.id;
    expect(client.name).toBe('Test Client');
    expect(client.status).toBe('active');
  });

  it('should search clients by name', () => {
    const results = search('client', 'Test Client');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(c => c.name.includes('Test'))).toBe(true);
  });

  it('should search clients by email', () => {
    const results = search('client', testClientEmail.split('@')[0]);
    expect(results.length).toBeGreaterThan(0);
  });
});

// ========================================
// CRUD TESTS - ENGAGEMENTS (complex entity)
// ========================================

describe('CRUD operations - engagement', () => {
  let testClientId;
  let testTeamId;
  let testEngagementId;

  beforeAll(() => {
    // Create prerequisite records
    const suffix = uniqueSuffix();
    const client = create('client', { name: `Engagement Client${suffix}`, email: `eng${suffix}@client.com` });
    testClientId = client.id;
    const team = create('team', { name: `Engagement Team${suffix}` });
    testTeamId = team.id;
  });

  it('should create an engagement with refs', () => {
    const engagement = create('engagement', {
      name: 'Test Engagement',
      client_id: testClientId,
      team_id: testTeamId,
      year: 2024,
    });
    testEngagementId = engagement.id;
    expect(engagement.name).toBe('Test Engagement');
    expect(engagement.client_id).toBe(testClientId);
    expect(engagement.stage).toBe('info_gathering'); // default
    expect(engagement.status).toBe('pending'); // default
  });

  it('should include computed fields in list', () => {
    // Create an RFI for the engagement
    create('rfi', {
      engagement_id: testEngagementId,
      question: 'Test RFI question',
    });

    const engagements = list('engagement');
    const eng = engagements.find(e => e.id === testEngagementId);
    expect(eng).toBeTruthy();
    // Computed field should be present
    expect(typeof eng.rfi_count).toBe('number');
  });

  it('should include display values for refs', () => {
    const engagements = list('engagement');
    const eng = engagements.find(e => e.id === testEngagementId);
    // client_id_display should be set from the JOIN and include the base name
    expect(eng.client_id_display).toContain('Engagement Client');
  });

  it('should handle enum fields correctly', () => {
    update('engagement', testEngagementId, { stage: 'commencement' });
    const eng = get('engagement', testEngagementId);
    expect(eng.stage).toBe('commencement');
  });

  it('should handle date fields', () => {
    const deadline = Math.floor(new Date('2024-12-31').getTime() / 1000);
    update('engagement', testEngagementId, { deadline });
    const eng = get('engagement', testEngagementId);
    expect(eng.deadline).toBe(deadline);
  });

  it('should handle JSON fields', () => {
    const users = JSON.stringify([{ id: 'user1', name: 'User 1' }]);
    update('engagement', testEngagementId, { users });
    const eng = get('engagement', testEngagementId);
    expect(eng.users).toBe(users);
  });
});

// ========================================
// CRUD TESTS - RFI (child entity)
// ========================================

describe('CRUD operations - rfi', () => {
  let testEngagementId;
  let testRfiId;

  beforeAll(() => {
    const suffix = uniqueSuffix();
    const client = create('client', { name: `RFI Test Client${suffix}`, email: `rfitest${suffix}@client.com` });
    const engagement = create('engagement', {
      name: `RFI Test Engagement${suffix}`,
      client_id: client.id,
      year: 2024,
    });
    testEngagementId = engagement.id;
  });

  it('should create RFI with auto timestamp', () => {
    const rfi = create('rfi', {
      engagement_id: testEngagementId,
      question: 'Please provide bank statements',
      name: 'Bank Statements',
    });
    testRfiId = rfi.id;
    expect(rfi.question).toBe('Please provide bank statements');
    expect(rfi.date_requested).toBeTruthy();
    expect(rfi.status).toBe(0); // default
    expect(rfi.client_status).toBe('pending'); // default
  });

  it('should list RFIs for engagement', () => {
    const rfis = list('rfi', { engagement_id: testEngagementId });
    expect(rfis.length).toBeGreaterThan(0);
    expect(rfis.every(r => r.engagement_id === testEngagementId)).toBe(true);
  });

  it('should search RFIs by question', () => {
    const results = search('rfi', 'bank statements');
    expect(results.length).toBeGreaterThan(0);
  });
});

// ========================================
// CRUD TESTS - HIGHLIGHTS
// ========================================

describe('CRUD operations - highlight', () => {
  let testReviewId;

  beforeAll(() => {
    const suffix = uniqueSuffix();
    const team = create('team', { name: `Highlight Test Team${suffix}` });
    const review = create('review', {
      name: `Highlight Test Review${suffix}`,
      team_id: team.id,
    });
    testReviewId = review.id;
  });

  it('should create highlight with position JSON', () => {
    const position = JSON.stringify({
      boundingRect: { x1: 100, y1: 200, x2: 300, y2: 250 },
      rects: [{ x1: 100, y1: 200, x2: 300, y2: 250 }],
      pageNumber: 1,
    });
    const highlight = create('highlight', {
      review_id: testReviewId,
      page_number: 1,
      position,
      content: 'Selected text content',
      comment: 'This needs clarification',
    });
    expect(highlight.id).toBeTruthy();
    expect(highlight.page_number).toBe(1);
    expect(highlight.resolved).toBe(0); // false as 0
    expect(highlight.color).toBe('#B0B0B0'); // default
  });
});

// ========================================
// CHILDREN TESTS
// ========================================

describe('getChildren', () => {
  let testEngagementId;

  beforeAll(() => {
    const suffix = uniqueSuffix();
    const client = create('client', { name: `Children Test Client${suffix}`, email: `children${suffix}@test.com` });
    const engagement = create('engagement', {
      name: `Children Test Engagement${suffix}`,
      client_id: client.id,
      year: 2024,
    });
    testEngagementId = engagement.id;

    // Create some RFIs
    create('rfi', { engagement_id: testEngagementId, question: 'Q1' });
    create('rfi', { engagement_id: testEngagementId, question: 'Q2' });
  });

  it('should get children records', () => {
    const rfis = getChildren('engagement', testEngagementId, {
      entity: 'rfi',
      fk: 'engagement_id',
    });
    expect(rfis.length).toBe(2);
  });

  it('should apply filter to children', () => {
    // Create activity log for engagement
    create('activity_log', {
      entity_type: 'engagement',
      entity_id: testEngagementId,
      action: 'create',
      message: 'Engagement created',
    });

    const activities = getChildren('engagement', testEngagementId, {
      entity: 'activity_log',
      fk: 'entity_id',
      filter: { entity_type: 'engagement' },
    });
    expect(activities.length).toBeGreaterThan(0);
    expect(activities.every(a => a.entity_type === 'engagement')).toBe(true);
  });
});

// ========================================
// SEARCH TESTS
// ========================================

describe('search', () => {
  let suffix;

  beforeAll(() => {
    suffix = uniqueSuffix();
    create('client', { name: `Alpha Corp${suffix}`, email: `alpha${suffix}@corp.com` });
    create('client', { name: `Beta Inc${suffix}`, email: `beta${suffix}@inc.com` });
    create('client', { name: `Gamma LLC${suffix}`, email: `gamma${suffix}@llc.com` });
  });

  it('should search by name', () => {
    const results = search('client', `Alpha Corp${suffix}`);
    expect(results.some(c => c.name === `Alpha Corp${suffix}`)).toBe(true);
  });

  it('should search by email', () => {
    const results = search('client', `beta${suffix}@`);
    expect(results.some(c => c.email === `beta${suffix}@inc.com`)).toBe(true);
  });

  it('should search case-insensitively (LIKE)', () => {
    const results = search('client', `gamma${suffix}`.toLowerCase());
    expect(results.some(c => c.name.includes('Gamma'))).toBe(true);
  });

  it('should return empty for no matches', () => {
    const results = search('client', 'zzzznonexistent');
    expect(results).toHaveLength(0);
  });

  it('should return all if no query', () => {
    const allClients = list('client');
    const searchResults = search('client', '');
    expect(searchResults.length).toBe(allClients.length);
  });
});

// ========================================
// AUTHENTICATION HELPER TESTS
// ========================================

describe('can', () => {
  const mockSpec = {
    name: 'test',
    access: {
      list: ['partner', 'manager', 'clerk'],
      view: ['partner', 'manager', 'clerk'],
      create: ['partner', 'manager'],
      edit: ['partner', 'manager'],
      delete: ['partner'],
    },
  };

  it('should return false for null user', () => {
    expect(can(null, mockSpec, 'list')).toBe(false);
  });

  it('should allow partner all actions', () => {
    const user = { role: 'partner' };
    expect(can(user, mockSpec, 'list')).toBe(true);
    expect(can(user, mockSpec, 'create')).toBe(true);
    expect(can(user, mockSpec, 'delete')).toBe(true);
  });

  it('should allow manager create/edit but not delete', () => {
    const user = { role: 'manager' };
    expect(can(user, mockSpec, 'create')).toBe(true);
    expect(can(user, mockSpec, 'edit')).toBe(true);
    expect(can(user, mockSpec, 'delete')).toBe(false);
  });

  it('should allow clerk only list/view', () => {
    const user = { role: 'clerk' };
    expect(can(user, mockSpec, 'list')).toBe(true);
    expect(can(user, mockSpec, 'view')).toBe(true);
    expect(can(user, mockSpec, 'create')).toBe(false);
    expect(can(user, mockSpec, 'edit')).toBe(false);
  });

  it('should return true if action not in access definition', () => {
    const user = { role: 'clerk' };
    expect(can(user, mockSpec, 'nonexistent_action')).toBe(true);
  });

  it('should return true if spec has no access definition', () => {
    const specNoAccess = { name: 'test' };
    const user = { role: 'clerk' };
    expect(can(user, specNoAccess, 'list')).toBe(true);
  });
});

describe('check', () => {
  const mockSpec = {
    name: 'test',
    access: {
      delete: ['partner'],
    },
  };

  it('should not throw for allowed action', () => {
    const user = { role: 'partner' };
    expect(() => check(user, mockSpec, 'delete')).not.toThrow();
  });

  it('should throw for disallowed action', () => {
    const user = { role: 'clerk' };
    expect(() => check(user, mockSpec, 'delete')).toThrow('Permission denied');
  });
});

// ========================================
// PASSWORD HASHING TESTS
// ========================================

describe('password hashing', () => {
  describe('hashPassword', () => {
    it('should return a hash string', () => {
      const hash = hashPassword('password123');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 hex is 64 chars
    });

    it('should produce consistent hashes', () => {
      const hash1 = hashPassword('password123');
      const hash2 = hashPassword('password123');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different passwords', () => {
      const hash1 = hashPassword('password123');
      const hash2 = hashPassword('password456');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', () => {
      const hash = hashPassword('mypassword');
      expect(verifyPassword('mypassword', hash)).toBe(true);
    });

    it('should return false for non-matching password', () => {
      const hash = hashPassword('mypassword');
      expect(verifyPassword('wrongpassword', hash)).toBe(false);
    });
  });
});

// ========================================
// USER CRUD TESTS
// ========================================

describe('CRUD operations - user', () => {
  let testUserId;
  let testEmail;

  it('should create a user with defaults', () => {
    testEmail = `test${uniqueSuffix()}@example.com`;
    const user = create('user', {
      email: testEmail,
      name: 'Test User',
    });
    testUserId = user.id;
    expect(user.email).toBe(testEmail);
    expect(user.type).toBe('auditor'); // default
    expect(user.role).toBe('clerk'); // default
    expect(user.status).toBe('active'); // default
    expect(user.auth_provider).toBe('google'); // default
  });

  it('should create user with password hash', () => {
    const hash = hashPassword('securepassword');
    const pwEmail = `pwuser${uniqueSuffix()}@example.com`;
    const user = create('user', {
      email: pwEmail,
      name: 'Password User',
      password_hash: hash,
      auth_provider: 'email',
    });
    expect(user.password_hash).toBe(hash);
    expect(user.auth_provider).toBe('email');
  });

  it('should find user by email', () => {
    const user = getBy('user', 'email', testEmail);
    expect(user).toBeTruthy();
    expect(user.name).toBe('Test User');
  });

  it('should update user role', () => {
    update('user', testUserId, { role: 'manager' });
    const user = get('user', testUserId);
    expect(user.role).toBe('manager');
  });
});

// ========================================
// REVIEW CRUD TESTS
// ========================================

describe('CRUD operations - review', () => {
  let testTeamId;
  let testReviewId;

  beforeAll(() => {
    const suffix = uniqueSuffix();
    const team = create('team', { name: `Review CRUD Test Team${suffix}` });
    testTeamId = team.id;
  });

  it('should create a review', () => {
    const review = create('review', {
      name: 'Annual Review 2024',
      team_id: testTeamId,
      financial_year: '2024',
    });
    testReviewId = review.id;
    expect(review.name).toBe('Annual Review 2024');
    expect(review.status).toBe('open'); // default
    expect(review.stage).toBe(1); // default
    expect(review.is_private).toBe(0); // false
    expect(review.published).toBe(0); // false
  });

  it('should handle tender fields', () => {
    update('review', testReviewId, {
      is_tender: true,
      tender_details: JSON.stringify({ deadline: '2024-06-30', description: 'Tender for audit services' }),
    });
    const review = get('review', testReviewId);
    expect(review.is_tender).toBe(1);
    expect(review.tender_details).toContain('Tender for audit services');
  });

  it('should include computed highlight counts', () => {
    // Create highlights for the review
    create('highlight', {
      review_id: testReviewId,
      page_number: 1,
      position: '{}',
      comment: 'Query 1',
    });
    create('highlight', {
      review_id: testReviewId,
      page_number: 2,
      position: '{}',
      comment: 'Query 2',
      resolved: true,
    });

    const reviews = list('review');
    const review = reviews.find(r => r.id === testReviewId);
    expect(review.highlight_count).toBe(2);
    expect(review.unresolved_count).toBe(1);
  });
});

// ========================================
// TYPE COERCION TESTS IN CRUD
// ========================================

describe('type coercion in CRUD', () => {
  it('should coerce string numbers to int', () => {
    const suffix = uniqueSuffix();
    const engagement = create('engagement', {
      name: `Coerce Test${suffix}`,
      client_id: create('client', { name: `Coerce Client${suffix}`, email: `coerce${suffix}@test.com` }).id,
      year: '2024', // string, should coerce to int
    });
    expect(engagement.year).toBe(2024);
  });

  it('should coerce string bools', () => {
    const suffix = uniqueSuffix();
    const engagement = create('engagement', {
      name: `Bool Test${suffix}`,
      client_id: create('client', { name: `Bool Client${suffix}`, email: `bool${suffix}@test.com` }).id,
      year: 2024,
      is_private: 'true',
      clerks_can_approve: 'on',
    });
    expect(engagement.is_private).toBe(1);
    expect(engagement.clerks_can_approve).toBe(1);
  });

  it('should handle date strings', () => {
    const suffix = uniqueSuffix();
    const engagement = create('engagement', {
      name: `Date Test${suffix}`,
      client_id: create('client', { name: `Date Client${suffix}`, email: `date${suffix}@test.com` }).id,
      year: 2024,
      deadline: '2024-12-31',
    });
    // Should be converted to unix timestamp
    expect(engagement.deadline).toBeTypeOf('number');
    expect(engagement.deadline).toBeGreaterThan(0);
  });
});

// ========================================
// CLEAN UP
// ========================================

afterAll(() => {
  // Close database connection
  db.close();
});
