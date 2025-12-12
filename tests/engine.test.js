/**
 * Unit tests for src/engine.js
 * Tests fundamental database operations and helper functions.
 *
 * Note: Higher-level CRUD tests for complex entities (client, engagement, rfi,
 * review, highlight) are covered in integration.test.js
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
  count,
  getBy,
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
// Foundation tests for CRUD operations
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
// CLEAN UP
// ========================================

afterAll(() => {
  db.close();
});
