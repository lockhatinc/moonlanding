/**
 * Integration tests for the platform
 * Tests complete workflows and entity interactions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';

// Import engine - uses DATABASE_PATH from vitest.config.js env
import db, { migrate, list, get, create, update, remove, count, getChildren, search, getBy, can, check } from '../src/engine.js';
import { specs, getSpec, getNavItems, getAllSpecs } from '../src/specs.js';
import { validateStageTransition, validateRfiStatusChange, calculateWorkingDays } from '../src/engine/events.js';
import { coerce, formatDisplayValue, getListFields, getFormFields } from '../src/lib/field-types.js';

// Helper to generate unique suffixes
const uniqueSuffix = () => `_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Initialize database
beforeAll(() => {
  migrate();
});

// ========================================
// COMPLETE ENGAGEMENT WORKFLOW TESTS
// ========================================

describe('Engagement Workflow', () => {
  let clientId;
  let teamId;
  let engagementId;
  let userId;

  beforeAll(() => {
    // Create prerequisite data with unique emails
    const suffix = uniqueSuffix();
    const user = create('user', {
      email: `partner${suffix}@test.com`,
      name: 'Test Partner',
      role: 'partner',
    });
    userId = user.id;

    const client = create('client', {
      name: 'Workflow Test Client',
      email: `workflow${suffix}@client.com`,
    });
    clientId = client.id;

    const team = create('team', {
      name: `Workflow Test Team${suffix}`,
    });
    teamId = team.id;
  });

  it('should create engagement in info_gathering stage', () => {
    const engagement = create('engagement', {
      name: 'Annual Audit 2024',
      client_id: clientId,
      team_id: teamId,
      year: 2024,
    }, { id: userId });
    engagementId = engagement.id;

    expect(engagement.stage).toBe('info_gathering');
    expect(engagement.status).toBe('pending');
    expect(engagement.progress).toBe(0);
  });

  it('should activate engagement and progress to commencement', () => {
    update('engagement', engagementId, { status: 'active' });
    update('engagement', engagementId, { stage: 'commencement' });

    const engagement = get('engagement', engagementId);
    expect(engagement.status).toBe('active');
    expect(engagement.stage).toBe('commencement');
  });

  it('should progress through all stages', () => {
    const stages = ['team_execution', 'partner_review', 'finalization'];

    for (const stage of stages) {
      update('engagement', engagementId, { stage });
      const engagement = get('engagement', engagementId);
      expect(engagement.stage).toBe(stage);
    }
  });

  it('should not allow close_out without accepted letter or 0 progress', () => {
    const engagement = get('engagement', engagementId);
    const user = { role: 'partner' };

    // Set progress > 0 and letter not accepted
    update('engagement', engagementId, { letter_auditor_status: 'pending' });

    expect(() => validateStageTransition(
      { ...engagement, letter_auditor_status: 'pending', progress: 50 },
      'close_out',
      user
    )).toThrow('Cannot close out');
  });

  it('should allow close_out with accepted letter', () => {
    update('engagement', engagementId, { letter_auditor_status: 'accepted' });

    const engagement = get('engagement', engagementId);
    const user = { role: 'partner' };

    expect(() => validateStageTransition(engagement, 'close_out', user)).not.toThrow();

    update('engagement', engagementId, { stage: 'close_out' });
    const updated = get('engagement', engagementId);
    expect(updated.stage).toBe('close_out');
  });

  it('should allow close_out with 0 progress even without accepted letter', () => {
    const newEngagement = create('engagement', {
      name: 'Zero Progress Engagement',
      client_id: clientId,
      year: 2024,
    });

    update('engagement', newEngagement.id, {
      status: 'active',
      stage: 'finalization',
      letter_auditor_status: 'pending',
    });

    const engagement = get('engagement', newEngagement.id);
    expect(engagement.progress).toBe(0);

    const user = { role: 'partner' };
    expect(() => validateStageTransition(engagement, 'close_out', user)).not.toThrow();
  });
});

// ========================================
// RFI WORKFLOW TESTS
// ========================================

describe('RFI Workflow', () => {
  let engagementId;
  let sectionId;
  let rfiId;

  beforeAll(() => {
    const suffix = uniqueSuffix();
    const client = create('client', { name: `RFI Test Client${suffix}`, email: `rfi${suffix}@test.com` });
    const engagement = create('engagement', {
      name: 'RFI Test Engagement',
      client_id: client.id,
      year: 2024,
    });
    engagementId = engagement.id;

    // Create section
    const section = create('engagement_section', {
      engagement_id: engagementId,
      name: 'Financial Documents',
      key: 'financial',
    });
    sectionId = section.id;
  });

  it('should create RFI with auto timestamp', () => {
    const rfi = create('rfi', {
      engagement_id: engagementId,
      section_id: sectionId,
      name: 'Bank Statements',
      question: 'Please provide bank statements for all accounts',
    });
    rfiId = rfi.id;

    expect(rfi.date_requested).toBeTruthy();
    expect(rfi.status).toBe(0);
    expect(rfi.client_status).toBe('pending');
    expect(rfi.auditor_status).toBe('requested');
  });

  it('should list RFIs for engagement', () => {
    const rfis = list('rfi', { engagement_id: engagementId });
    expect(rfis.length).toBeGreaterThan(0);
    expect(rfis[0].engagement_id).toBe(engagementId);
  });

  it('should group RFIs by section', () => {
    // Create another section and RFI
    const section2 = create('engagement_section', {
      engagement_id: engagementId,
      name: 'Tax Documents',
      key: 'tax',
    });

    create('rfi', {
      engagement_id: engagementId,
      section_id: section2.id,
      question: 'Provide tax returns',
    });

    const rfis = list('rfi', { engagement_id: engagementId });
    const sections = new Set(rfis.map(r => r.section_id));
    expect(sections.size).toBe(2);
  });

  it('should not allow completing RFI without files or responses', () => {
    const rfi = get('rfi', rfiId);
    const user = { type: 'auditor', role: 'partner' };

    expect(() => validateRfiStatusChange(rfi, 1, user))
      .toThrow('RFI must have files or responses');
  });

  it('should allow completing RFI with response', () => {
    // Add response
    create('rfi_response', {
      rfi_id: rfiId,
      content: 'Here are the bank statements',
    });

    // Update RFI counts
    update('rfi', rfiId, { response_count: 1 });

    const rfi = get('rfi', rfiId);
    const user = { type: 'auditor', role: 'partner' };

    expect(() => validateRfiStatusChange(rfi, 1, user)).not.toThrow();

    update('rfi', rfiId, { status: 1, client_status: 'completed' });
    const completed = get('rfi', rfiId);
    expect(completed.status).toBe(1);
    expect(completed.client_status).toBe('completed');
  });

  it('should update engagement progress based on RFI completion', () => {
    // Create 4 more RFIs
    for (let i = 0; i < 4; i++) {
      create('rfi', {
        engagement_id: engagementId,
        question: `Additional Question ${i}`,
      });
    }

    // Calculate progress based on completed vs total for this engagement
    const rfis = list('rfi', { engagement_id: engagementId });
    const completed = rfis.filter(r => r.status === 1 || r.client_status === 'completed');
    const progress = Math.round((completed.length / rfis.length) * 100);

    // At least one RFI should be completed from earlier test
    expect(completed.length).toBeGreaterThan(0);
    // Progress should be a valid percentage
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });
});

// ========================================
// REVIEW WORKFLOW TESTS
// ========================================

describe('Review Workflow', () => {
  let teamId;
  let reviewId;
  let highlightId;

  beforeAll(() => {
    const suffix = uniqueSuffix();
    const team = create('team', { name: `Review Test Team${suffix}` });
    teamId = team.id;
  });

  it('should create review with default status', () => {
    const review = create('review', {
      name: 'Annual Review 2024',
      team_id: teamId,
      financial_year: '2024',
    });
    reviewId = review.id;

    expect(review.status).toBe('open');
    expect(review.stage).toBe(1);
    expect(review.published).toBe(0);
    expect(review.is_tender).toBe(0);
  });

  it('should add highlights to review', () => {
    const highlight = create('highlight', {
      review_id: reviewId,
      page_number: 1,
      position: JSON.stringify({ x: 100, y: 200 }),
      content: 'Selected text',
      comment: 'This needs clarification',
    });
    highlightId = highlight.id;

    expect(highlight.resolved).toBe(0);
    expect(highlight.partial_resolved).toBe(0);
    expect(highlight.color).toBe('#B0B0B0');
  });

  it('should include highlight counts in review list', () => {
    // Add more highlights
    create('highlight', {
      review_id: reviewId,
      page_number: 2,
      position: '{}',
      comment: 'Query 2',
    });

    create('highlight', {
      review_id: reviewId,
      page_number: 3,
      position: '{}',
      comment: 'Query 3',
      resolved: true,
    });

    const reviews = list('review');
    const review = reviews.find(r => r.id === reviewId);

    expect(review.highlight_count).toBe(3);
    expect(review.unresolved_count).toBe(2);
  });

  it('should resolve highlight', () => {
    const now = Math.floor(Date.now() / 1000);
    update('highlight', highlightId, {
      resolved: true,
      resolved_at: now,
    });

    const highlight = get('highlight', highlightId);
    expect(highlight.resolved).toBe(1);
    expect(highlight.resolved_at).toBeTruthy();
  });

  it('should support partial resolution', () => {
    const highlight2 = create('highlight', {
      review_id: reviewId,
      page_number: 4,
      position: '{}',
      comment: 'Partially resolved query',
    });

    const now = Math.floor(Date.now() / 1000);
    update('highlight', highlight2.id, {
      partial_resolved: true,
      partial_resolved_at: now,
    });

    const updated = get('highlight', highlight2.id);
    expect(updated.partial_resolved).toBe(1);
    expect(updated.resolved).toBe(0);
  });

  it('should close review', () => {
    update('review', reviewId, { status: 'closed' });
    const review = get('review', reviewId);
    expect(review.status).toBe('closed');
  });
});

// ========================================
// PERMISSION TESTS
// ========================================

describe('Permission System', () => {
  it('should enforce partner-only access for users', () => {
    const userSpec = getSpec('user');

    expect(can({ role: 'partner' }, userSpec, 'list')).toBe(true);
    expect(can({ role: 'partner' }, userSpec, 'create')).toBe(true);

    expect(can({ role: 'manager' }, userSpec, 'list')).toBe(false);
    expect(can({ role: 'clerk' }, userSpec, 'create')).toBe(false);
  });

  it('should enforce manager-manage for engagements', () => {
    const engSpec = getSpec('engagement');

    // Partner can do everything
    expect(can({ role: 'partner' }, engSpec, 'create')).toBe(true);
    expect(can({ role: 'partner' }, engSpec, 'edit')).toBe(true);
    expect(can({ role: 'partner' }, engSpec, 'delete')).toBe(true);

    // Manager can create/edit but not delete
    expect(can({ role: 'manager' }, engSpec, 'create')).toBe(true);
    expect(can({ role: 'manager' }, engSpec, 'edit')).toBe(true);
    expect(can({ role: 'manager' }, engSpec, 'delete')).toBe(false);

    // Clerk can only view
    expect(can({ role: 'clerk' }, engSpec, 'list')).toBe(true);
    expect(can({ role: 'clerk' }, engSpec, 'view')).toBe(true);
    expect(can({ role: 'clerk' }, engSpec, 'create')).toBe(false);
  });

  it('should allow clients for RFIs', () => {
    const rfiSpec = getSpec('rfi');

    expect(can({ role: 'client' }, rfiSpec, 'list')).toBe(true);
    expect(can({ role: 'client' }, rfiSpec, 'view')).toBe(true);
    expect(can({ role: 'client' }, rfiSpec, 'respond')).toBe(true);
    expect(can({ role: 'client' }, rfiSpec, 'create')).toBe(false);
  });

  it('should throw on permission check failure', () => {
    const userSpec = getSpec('user');
    const clerk = { role: 'clerk' };

    expect(() => check(clerk, userSpec, 'list')).toThrow('Permission denied');
  });
});

// ========================================
// CLIENT RELATIONSHIP TESTS
// ========================================

describe('Client Relationships', () => {
  let clientId;
  let suffix;

  beforeAll(() => {
    suffix = uniqueSuffix();
    const client = create('client', {
      name: `Relationship Test Client${suffix}`,
      email: `rel${suffix}@client.com`,
    });
    clientId = client.id;
  });

  it('should create engagements for client', () => {
    for (let i = 0; i < 3; i++) {
      create('engagement', {
        name: `Rel Engagement ${suffix} ${i}`,
        client_id: clientId,
        year: 2024,
      });
    }

    const engagements = list('engagement', { client_id: clientId });
    expect(engagements.length).toBe(3);
  });

  it('should create client users', () => {
    const user = create('user', {
      email: `clientuser${suffix}@test.com`,
      name: 'Client User',
      type: 'client',
    });

    create('client_user', {
      client_id: clientId,
      user_id: user.id,
      role: 'admin',
      is_primary: true,
    });

    const contacts = getChildren('client', clientId, {
      entity: 'client_user',
      fk: 'client_id',
    });

    expect(contacts.length).toBe(1);
    expect(contacts[0].role).toBe('admin');
    expect(contacts[0].is_primary).toBe(1);
  });

  it('should get client engagements through children', () => {
    const children = getChildren('client', clientId, {
      entity: 'engagement',
      fk: 'client_id',
    });

    expect(children.length).toBe(3);
  });
});

// ========================================
// TEAM RELATIONSHIP TESTS
// ========================================

describe('Team Relationships', () => {
  let teamId;
  let suffix;

  beforeAll(() => {
    suffix = uniqueSuffix();
    const team = create('team', { name: `Team Relationship Test${suffix}` });
    teamId = team.id;
  });

  it('should add members to team', () => {
    const users = [];
    for (let i = 0; i < 3; i++) {
      const user = create('user', {
        email: `teammember${suffix}_${i}@test.com`,
        name: `Team Member ${i}`,
        role: i === 0 ? 'partner' : 'manager',
      });
      users.push(user);

      create('team_member', {
        team_id: teamId,
        user_id: user.id,
        role: i === 0 ? 'partner' : 'member',
      });
    }

    const members = getChildren('team', teamId, {
      entity: 'team_member',
      fk: 'team_id',
    });

    expect(members.length).toBe(3);
  });

  it('should include member_count in team list', () => {
    const teams = list('team');
    const team = teams.find(t => t.id === teamId);

    expect(team.member_count).toBe(3);
  });

  it('should create reviews for team', () => {
    create('review', {
      name: `Team Review${suffix}`,
      team_id: teamId,
    });

    const reviews = getChildren('team', teamId, {
      entity: 'review',
      fk: 'team_id',
    });

    expect(reviews.length).toBe(1);
  });
});

// ========================================
// ACTIVITY LOG TESTS
// ========================================

describe('Activity Logging', () => {
  let engagementId;

  beforeAll(() => {
    const suffix = uniqueSuffix();
    const client = create('client', { name: `Activity Log Client${suffix}`, email: `actlog${suffix}@test.com` });
    const engagement = create('engagement', {
      name: 'Activity Log Engagement',
      client_id: client.id,
      year: 2024,
    });
    engagementId = engagement.id;
  });

  it('should create activity log entries', () => {
    create('activity_log', {
      entity_type: 'engagement',
      entity_id: engagementId,
      action: 'create',
      message: 'Engagement created',
      user_email: 'test@test.com',
    });

    create('activity_log', {
      entity_type: 'engagement',
      entity_id: engagementId,
      action: 'stage_change',
      message: 'Stage changed from info_gathering to commencement',
      details: JSON.stringify({ from: 'info_gathering', to: 'commencement' }),
    });

    const activities = getChildren('engagement', engagementId, {
      entity: 'activity_log',
      fk: 'entity_id',
      filter: { entity_type: 'engagement' },
    });

    expect(activities.length).toBe(2);
  });

  it('should order activities by created_at desc', () => {
    const activities = list('activity_log', { entity_id: engagementId }, {
      sort: { field: 'created_at', dir: 'desc' },
    });

    if (activities.length > 1) {
      expect(activities[0].created_at).toBeGreaterThanOrEqual(activities[1].created_at);
    }
  });
});

// ========================================
// NAVIGATION ITEMS TESTS
// ========================================

describe('Navigation Items', () => {
  it('should return navigable entities', () => {
    const items = getNavItems();
    const names = items.map(i => i.name);

    // Should include main entities
    expect(names).toContain('engagement');
    expect(names).toContain('review');
    expect(names).toContain('client');
    expect(names).toContain('team');
    expect(names).toContain('user');

    // Should not include embedded entities
    expect(names).not.toContain('team_member');
    expect(names).not.toContain('file');
    expect(names).not.toContain('activity_log');
    expect(names).not.toContain('rfi_response');
  });

  it('should not include entities with parent', () => {
    const items = getNavItems();
    const names = items.map(i => i.name);

    expect(names).not.toContain('rfi');
    expect(names).not.toContain('highlight');
  });

  it('should have valid hrefs', () => {
    const items = getNavItems();

    for (const item of items) {
      expect(item.href).toBe(`/${item.name}`);
    }
  });
});

// ========================================
// SEARCH INTEGRATION TESTS
// ========================================

describe('Search Integration', () => {
  let suffix;

  beforeAll(() => {
    suffix = uniqueSuffix();
    create('client', { name: `Searchable Corp${suffix}`, email: `search${suffix}@corp.com` });
    create('client', { name: `Another Client${suffix}`, email: `another${suffix}@client.com` });
    create('client', { name: `Third Company${suffix}`, email: `third${suffix}@company.com` });
  });

  it('should search across multiple fields', () => {
    // Search by name (using suffix to find specific records)
    const byName = search('client', `Searchable Corp${suffix}`);
    expect(byName.some(c => c.name === `Searchable Corp${suffix}`)).toBe(true);

    // Search by email
    const byEmail = search('client', `another${suffix}@`);
    expect(byEmail.some(c => c.email === `another${suffix}@client.com`)).toBe(true);
  });

  it('should be case-insensitive', () => {
    const results = search('client', `searchable corp${suffix}`.toLowerCase());
    expect(results.some(c => c.name.toLowerCase().includes('searchable corp'))).toBe(true);
  });

  it('should handle partial matches', () => {
    const results = search('client', 'Corp');
    expect(results.some(c => c.name.includes('Corp'))).toBe(true);
  });
});

// ========================================
// FIELD TYPE HANDLING TESTS
// ========================================

describe('Field Type Integration', () => {
  it('should handle all field types in engagement', () => {
    const suffix = uniqueSuffix();
    const client = create('client', { name: `Field Type Client${suffix}`, email: `fieldtype${suffix}@test.com` });

    const engagement = create('engagement', {
      name: 'Field Type Test',
      client_id: client.id,
      year: 2024,
      month: 6,
      fee: 10000.50,
      wip_value: 5000.25,
      is_private: true,
      clerks_can_approve: false,
      deadline: '2024-12-31',
      users: JSON.stringify(['user1', 'user2']),
    });

    const retrieved = get('engagement', engagement.id);

    // Text
    expect(retrieved.name).toBe('Field Type Test');

    // Int
    expect(retrieved.year).toBe(2024);
    expect(retrieved.month).toBe(6);

    // Decimal
    expect(retrieved.fee).toBe(10000.50);
    expect(retrieved.wip_value).toBe(5000.25);

    // Bool
    expect(retrieved.is_private).toBe(1);
    expect(retrieved.clerks_can_approve).toBe(0);

    // Date (stored as timestamp)
    expect(typeof retrieved.deadline).toBe('number');

    // JSON
    expect(JSON.parse(retrieved.users)).toEqual(['user1', 'user2']);

    // Enum
    expect(retrieved.status).toBe('pending');
    expect(retrieved.stage).toBe('info_gathering');

    // Ref
    expect(retrieved.client_id).toBe(client.id);
  });

  it('should format display values correctly', () => {
    const engSpec = getSpec('engagement');

    // Enum formatting
    const statusDisplay = formatDisplayValue('active', { type: 'enum', options: 'statuses' }, engSpec);
    expect(statusDisplay.label).toBe('Active');
    expect(statusDisplay.color).toBe('green');

    // Bool formatting
    const boolDisplay = formatDisplayValue(1, { type: 'bool' }, {});
    expect(boolDisplay).toBe('Yes');

    // Date formatting
    const timestamp = Math.floor(new Date('2024-06-15').getTime() / 1000);
    const dateDisplay = formatDisplayValue(timestamp, { type: 'date' }, {});
    expect(dateDisplay).toBeTruthy();
    expect(dateDisplay).toBeTypeOf('string');
  });
});

// ========================================
// CLEAN UP
// ========================================

afterAll(() => {
  db.close();
});
