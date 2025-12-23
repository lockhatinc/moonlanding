# Architectural Optimization Plan: Unified Config-Driven Framework

**Objective:** Eliminate duplication, maximize code reuse, make system fully dynamic/config-driven, and implement all spec requirements with minimal code footprint.

---

## PART 1: Critical Issues & Quick Wins

### Issue 1: User Sync Schedule Mismatch
- **Current:** 3 AM (`0 3 * * *`)
- **Spec:** 2 AM
- **Fix:** Change `src/config/jobs-config.js` line 10 to `0 2 * * *`
- **Effort:** 1 minute

### Issue 2: Missing Entity Configs (Breaking Spec Compliance)
- **Missing:** `tender`, `letter`, `rfi-section`, `flag` (as managed entity vs JSON)
- **Currently:** Referenced in code but no config files
- **Fix:** Create 4 new entity configs
- **Effort:** 2 hours

### Issue 3: Permission Matrix Duplication (18 instances)
- **Current:** Each entity repeats `.permissions()` with full role definitions
- **Problem:** Changes to permissions require editing 18+ files
- **Fix:** Create `PermissionMatrix` generator that creates matrices from a template
- **Result:** Reduce from 18 copies to 1 template + 18 references
- **Effort:** 4 hours

### Issue 4: Spec Pattern Duplication (withAuditFields + withComputedX)
- **Current:** All complex entities repeat same wrapper pattern
- **Problem:** Code is 30% boilerplate
- **Fix:** Create higher-order function `withStandardFields(spec, computedFields)`
- **Result:** Reduce 10 files from 4KB each to 1.5KB each (~25KB saved)
- **Effort:** 2 hours

---

## PART 2: Framework-Level Optimizations

### Optimization 1: Entity Config Generator Framework

**Goal:** Create a meta-system that generates entity specs from minimal templates.

**Current approach:**
```javascript
spec('engagement')
  .label('Engagement')
  .field('stage', 'enum', { options: 'engagement_stages' })
  .permissions({ matrix: { partner: [...], manager: [...], clerk: [...] } })
  .hooks({ beforeCreate: (...) => {...} })
  // ... 50+ lines
```

**New approach:**
```javascript
// Step 1: Define entity type template
const EngagementTemplate = {
  type: 'engagement',
  workflow: 'engagement_lifecycle',  // References: src/config/workflows/engagement.yaml
  permissions: 'standard_auditor_access',  // References: src/config/permission-templates/standard.yaml
  computedFields: ['progress', 'daysOutstanding'],
  hasTimeline: true,
  hasRoles: ['partner', 'manager', 'clerk'],
};

// Step 2: Generator creates the full spec
const engagement = generateEntitySpec(EngagementTemplate);

// Generated output = same as before, but 90% less code
```

**Benefits:**
- New entities created in 10 lines instead of 100
- Permission changes apply to all 9 entities automatically
- Reduces entity config files from 14 to 5 (template-based generation)

---

### Optimization 2: Parameterized Permission Matrix

**Current state:**
```javascript
// 18 copies like this:
.permissions({
  matrix: {
    partner: ['list', 'view', 'create', 'edit', 'delete'],
    manager: ['list', 'view', 'create', 'edit'],
    clerk: ['list', 'view']
  }
})
```

**New state:**
```javascript
// Master template (1 copy):
const PERMISSION_PRESETS = {
  'standard_auditor_access': {
    partner: ['list', 'view', 'create', 'edit', 'delete', 'manage_team'],
    manager: ['list', 'view', 'create', 'edit'],
    clerk: ['list', 'view'],
    client_admin: ['list', 'view'],
    client_user: ['view_assigned']
  },
  'sensitive_partner_only': {
    partner: ['list', 'view', 'create', 'edit', 'delete'],
    others: []
  },
  'review_collaboration': {
    partner: ['manage'],
    manager: ['edit_own'],
    clerk: ['view']
  }
};

// Entity refs it:
.permissions('standard_auditor_access')
// OR with overrides:
.permissions('standard_auditor_access', {
  fieldPermissions: { deadline: { edit: ['partner'] } }
})
```

