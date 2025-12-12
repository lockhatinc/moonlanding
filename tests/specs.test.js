/**
 * Tests for src/specs.js
 * Tests entity specifications and helper functions
 */

import { describe, it, expect } from 'vitest';
import { specs, getSpec, getNavItems, getAllSpecs } from '../src/specs.js';

// ========================================
// SPECS OBJECT TESTS
// ========================================

describe('specs object', () => {
  it('should export all expected entities', () => {
    const expectedEntities = [
      'engagement', 'review', 'client', 'rfi', 'highlight', 'user', 'team',
      'team_member', 'client_user', 'file', 'chat_message', 'template',
      'checklist', 'review_checklist', 'engagement_section', 'activity_log',
      'collaborator', 'user_group', 'settings', 'recreation_log', 'email',
      'notification', 'flag', 'tag', 'rfi_response', 'highlight_response',
      'removed_highlight', 'system_log', 'entity_type', 'engagement_type_config',
      'user_permission', 'client_sent_notification',
    ];

    for (const entity of expectedEntities) {
      expect(specs).toHaveProperty(entity);
    }
  });

  it('should have correct count of specs', () => {
    expect(Object.keys(specs).length).toBeGreaterThanOrEqual(30);
  });
});

// ========================================
// ENTITY SPEC STRUCTURE TESTS
// ========================================

describe('entity spec structure', () => {
  it('should have required properties for all specs', () => {
    for (const [name, spec] of Object.entries(specs)) {
      expect(spec.name, `${name} should have name`).toBe(name);
      expect(spec.label, `${name} should have label`).toBeTruthy();
      expect(spec.fields, `${name} should have fields`).toBeDefined();
      expect(spec.fields.id, `${name} should have id field`).toBeDefined();
    }
  });

  it('should have icon for all non-embedded specs', () => {
    for (const [name, spec] of Object.entries(specs)) {
      if (!spec.embedded) {
        expect(spec.icon, `${name} should have icon`).toBeTruthy();
      }
    }
  });

  it('should have labelPlural for most specs', () => {
    const specsWithPlurals = Object.values(specs).filter(s => !s.embedded);
    for (const spec of specsWithPlurals) {
      expect(spec.labelPlural, `${spec.name} should have labelPlural`).toBeTruthy();
    }
  });
});

// ========================================
// ENGAGEMENT SPEC TESTS
// ========================================

