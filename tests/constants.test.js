/**
 * Tests for src/specs/constants.js
 * Tests status constants, field definitions, access patterns, and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  STATUS,
  WORKFLOW_STATUS,
  ENGAGEMENT_STAGES,
  STAGE_WORKFLOW,
  REPEAT_INTERVALS,
  FIELDS,
  timestampFields,
  auditFields,
  resolutionFields,
  partialResolutionFields,
  ACCESS,
  HIGHLIGHT_COLORS,
  USER_TYPES,
  USER_ROLES,
  CLIENT_USER_ROLES,
  TEAM_MEMBER_ROLES,
  AUTH_PROVIDERS,
  NOTIFICATION_TYPES,
  ACTIVITY_ACTIONS,
  LOG_LEVELS,
  ENGAGEMENT_TYPES,
  ENTITY_TYPES,
  TEMPLATE_TYPES,
  TEMPLATE_TARGET_TYPES,
  FLAG_TYPES,
  HIGHLIGHT_TYPES,
  COLLABORATOR_TYPES,
  MESSAGE_SOURCES,
  CLIENT_NOTIFICATION_TYPES,
  RFI_STATUSES,
  SEED_DATA,
  withStandardChildren,
  action,
  actions,
  embeddedSpec,
  configSpec,
} from '../src/specs/constants.js';

// ========================================
// STATUS CONSTANTS TESTS
// ========================================

describe('STATUS constants', () => {
  describe('ACTIVE_INACTIVE', () => {
    it('should have active and inactive options', () => {
      expect(STATUS.ACTIVE_INACTIVE).toHaveLength(2);
      expect(STATUS.ACTIVE_INACTIVE.find(s => s.value === 'active')).toBeTruthy();
      expect(STATUS.ACTIVE_INACTIVE.find(s => s.value === 'inactive')).toBeTruthy();
    });

    it('should have correct colors', () => {
      expect(STATUS.ACTIVE_INACTIVE.find(s => s.value === 'active').color).toBe('green');
      expect(STATUS.ACTIVE_INACTIVE.find(s => s.value === 'inactive').color).toBe('gray');
    });
  });

  describe('PENDING_ACTIVE', () => {
    it('should have all engagement states', () => {
      const values = STATUS.PENDING_ACTIVE.map(s => s.value);
      expect(values).toContain('pending');
      expect(values).toContain('active');
      expect(values).toContain('completed');
      expect(values).toContain('archived');
    });
  });

  describe('OPEN_CLOSED', () => {
    it('should have open and closed options', () => {
      expect(STATUS.OPEN_CLOSED).toHaveLength(2);
      expect(STATUS.OPEN_CLOSED.find(s => s.value === 'open').color).toBe('green');
    });
  });

  describe('PROGRESS', () => {
    it('should have pending, in_progress, completed', () => {
      const values = STATUS.PROGRESS.map(s => s.value);
      expect(values).toEqual(['pending', 'in_progress', 'completed']);
    });
  });

  describe('NOTIFICATION', () => {
    it('should have pending, sent, failed', () => {
      const values = STATUS.NOTIFICATION.map(s => s.value);
      expect(values).toContain('pending');
      expect(values).toContain('sent');
      expect(values).toContain('failed');
    });
  });

  describe('RECREATION', () => {
    it('should have recreation workflow states', () => {
      const values = STATUS.RECREATION.map(s => s.value);
      expect(values).toContain('pending');
      expect(values).toContain('processing');
      expect(values).toContain('completed');
      expect(values).toContain('failed');
    });
  });
});

// ========================================
// WORKFLOW STATUS TESTS
// ========================================

describe('WORKFLOW_STATUS constants', () => {
  describe('CLIENT status', () => {
    it('should have pending, partially_sent, sent', () => {
      const values = WORKFLOW_STATUS.CLIENT.map(s => s.value);
      expect(values).toEqual(['pending', 'partially_sent', 'sent']);
    });
  });

  describe('AUDITOR status', () => {
    it('should have requested, reviewing, queries, received', () => {
      const values = WORKFLOW_STATUS.AUDITOR.map(s => s.value);
      expect(values).toEqual(['requested', 'reviewing', 'queries', 'received']);
    });
  });

  describe('LETTER_CLIENT status', () => {
    it('should have pending and sent', () => {
      expect(WORKFLOW_STATUS.LETTER_CLIENT).toHaveLength(2);
    });
  });

  describe('LETTER_AUDITOR status', () => {
    it('should have pending, queries, accepted', () => {
      const values = WORKFLOW_STATUS.LETTER_AUDITOR.map(s => s.value);
      expect(values).toContain('accepted');
    });
  });

  describe('RFI_CLIENT status', () => {
    it('should have full RFI workflow', () => {
      const values = WORKFLOW_STATUS.RFI_CLIENT.map(s => s.value);
      expect(values).toEqual(['pending', 'sent', 'responded', 'completed']);
    });
  });
});

// ========================================
// ENGAGEMENT STAGES TESTS
// ========================================

describe('ENGAGEMENT_STAGES', () => {
  it('should have 6 stages in correct order', () => {
    expect(ENGAGEMENT_STAGES).toHaveLength(6);
    const values = ENGAGEMENT_STAGES.map(s => s.value);
    expect(values).toEqual([
      'info_gathering',
      'commencement',
      'team_execution',
      'partner_review',
      'finalization',
      'close_out',
    ]);
  });

  it('should have labels for all stages', () => {
    for (const stage of ENGAGEMENT_STAGES) {
      expect(stage.label).toBeTruthy();
      expect(stage.label).toBeTypeOf('string');
    }
  });
});

describe('STAGE_WORKFLOW', () => {
  it('should define transitions for all stages', () => {
    expect(STAGE_WORKFLOW.info_gathering).toBeDefined();
    expect(STAGE_WORKFLOW.commencement).toBeDefined();
    expect(STAGE_WORKFLOW.team_execution).toBeDefined();
    expect(STAGE_WORKFLOW.partner_review).toBeDefined();
    expect(STAGE_WORKFLOW.finalization).toBeDefined();
    expect(STAGE_WORKFLOW.close_out).toBeDefined();
  });

  it('should have correct next stage transitions', () => {
    expect(STAGE_WORKFLOW.info_gathering.next).toBe('commencement');
    expect(STAGE_WORKFLOW.commencement.next).toBe('team_execution');
    expect(STAGE_WORKFLOW.team_execution.next).toBe('partner_review');
    expect(STAGE_WORKFLOW.partner_review.next).toBe('finalization');
    expect(STAGE_WORKFLOW.finalization.next).toBe('close_out');
  });

  it('should define allowed_roles for all stages', () => {
    for (const [stageName, stage] of Object.entries(STAGE_WORKFLOW)) {
      expect(stage.allowed_roles).toBeDefined();
      expect(Array.isArray(stage.allowed_roles)).toBe(true);
    }
  });

  it('should only allow partners for close_out', () => {
    expect(STAGE_WORKFLOW.close_out.allowed_roles).toEqual(['partner']);
  });

  it('should have auto_transition for info_gathering', () => {
    expect(STAGE_WORKFLOW.info_gathering.auto_transition).toBe('commencement_date');
  });

  it('should have requirements for close_out', () => {
    expect(STAGE_WORKFLOW.close_out.requires).toBeDefined();
    expect(STAGE_WORKFLOW.close_out.requires).toContain('letter_auditor_status=accepted');
  });
});

// ========================================
// REPEAT INTERVALS TESTS
// ========================================

describe('REPEAT_INTERVALS', () => {
  it('should have once, monthly, yearly options', () => {
    const values = REPEAT_INTERVALS.map(i => i.value);
    expect(values).toEqual(['once', 'monthly', 'yearly']);
  });
});

// ========================================
// FIELDS CONSTANTS TESTS
// ========================================

describe('FIELDS', () => {
  describe('id field', () => {
    it('should have type id', () => {
      expect(FIELDS.id.type).toBe('id');
    });
  });

  describe('timestamps', () => {
    it('should have created_at with auto now', () => {
      expect(FIELDS.created_at.type).toBe('timestamp');
      expect(FIELDS.created_at.auto).toBe('now');
      expect(FIELDS.created_at.readOnly).toBe(true);
    });

    it('should have updated_at with auto update', () => {
      expect(FIELDS.updated_at.type).toBe('timestamp');
      expect(FIELDS.updated_at.auto).toBe('update');
      expect(FIELDS.updated_at.readOnly).toBe(true);
    });
  });

  describe('created_by factory', () => {
    it('should create ref to user with auto user', () => {
      const field = FIELDS.created_by();
      expect(field.type).toBe('ref');
      expect(field.ref).toBe('user');
      expect(field.auto).toBe('user');
      expect(field.readOnly).toBe(true);
    });

    it('should accept custom options', () => {
      const field = FIELDS.created_by({ label: 'Author' });
      expect(field.label).toBe('Author');
    });
  });

  describe('entity reference fields', () => {
    it('should have entity_type as required hidden text', () => {
      expect(FIELDS.entity_type.type).toBe('text');
      expect(FIELDS.entity_type.required).toBe(true);
      expect(FIELDS.entity_type.hidden).toBe(true);
    });

    it('should have entity_id as required hidden text', () => {
      expect(FIELDS.entity_id.type).toBe('text');
      expect(FIELDS.entity_id.required).toBe(true);
      expect(FIELDS.entity_id.hidden).toBe(true);
    });
  });

  describe('status factory', () => {
    it('should create enum field with defaults', () => {
      const field = FIELDS.status();
      expect(field.type).toBe('enum');
      expect(field.label).toBe('Status');
      expect(field.list).toBe(true);
      expect(field.default).toBe('active');
    });

    it('should accept custom options and default', () => {
      const field = FIELDS.status('custom_statuses', 'pending');
      expect(field.options).toBe('custom_statuses');
      expect(field.default).toBe('pending');
    });
  });

  describe('name factory', () => {
    it('should create text field with search and sort', () => {
      const field = FIELDS.name();
      expect(field.type).toBe('text');
      expect(field.required).toBe(true);
      expect(field.list).toBe(true);
      expect(field.sortable).toBe(true);
      expect(field.search).toBe(true);
    });

    it('should accept custom options', () => {
      const field = FIELDS.name({ label: 'Title' });
      expect(field.label).toBe('Title');
    });
  });

  describe('email factory', () => {
    it('should create email field', () => {
      const field = FIELDS.email();
      expect(field.type).toBe('email');
      expect(field.list).toBe(true);
      expect(field.search).toBe(true);
    });
  });

  describe('resolution fields', () => {
    it('should have resolved bool field', () => {
      expect(FIELDS.resolved.type).toBe('bool');
      expect(FIELDS.resolved.default).toBe(false);
    });

    it('should have resolved_by ref to user', () => {
      expect(FIELDS.resolved_by.type).toBe('ref');
      expect(FIELDS.resolved_by.ref).toBe('user');
    });
  });

  describe('sort_order field', () => {
    it('should be hidden int with default 0', () => {
      expect(FIELDS.sort_order.type).toBe('int');
      expect(FIELDS.sort_order.default).toBe(0);
      expect(FIELDS.sort_order.hidden).toBe(true);
    });
  });
});

// ========================================
// FIELD BUNDLE HELPERS TESTS
// ========================================

describe('field bundle helpers', () => {
  describe('timestampFields', () => {
    it('should return created_at and updated_at', () => {
      const fields = timestampFields();
      expect(fields.created_at).toBeDefined();
      expect(fields.updated_at).toBeDefined();
    });
  });

  describe('auditFields', () => {
    it('should return created_by and timestamps', () => {
      const fields = auditFields();
      expect(fields.created_by).toBeDefined();
      expect(fields.created_at).toBeDefined();
      expect(fields.updated_at).toBeDefined();
    });
  });

  describe('resolutionFields', () => {
    it('should return resolved, resolved_by, resolved_at', () => {
      const fields = resolutionFields();
      expect(fields.resolved).toBeDefined();
      expect(fields.resolved_by).toBeDefined();
      expect(fields.resolved_at).toBeDefined();
    });
  });

  describe('partialResolutionFields', () => {
    it('should return partial resolution fields', () => {
      const fields = partialResolutionFields();
      expect(fields.partial_resolved).toBeDefined();
      expect(fields.partial_resolved_by).toBeDefined();
      expect(fields.partial_resolved_at).toBeDefined();
    });
  });
});

// ========================================
// ACCESS PATTERNS TESTS
// ========================================

describe('ACCESS patterns', () => {
  describe('PARTNER_ONLY', () => {
    it('should only allow partners for all actions', () => {
      expect(ACCESS.PARTNER_ONLY.list).toEqual(['partner']);
      expect(ACCESS.PARTNER_ONLY.view).toEqual(['partner']);
      expect(ACCESS.PARTNER_ONLY.create).toEqual(['partner']);
      expect(ACCESS.PARTNER_ONLY.edit).toEqual(['partner']);
      expect(ACCESS.PARTNER_ONLY.delete).toEqual(['partner']);
    });
  });

  describe('PARTNER_MANAGE', () => {
    it('should allow all roles to list/view', () => {
      expect(ACCESS.PARTNER_MANAGE.list).toContain('partner');
      expect(ACCESS.PARTNER_MANAGE.list).toContain('manager');
      expect(ACCESS.PARTNER_MANAGE.list).toContain('clerk');
    });

    it('should only allow partners for create/edit/delete', () => {
      expect(ACCESS.PARTNER_MANAGE.create).toEqual(['partner']);
      expect(ACCESS.PARTNER_MANAGE.edit).toEqual(['partner']);
      expect(ACCESS.PARTNER_MANAGE.delete).toEqual(['partner']);
    });
  });

  describe('MANAGER_MANAGE', () => {
    it('should allow partners and managers to create/edit', () => {
      expect(ACCESS.MANAGER_MANAGE.create).toContain('partner');
      expect(ACCESS.MANAGER_MANAGE.create).toContain('manager');
      expect(ACCESS.MANAGER_MANAGE.edit).toContain('partner');
      expect(ACCESS.MANAGER_MANAGE.edit).toContain('manager');
    });

    it('should only allow partners to delete', () => {
      expect(ACCESS.MANAGER_MANAGE.delete).toEqual(['partner']);
    });
  });

  describe('WITH_CLIENT', () => {
    it('should include client role for list/view/create', () => {
      expect(ACCESS.WITH_CLIENT.list).toContain('client');
      expect(ACCESS.WITH_CLIENT.view).toContain('client');
      expect(ACCESS.WITH_CLIENT.create).toContain('client');
    });

    it('should not allow clients to delete', () => {
      expect(ACCESS.WITH_CLIENT.delete).not.toContain('client');
    });
  });

  describe('READ_ONLY', () => {
    it('should only have list and view permissions', () => {
      expect(ACCESS.READ_ONLY.list).toBeDefined();
      expect(ACCESS.READ_ONLY.view).toBeDefined();
      expect(ACCESS.READ_ONLY.create).toBeUndefined();
      expect(ACCESS.READ_ONLY.edit).toBeUndefined();
      expect(ACCESS.READ_ONLY.delete).toBeUndefined();
    });
  });
});

// ========================================
// HIGHLIGHT COLORS TESTS
// ========================================

describe('HIGHLIGHT_COLORS', () => {
  it('should have all required colors', () => {
    expect(HIGHLIGHT_COLORS.default).toBe('#B0B0B0');
    expect(HIGHLIGHT_COLORS.scrolledTo).toBe('#7F7EFF');
    expect(HIGHLIGHT_COLORS.partner).toBe('#ff4141');
    expect(HIGHLIGHT_COLORS.resolved).toBe('#44BBA4');
  });
});

// ========================================
// ROLE DEFINITIONS TESTS
// ========================================

describe('role definitions', () => {
  describe('USER_TYPES', () => {
    it('should have auditor and client types', () => {
      const values = USER_TYPES.map(t => t.value);
      expect(values).toContain('auditor');
      expect(values).toContain('client');
    });
  });

  describe('USER_ROLES', () => {
    it('should have partner, manager, clerk roles', () => {
      const values = USER_ROLES.map(r => r.value);
      expect(values).toEqual(['partner', 'manager', 'clerk']);
    });
  });

  describe('CLIENT_USER_ROLES', () => {
    it('should have admin and user roles', () => {
      const values = CLIENT_USER_ROLES.map(r => r.value);
      expect(values).toEqual(['admin', 'user']);
    });
  });

  describe('TEAM_MEMBER_ROLES', () => {
    it('should have partner and member roles', () => {
      const values = TEAM_MEMBER_ROLES.map(r => r.value);
      expect(values).toEqual(['partner', 'member']);
    });
  });

  describe('AUTH_PROVIDERS', () => {
    it('should have google and email options', () => {
      const values = AUTH_PROVIDERS.map(p => p.value);
      expect(values).toContain('google');
      expect(values).toContain('email');
    });
  });
});

// ========================================
// OTHER ENUM CONSTANTS TESTS
// ========================================

describe('other enum constants', () => {
  describe('NOTIFICATION_TYPES', () => {
    it('should have all notification types', () => {
      const values = NOTIFICATION_TYPES.map(t => t.value);
      expect(values).toContain('review_created');
      expect(values).toContain('rfi_deadline');
      expect(values).toContain('engagement_stage');
      expect(values).toContain('weekly_summary');
    });
  });

  describe('ACTIVITY_ACTIONS', () => {
    it('should have all activity actions', () => {
      const values = ACTIVITY_ACTIONS.map(a => a.value);
      expect(values).toContain('create');
      expect(values).toContain('update');
      expect(values).toContain('delete');
      expect(values).toContain('status_change');
      expect(values).toContain('stage_change');
    });
  });

  describe('LOG_LEVELS', () => {
    it('should have info, warning, error levels', () => {
      const values = LOG_LEVELS.map(l => l.value);
      expect(values).toEqual(['info', 'warning', 'error']);
    });
  });

  describe('ENGAGEMENT_TYPES', () => {
    it('should have audit, review, compilation, agreed_upon', () => {
      const values = ENGAGEMENT_TYPES.map(t => t.value);
      expect(values).toContain('audit');
      expect(values).toContain('review');
      expect(values).toContain('compilation');
      expect(values).toContain('agreed_upon');
    });
  });

  describe('ENTITY_TYPES', () => {
    it('should have common business entity types', () => {
      const values = ENTITY_TYPES.map(t => t.value);
      expect(values).toContain('company');
      expect(values).toContain('trust');
      expect(values).toContain('individual');
    });
  });

  describe('TEMPLATE_TYPES', () => {
    it('should have standard, tender, friday types', () => {
      const values = TEMPLATE_TYPES.map(t => t.value);
      expect(values).toEqual(['standard', 'tender', 'friday']);
    });
  });

  describe('FLAG_TYPES', () => {
    it('should have review, tender, rfi types', () => {
      const values = FLAG_TYPES.map(t => t.value);
      expect(values).toEqual(['review', 'tender', 'rfi']);
    });
  });

  describe('HIGHLIGHT_TYPES', () => {
    it('should have text and area types', () => {
      const values = HIGHLIGHT_TYPES.map(t => t.value);
      expect(values).toEqual(['text', 'area']);
    });
  });

  describe('COLLABORATOR_TYPES', () => {
    it('should have permanent and temporary types', () => {
      const values = COLLABORATOR_TYPES.map(t => t.value);
      expect(values).toEqual(['permanent', 'temporary']);
    });
  });

  describe('MESSAGE_SOURCES', () => {
    it('should have local, friday, review sources', () => {
      const values = MESSAGE_SOURCES.map(s => s.value);
      expect(values).toEqual(['local', 'friday', 'review']);
    });
  });

  describe('RFI_STATUSES', () => {
    it('should have pending, active, inactive statuses', () => {
      const values = RFI_STATUSES.map(s => s.value);
      expect(values).toEqual(['pending', 'active', 'inactive']);
    });
  });
});

// ========================================
// SEED DATA TESTS
// ========================================

describe('SEED_DATA', () => {
  describe('entity_types', () => {
    it('should have predefined entity types with descriptions', () => {
      expect(SEED_DATA.entity_types.length).toBeGreaterThan(0);
      for (const type of SEED_DATA.entity_types) {
        expect(type.name).toBeTruthy();
        expect(type.description).toBeTruthy();
      }
    });
  });

  describe('engagement_types', () => {
    it('should have predefined engagement types with keys', () => {
      expect(SEED_DATA.engagement_types.length).toBeGreaterThan(0);
      for (const type of SEED_DATA.engagement_types) {
        expect(type.key).toBeTruthy();
        expect(type.name).toBeTruthy();
      }
    });
  });

  describe('permissions', () => {
    it('should have predefined permissions with role access', () => {
      expect(SEED_DATA.permissions.length).toBeGreaterThan(0);
      for (const perm of SEED_DATA.permissions) {
        expect(perm.key).toBeTruthy();
        expect(perm.name).toBeTruthy();
        expect(perm.roles).toBeDefined();
      }
    });
  });
});

// ========================================
// HELPER FUNCTIONS TESTS
// ========================================

describe('withStandardChildren', () => {
  it('should include files, activity, chat children', () => {
    const children = withStandardChildren('engagement');
    expect(children.files).toBeDefined();
    expect(children.files.entity).toBe('file');
    expect(children.files.filter.entity_type).toBe('engagement');
    expect(children.activity).toBeDefined();
    expect(children.activity.entity).toBe('activity_log');
    expect(children.chat).toBeDefined();
    expect(children.chat.entity).toBe('chat_message');
  });

  it('should merge extra children', () => {
    const children = withStandardChildren('engagement', {
      rfis: { entity: 'rfi', fk: 'engagement_id' },
    });
    expect(children.rfis).toBeDefined();
    expect(children.files).toBeDefined();
  });
});

describe('action factory', () => {
  it('should create action from template', () => {
    const result = action('send_reminder');
    expect(result.key).toBe('send_reminder');
    expect(result.label).toBe('Send Reminder');
    expect(result.icon).toBe('Bell');
  });

  it('should use custom handler', () => {
    const result = action('send_reminder', 'customHandler');
    expect(result.handler).toBe('customHandler');
  });

  it('should allow overrides', () => {
    const result = action('send_reminder', undefined, { label: 'Custom Label' });
    expect(result.label).toBe('Custom Label');
  });
});

describe('actions factory', () => {
  it('should create multiple actions from keys', () => {
    const result = actions('resolve', 'flag');
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('resolve');
    expect(result[1].key).toBe('flag');
  });
});

describe('embeddedSpec factory', () => {
  it('should create embedded spec with standard fields', () => {
    const spec = embeddedSpec('test_entity', 'Test Entity', 'TestIcon', {
      name: { type: 'text', label: 'Name' },
    });
    expect(spec.name).toBe('test_entity');
    expect(spec.label).toBe('Test Entity');
    expect(spec.embedded).toBe(true);
    expect(spec.fields.id).toBeDefined();
    expect(spec.fields.name).toBeDefined();
    expect(spec.fields.created_at).toBeDefined();
  });

  it('should use custom labelPlural', () => {
    const spec = embeddedSpec('test', 'Test', 'Icon', {}, { labelPlural: 'Custom Tests' });
    expect(spec.labelPlural).toBe('Custom Tests');
  });
});

describe('configSpec factory', () => {
  it('should create config spec with standard fields', () => {
    const spec = configSpec('entity_type', 'Entity Type', 'Building');
    expect(spec.name).toBe('entity_type');
    expect(spec.fields.id).toBeDefined();
    expect(spec.fields.name).toBeDefined();
    expect(spec.fields.description).toBeDefined();
    expect(spec.fields.status).toBeDefined();
    expect(spec.fields.sort_order).toBeDefined();
  });

  it('should include extra fields', () => {
    const spec = configSpec('engagement_type', 'Engagement Type', 'Briefcase', {
      key: { type: 'text', required: true },
    });
    expect(spec.fields.key).toBeDefined();
  });

  it('should have READ_ONLY access by default', () => {
    const spec = configSpec('test', 'Test', 'Icon');
    expect(spec.access).toEqual(ACCESS.READ_ONLY);
  });
});