**Benefits:**
- Change one role's permissions → affects all 14 entities
- New role? Add to PERMISSION_PRESETS, apply to all entities
- Field overrides still possible for special cases

---

### Optimization 3: Numeric Thresholds Centralization

**Current state:** Hardcoded in 6 different files
- `jobs-config.js`: [7, 3, 1, 0] days for RFI notifications
- `workflows.js`: afterDays: [7, 30]
- `collaborator.config.js`: defaultExpiryDays: 7, maxExpiryDays: 30
- `email-templates.js`: 7 days for tender deadline
- `jobs.js`: Various cronjob schedules

**New state:**
```javascript
// src/config/system/thresholds.js
export const THRESHOLDS = {
  rfi: {
    notificationDays: [7, 3, 1, 0],           // Days before deadline
    agingThresholds: [3, 7, 14],              // Days outstanding escalation
    escalationDelay: 24 * 60 * 60 * 1000,     // 24 hours between escalations
  },
  collaborator: {
    defaultExpiryDays: 7,
    maxExpiryDays: 30,
    notifyBeforeExpiryHours: 24,
  },
  tender: {
    warningDaysBefore: 7,
  },
  engagement: {
    autoTransitionAfterDays: 30,
    archiveAfterDays: 365,
  },
  workflow: {
    closeoutAfterDays: 30,
    completionAfterDays: 7,
  }
};
```

**Benefits:**
- Change one value → applies everywhere it's used
- All thresholds visible in one place
- Easy to parameterize per client/scenario

---

### Optimization 4: RFI Type System (Standard vs Post-RFI)

**Current state:**
- Single RFI entity with embedded "post_rfi" status fields
- Logic scattered: some in rfi.config.js, some in recreation.js, some in email-templates.js

**New state:**
```javascript
// src/config/entities/rfi-types.js
export const RFI_TYPES = {
  standard: {
    name: 'Standard RFI',
    displayStates: {
      auditor: ['requested', 'reviewing', 'queries', 'received'],
      client: ['pending', 'partially_sent', 'sent']
    },
    internalStates: [0, 1],  // 0=open, 1=completed
    fields: {
      date_requested: true,
      date_resolved: true,
      deadline: true,
      response_count: true,
      files_count: true,
      days_outstanding: true,  // Computed
    },
    notifications: {
      escalationThresholds: [3, 7, 14],  // days outstanding
      deadlineWarnings: [7, 3, 1, 0],     // days before deadline
    }
  },

  post_rfi: {
    name: 'Post-RFI (Finalization)',
    displayStates: {
      auditor: ['pending', 'sent'],
      client: ['pending', 'queries', 'accepted']
    },
    internalStates: [0, 1],
    fields: {
      // Subset of standard RFI fields, different display logic
      date_requested: true,
      date_resolved: true,
      response_count: true,
      files_count: true,
      // NO deadline, NO days_outstanding for post-rfi
    },
    notifications: {
      escalationThresholds: [],      // No escalation
      deadlineWarnings: [],           // No deadline warnings
    }
  }
};

// Use in code:
const rfiType = RFI_TYPES[rfi.type || 'standard'];
const notifications = rfiType.notifications.escalationThresholds;
```

**Benefits:**
- Post-RFI behavior automatically different without conditional logic
- Add new RFI type (e.g., "Tender RFI") in one place
- All type-specific logic centralized

---

## PART 3: Implementation Roadmap (Parallel Batches)

### BATCH 1: Foundation (Metrics - 30KB code reduction)
1. Create `entity-spec-generator.js` (meta-framework)
2. Create `permission-matrix-template.js` (parameterized permissions)
3. Create `thresholds.js` (centralized numeric values)
4. Create `rfi-types.js` (RFI variants)
5. Fix user sync schedule (2 AM)

**Output:** 4 new config files, 1 schedule fix, eliminates 18 permission duplicates

---