describe('engagement spec', () => {
  const spec = specs.engagement;

  it('should have correct metadata', () => {
    expect(spec.name).toBe('engagement');
    expect(spec.label).toBe('Engagement');
    expect(spec.labelPlural).toBe('Engagements');
    expect(spec.icon).toBe('Briefcase');
  });

  describe('fields', () => {
    it('should have all required fields', () => {
      expect(spec.fields.id).toBeDefined();
      expect(spec.fields.name).toBeDefined();
      expect(spec.fields.client_id).toBeDefined();
      expect(spec.fields.year).toBeDefined();
      expect(spec.fields.stage).toBeDefined();
      expect(spec.fields.status).toBeDefined();
    });

    it('should have client_id as ref to client', () => {
      expect(spec.fields.client_id.type).toBe('ref');
      expect(spec.fields.client_id.ref).toBe('client');
      expect(spec.fields.client_id.required).toBe(true);
    });

    it('should have stage as enum with correct default', () => {
      expect(spec.fields.stage.type).toBe('enum');
      expect(spec.fields.stage.default).toBe('info_gathering');
    });

    it('should have workflow status fields', () => {
      expect(spec.fields.client_status).toBeDefined();
      expect(spec.fields.auditor_status).toBeDefined();
      expect(spec.fields.letter_client_status).toBeDefined();
      expect(spec.fields.letter_auditor_status).toBeDefined();
    });

    it('should have progress fields as read-only', () => {
      expect(spec.fields.progress.readOnly).toBe(true);
      expect(spec.fields.client_progress.readOnly).toBe(true);
    });

    it('should have audit fields', () => {
      expect(spec.fields.created_by).toBeDefined();
      expect(spec.fields.created_at).toBeDefined();
      expect(spec.fields.updated_at).toBeDefined();
    });
  });

  describe('options', () => {
    it('should have all enum options', () => {
      expect(spec.options.statuses).toBeDefined();
      expect(spec.options.stages).toBeDefined();
      expect(spec.options.client_statuses).toBeDefined();
      expect(spec.options.auditor_statuses).toBeDefined();
      expect(spec.options.repeat_intervals).toBeDefined();
    });

    it('should have 6 engagement stages', () => {
      expect(spec.options.stages).toHaveLength(6);
    });
  });

  describe('computed fields', () => {
    it('should have rfi_count and completed_rfi_count', () => {
      expect(spec.computed.rfi_count).toBeDefined();
      expect(spec.computed.rfi_count.sql).toContain('SELECT COUNT(*)');
      expect(spec.computed.completed_rfi_count).toBeDefined();
    });
  });

  describe('children', () => {
    it('should have sections and rfis children', () => {
      expect(spec.children.sections).toBeDefined();
      expect(spec.children.sections.entity).toBe('engagement_section');
      expect(spec.children.rfis).toBeDefined();
      expect(spec.children.rfis.entity).toBe('rfi');
    });

    it('should have standard children (files, activity, chat)', () => {
      expect(spec.children.files).toBeDefined();
      expect(spec.children.activity).toBeDefined();
      expect(spec.children.chat).toBeDefined();
    });
  });

  describe('access', () => {
    it('should allow clients to list and view', () => {
      expect(spec.access.list).toContain('client');
      expect(spec.access.view).toContain('client');
    });

    it('should allow managers to create and edit', () => {
      expect(spec.access.create).toContain('manager');
      expect(spec.access.edit).toContain('manager');
    });

    it('should only allow partners to delete', () => {
      expect(spec.access.delete).toEqual(['partner']);
    });

    it('should have change_stage and close permissions', () => {
      expect(spec.access.change_stage).toBeDefined();
      expect(spec.access.close).toEqual(['partner']);
    });
  });

  describe('actions', () => {
    it('should have engagement-specific actions', () => {
      const actionKeys = spec.actions.map(a => a.key);
      expect(actionKeys).toContain('send_letter');
      expect(actionKeys).toContain('link_review');
      expect(actionKeys).toContain('recreate');
      expect(actionKeys).toContain('generate_letter');
    });
  });

  describe('workflow', () => {
    it('should have stage_transitions', () => {
      expect(spec.workflow.stage_transitions).toBeDefined();
      expect(spec.workflow.stage_transitions.info_gathering).toBeDefined();
      expect(spec.workflow.stage_transitions.close_out).toBeDefined();
    });
  });

  describe('triggers', () => {
    it('should have lifecycle triggers', () => {
      expect(spec.triggers.onCreate).toBe('onEngagementCreate');
      expect(spec.triggers.onUpdate).toBe('onEngagementUpdate');
      expect(spec.triggers.onDelete).toBe('onEngagementDelete');
    });
  });
});

// ========================================
// REVIEW SPEC TESTS
// ========================================

describe('review spec', () => {
  const spec = specs.review;

  it('should have correct metadata', () => {
    expect(spec.name).toBe('review');
    expect(spec.label).toBe('Review');
    expect(spec.icon).toBe('FileSearch');
  });

  it('should have team_id as required ref', () => {
    expect(spec.fields.team_id.type).toBe('ref');
    expect(spec.fields.team_id.ref).toBe('team');
    expect(spec.fields.team_id.required).toBe(true);
  });

  it('should have open/closed status', () => {
    expect(spec.fields.status.default).toBe('open');
    expect(spec.options.statuses.map(s => s.value)).toContain('closed');
  });

  it('should have custom detail component', () => {
    expect(spec.detail.component).toBe('review-detail');
  });

  it('should have computed highlight counts', () => {
    expect(spec.computed.highlight_count).toBeDefined();
    expect(spec.computed.unresolved_count).toBeDefined();
    expect(spec.computed.collaborator_count).toBeDefined();
  });

  it('should have additional permissions for review features', () => {
    expect(spec.access.resolve).toBeDefined();
    expect(spec.access.add_flags).toBeDefined();
    expect(spec.access.add_tags).toBeDefined();
    expect(spec.access.manage_collaborators).toBeDefined();
  });

  it('should have tender-related fields', () => {
    expect(spec.fields.is_tender).toBeDefined();
    expect(spec.fields.tender_details).toBeDefined();
    expect(spec.fields.tender_flags).toBeDefined();
  });
});

// ========================================
// CLIENT SPEC TESTS
// ========================================

describe('client spec', () => {
  const spec = specs.client;

  it('should have correct metadata', () => {
    expect(spec.name).toBe('client');
    expect(spec.label).toBe('Client');
    expect(spec.icon).toBe('Building');
  });

  it('should have name and email searchable', () => {
    expect(spec.fields.name.search).toBe(true);
    expect(spec.fields.email.search).toBe(true);
  });

  it('should have engagement_count as read-only', () => {
    expect(spec.fields.engagement_count.readOnly).toBe(true);
  });

  it('should have engagements and contacts children', () => {
    expect(spec.children.engagements.entity).toBe('engagement');
    expect(spec.children.contacts.entity).toBe('client_user');
  });

  it('should have onUpdate trigger', () => {
    expect(spec.triggers.onUpdate).toBe('onClientUpdate');
  });
});

// ========================================
// RFI SPEC TESTS
// ========================================

describe('rfi spec', () => {
  const spec = specs.rfi;

  it('should have parent set to engagement', () => {
    expect(spec.parent).toBe('engagement');
  });

  it('should have engagement_id as required hidden ref', () => {
    expect(spec.fields.engagement_id.type).toBe('ref');
    expect(spec.fields.engagement_id.ref).toBe('engagement');
    expect(spec.fields.engagement_id.required).toBe(true);
    expect(spec.fields.engagement_id.hidden).toBe(true);
  });

  it('should have question as required searchable field', () => {
    expect(spec.fields.question.type).toBe('textarea');
    expect(spec.fields.question.required).toBe(true);
    expect(spec.fields.question.search).toBe(true);
  });

  it('should have multi-status tracking', () => {
    expect(spec.fields.status).toBeDefined();
    expect(spec.fields.rfi_status).toBeDefined();
    expect(spec.fields.client_status).toBeDefined();
    expect(spec.fields.auditor_status).toBeDefined();
  });

  it('should have list grouped by section', () => {
    expect(spec.list.groupBy).toBe('section_id');
    expect(spec.list.expandable).toBe(true);
  });

  it('should have respond permission for clients', () => {
    expect(spec.access.respond).toContain('client');
  });

  it('should have validation rules', () => {
    expect(spec.validation.statusChangeRequires).toBe('files_or_responses');
    expect(spec.validation.statusChangeRoles).toBeDefined();
  });
});

// ========================================
// HIGHLIGHT SPEC TESTS
// ========================================

describe('highlight spec', () => {
  const spec = specs.highlight;

  it('should have parent set to review', () => {
    expect(spec.parent).toBe('review');
  });

  it('should have page_number as required int', () => {
    expect(spec.fields.page_number.type).toBe('int');
    expect(spec.fields.page_number.required).toBe(true);
  });

  it('should have position as required json', () => {
    expect(spec.fields.position.type).toBe('json');
    expect(spec.fields.position.required).toBe(true);
    expect(spec.fields.position.hidden).toBe(true);
  });

  it('should have resolution fields', () => {
    expect(spec.fields.resolved).toBeDefined();
    expect(spec.fields.resolved_by).toBeDefined();
    expect(spec.fields.resolved_at).toBeDefined();
  });

  it('should have partial resolution fields', () => {
    expect(spec.fields.partial_resolved).toBeDefined();
    expect(spec.fields.partial_resolved_by).toBeDefined();
    expect(spec.fields.partial_resolved_at).toBeDefined();
  });

  it('should have soft delete config', () => {
    expect(spec.softDelete).toBeDefined();
    expect(spec.softDelete.archive).toBe(true);
    expect(spec.softDelete.archiveEntity).toBe('removed_highlight');
  });

  it('should have displayColors', () => {
    expect(spec.displayColors).toBeDefined();
    expect(spec.displayColors.default).toBe('#B0B0B0');
  });

  it('should have highlight-specific actions', () => {
    const actionKeys = spec.actions.map(a => a.key);
    expect(actionKeys).toContain('resolve');
    expect(actionKeys).toContain('partial_resolve');
    expect(actionKeys).toContain('push_to_rfi');
    expect(actionKeys).toContain('scroll_to');
  });
});