### BATCH 2: Missing Entities (Compliance - Spec coverage)
1. Create `tender.config.js`
2. Create `letter.config.js`
3. Create `rfi-section.config.js`
4. Extract `flag.config.js` (from review.flags JSON)
5. Create `workflow-template.js` (base for engagement/rfi/review)

**Output:** 4 new entity configs, 1 new workflow base, 100% spec compliance

---

### BATCH 3: Consolidation (DRY - Reduce duplication)
1. Refactor all 14 entities to use `generateEntitySpec()` or `withStandardFields()`
2. Consolidate 18 permission matrices to template references
3. Delete `permission.service.js` (duplicate)
4. Delete `permission-predicates.js` (redundant)
5. Consolidate email templates into `template-loader.js` (config-driven)

**Output:** 30% less code, single source of truth for permissions

---

### BATCH 4: Dynamic Systems (Framework)
1. Create `automation-schedule.js` (config-driven jobs)
2. Create `feature-variant.js` (Friday vs MWR as decorators)
3. Create `offline-strategy-config.js` (sync strategies per entity)
4. Create `notification-trigger-system.js` (event-driven rules)
5. Create `document-generation-pipeline.js` (template variables)

**Output:** 5 new framework files, full config-driven automation

---

### BATCH 5: Cleanup & Testing
1. Delete unused empty configs
2. Verify all imports reference new locations
3. Build & compile check
4. Manual test spec requirements
5. Update CLAUDE.md with new architecture

**Output:** Clean codebase, zero build errors, all tests passing

---

## PART 4: Expected Outcomes

### Code Metrics
- **Before:** 879 lines entity config code (14 files)
- **After:** ~300 lines (5-6 files + 4 templates)
- **Reduction:** 66% less boilerplate

### Config Metrics
- **Before:** 18 permission matrices (duplication)
- **After:** 1 template + 18 references
- **Improvement:** 100% DRY

### Feature Coverage
- **Before:** 5/9 Friday features from spec, 0/4 MWR features from spec
- **After:** 9/9 Friday features, 4/4 MWR features

### Maintenance
- **Before:** Change permission → edit 18 files
- **After:** Change permission → edit 1 file (template), all 18 entities updated

---

## PART 5: Architecture Diagram (After Optimization)

```
┌─────────────────────────────────────────────────────────────┐
│                  ENTITY SPEC GENERATOR                       │
│  (meta-framework: converts templates → full specs)          │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌─────────────────┐ ┌────────────────┐ ┌──────────────┐
│ Entity Config   │ │ Permission     │ │ RFI Type     │
│ Templates       │ │ Matrix Presets │ │ System       │
│                 │ │                │ │              │
│ • Standard      │ │ • Auditor      │ │ • Standard   │
│ • Sensitive     │ │ • Review       │ │ • Post-RFI   │
│ • Timeline      │ │ • Admin        │ │ • Custom     │
└────────┬────────┘ └────────┬───────┘ └──────┬───────┘
         │                   │                 │
         └───────────────────┼─────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Engagement   │    │ Review       │    │ RFI          │
│ Review       │    │ Highlight    │    │ Collaborator │
│ Checklist    │    │ Collaborator │    │ Tender       │
│ ... (9 total)     │ ... (5 total)     │ Letter       │
└──────────────┘    └──────────────┘    └──────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Thresholds       │
                    │ Schedules        │
                    │ Sync Strategies  │
                    │ Feature Flags    │
                    └──────────────────┘
```

---

## PART 6: Next Steps for Approval

1. **Review this plan** - Does it align with your goals?
2. **Approve scope** - Should we do all 5 batches in parallel or sequentially?
3. **Prioritize** - Which batches matter most?
4. **Go/No-Go** - Ready to execute?

**Estimated total time:** 20-25 hours of implementation (with parallel execution: 10-12 hours)

---

**Questions to clarify before starting:**

1. Should we make **RFI Type System** part of core data model (rfi.type field) or just config-driven logic?
2. Should **Feature Toggles** (Friday vs MWR) be per-user or per-system?
3. Should **Offline Strategies** be per-entity or per-feature?
4. Do you want **Entity Spec Generator** to support database-driven generation (load from config table)?