// ========================================
// USER SPEC TESTS
// ========================================

describe('user spec', () => {
  const spec = specs.user;

  it('should have email as required unique field', () => {
    expect(spec.fields.email.required).toBe(true);
    expect(spec.fields.email.unique).toBe(true);
  });

  it('should have password_hash as hidden', () => {
    expect(spec.fields.password_hash.hidden).toBe(true);
  });

  it('should have type and role enums', () => {
    expect(spec.fields.type.type).toBe('enum');
    expect(spec.fields.role.type).toBe('enum');
    expect(spec.fields.type.default).toBe('auditor');
    expect(spec.fields.role.default).toBe('clerk');
  });

  it('should have partner-only access', () => {
    expect(spec.access.list).toEqual(['partner']);
    expect(spec.access.create).toEqual(['partner']);
  });
});

// ========================================
// TEAM SPEC TESTS
// ========================================

describe('team spec', () => {
  const spec = specs.team;

  it('should have computed member_count', () => {
    expect(spec.computed.member_count).toBeDefined();
    expect(spec.computed.member_count.sql).toContain('team_members');
  });

  it('should have members, engagements, reviews children', () => {
    expect(spec.children.members.entity).toBe('team_member');
    expect(spec.children.engagements.entity).toBe('engagement');
    expect(spec.children.reviews.entity).toBe('review');
  });
});

// ========================================
// EMBEDDED SPECS TESTS
// ========================================

describe('embedded specs', () => {
  const embeddedSpecs = [
    'team_member', 'client_user', 'file', 'chat_message', 'review_checklist',
    'engagement_section', 'activity_log', 'collaborator', 'recreation_log',
    'notification', 'rfi_response', 'highlight_response', 'removed_highlight',
    'system_log', 'user_permission', 'client_sent_notification',
  ];

  it('should mark embedded specs correctly', () => {
    for (const name of embeddedSpecs) {
      expect(specs[name].embedded, `${name} should be embedded`).toBe(true);
    }
  });
});

// ========================================
// CONFIG SPECS TESTS
// ========================================

describe('config specs', () => {
  describe('entity_type', () => {
    const spec = specs.entity_type;

    it('should have name as unique field', () => {
      expect(spec.fields.name.unique).toBe(true);
    });

    it('should have seed data', () => {
      expect(spec.seedData).toBeDefined();
    });
  });

  describe('engagement_type_config', () => {
    const spec = specs.engagement_type_config;

    it('should have key field', () => {
      expect(spec.fields.key).toBeDefined();
      expect(spec.fields.key.unique).toBe(true);
    });

    it('should have default_template_id ref', () => {
      expect(spec.fields.default_template_id.type).toBe('ref');
      expect(spec.fields.default_template_id.ref).toBe('template');
    });
  });
});

// ========================================
// SETTINGS SPEC TESTS
// ========================================

describe('settings spec', () => {
  const spec = specs.settings;

  it('should be marked as singleton', () => {
    expect(spec.singleton).toBe(true);
  });

  it('should have key as unique field', () => {
    expect(spec.fields.key.unique).toBe(true);
  });

  it('should have partner-only access', () => {
    expect(spec.access.list).toEqual(['partner']);
    expect(spec.access.edit).toEqual(['partner']);
  });
});

// ========================================
// HELPER FUNCTIONS TESTS
// ========================================

describe('getSpec', () => {
  it('should return spec by name', () => {
    const spec = getSpec('engagement');
    expect(spec.name).toBe('engagement');
    expect(spec.label).toBe('Engagement');
  });

  it('should throw for unknown entity', () => {
    expect(() => getSpec('nonexistent')).toThrow('Unknown entity: nonexistent');
  });
});

describe('getNavItems', () => {
  it('should return navigation items for non-embedded, non-parent specs', () => {
    const items = getNavItems();
    expect(items.length).toBeGreaterThan(0);
  });

  it('should not include embedded specs', () => {
    const items = getNavItems();
    const names = items.map(i => i.name);
    expect(names).not.toContain('team_member');
    expect(names).not.toContain('file');
    expect(names).not.toContain('activity_log');
  });

  it('should not include specs with parent', () => {
    const items = getNavItems();
    const names = items.map(i => i.name);
    expect(names).not.toContain('rfi');
    expect(names).not.toContain('highlight');
  });

  it('should not include singleton specs', () => {
    const items = getNavItems();
    const names = items.map(i => i.name);
    expect(names).not.toContain('settings');
  });

  it('should have correct item structure', () => {
    const items = getNavItems();
    for (const item of items) {
      expect(item.name).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.href).toBe(`/${item.name}`);
    }
  });
});

describe('getAllSpecs', () => {
  it('should return all specs as array', () => {
    const allSpecs = getAllSpecs();
    expect(Array.isArray(allSpecs)).toBe(true);
    expect(allSpecs.length).toBe(Object.keys(specs).length);
  });
});

// ========================================
// FIELD TYPE CONSISTENCY TESTS
// ========================================

describe('field type consistency', () => {
  const validTypes = ['id', 'text', 'textarea', 'email', 'int', 'decimal', 'bool', 'date', 'timestamp', 'json', 'image', 'ref', 'enum'];

  it('should use valid field types across all specs', () => {
    for (const [specName, spec] of Object.entries(specs)) {
      for (const [fieldName, field] of Object.entries(spec.fields)) {
        expect(
          validTypes.includes(field.type),
          `${specName}.${fieldName} has invalid type: ${field.type}`
        ).toBe(true);
      }
    }
  });

  it('should have ref fields point to existing entities', () => {
    const entityNames = Object.keys(specs);
    for (const [specName, spec] of Object.entries(specs)) {
      for (const [fieldName, field] of Object.entries(spec.fields)) {
        if (field.type === 'ref' && field.ref) {
          expect(
            entityNames.includes(field.ref),
            `${specName}.${fieldName} refs unknown entity: ${field.ref}`
          ).toBe(true);
        }
      }
    }
  });

  it('should have enum fields reference options key', () => {
    for (const [specName, spec] of Object.entries(specs)) {
      for (const [fieldName, field] of Object.entries(spec.fields)) {
        if (field.type === 'enum' && field.options && spec.options) {
          expect(
            spec.options.hasOwnProperty(field.options),
            `${specName}.${fieldName} references missing options key: ${field.options}`
          ).toBe(true);
        }
      }
    }
  });
});

// ========================================
// ACCESS CONSISTENCY TESTS
// ========================================

describe('access consistency', () => {
  const validRoles = ['partner', 'manager', 'clerk', 'client'];

  it('should use valid roles in access definitions', () => {
    for (const [specName, spec] of Object.entries(specs)) {
      if (!spec.access) continue;
      for (const [action, roles] of Object.entries(spec.access)) {
        if (Array.isArray(roles)) {
          for (const role of roles) {
            expect(
              validRoles.includes(role),
              `${specName}.access.${action} has invalid role: ${role}`
            ).toBe(true);
          }
        }
      }
    }
  });
});

// ========================================
// CHILDREN CONSISTENCY TESTS
// ========================================

describe('children consistency', () => {
  it('should have children reference existing entities', () => {
    const entityNames = Object.keys(specs);
    for (const [specName, spec] of Object.entries(specs)) {
      if (!spec.children) continue;
      for (const [childKey, childDef] of Object.entries(spec.children)) {
        expect(
          entityNames.includes(childDef.entity),
          `${specName}.children.${childKey} references unknown entity: ${childDef.entity}`
        ).toBe(true);
      }
    }
  });

  it('should have children with valid fk fields', () => {
    for (const [specName, spec] of Object.entries(specs)) {
      if (!spec.children) continue;
      for (const [childKey, childDef] of Object.entries(spec.children)) {
        expect(childDef.fk, `${specName}.children.${childKey} missing fk`).toBeTruthy();
        // The fk should be a field in the child entity
        const childSpec = specs[childDef.entity];
        if (childSpec) {
          // fk should exist or be entity_id (polymorphic)
          const hasFk = childSpec.fields[childDef.fk] || childDef.fk === 'entity_id';
          expect(hasFk, `${specName}.children.${childKey} fk ${childDef.fk} not found in ${childDef.entity}`).toBeTruthy();
        }
      }
    }
  });
});
