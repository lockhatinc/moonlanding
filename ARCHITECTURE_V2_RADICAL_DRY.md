# Architecture V2: Radical DRY Configuration System
## Single Codebase, Multiple Domains (Friday + MWR), Zero Offline Complexity

---

## CORE PRINCIPLE

**Everything is config. Config itself must be DRY.**

Current state: 18 permission matrices, 5 entity templates, 6 workflow definitions, scattered thresholds.
Target state: 1 master config that generates all 29 artifacts.

---

## PART 1: The Master Config DSL (Configuration Kernel)

Instead of writing individual config files, we write a **minimal, composable config language** that generates:
- Entity specs
- Permission matrices
- Workflow rules
- Notification triggers
- Validation rules
- Domain-specific feature flags

### File: `src/config/system/master-config.yml`

```yaml
# ============================================================================
# MASTER CONFIGURATION KERNEL
# Single source of truth for all system behavior
# ============================================================================

# SECTION 1: Role Definitions (Hierarchical, Single Definition)
roles:
  partner:
    hierarchy: 0
    label: "Partner"
    description: "Full system access, exclusive CloseOut permission"

  manager:
    hierarchy: 1
    label: "Manager"
    description: "Can create/edit entities, cannot delete or access settings"

  clerk:
    hierarchy: 2
    label: "Clerk"
    description: "Read-only, except assigned entities with approval permission"

  client_admin:
    hierarchy: 3
    type: client
    label: "Client Admin"
    description: "Can view all RFIs for their client, rate engagements"

  client_user:
    hierarchy: 4
    type: client
    label: "Client User"
    description: "Can only view assigned RFIs, cannot rate"

# ============================================================================

# SECTION 2: Permission Templates (Reusable Across Entities)
permission_templates:
  standard_auditor:
    partner: [list, view, create, edit, delete, manage_settings, manage_team]
    manager: [list, view, create, edit]
    clerk: [list, view]
    client_admin: [list, view]
    client_user: [view_assigned]

  partner_only:
    partner: [list, view, create, edit, delete, manage_settings, manage_team]
    manager: []
    clerk: []

  review_collaboration:
    partner: [list, view, create, edit, delete, manage_collaborators, manage_highlights]
    manager: [list, view, create, edit, manage_collaborators_own]
    clerk: [list, view]

  client_response:
    partner: []
    manager: []
    clerk: []
    client_admin: [list, view, respond]
    client_user: [view_assigned, respond_assigned]

# ============================================================================

# SECTION 3: Workflow Definitions (Engagement Lifecycle Base)
workflows:
  engagement_lifecycle:
    stages:
      - name: info_gathering
        label: "Info Gathering"
        color: blue
        entry: "default"
        auto_transition: true
        auto_transition_trigger: "date_reached(commencement_date)"
        forward: [commencement]
        backward: []
        locks: [stage]  # Cannot manually set if past commencement_date

      - name: commencement
        label: "Commencement"
        color: blue
        entry: "auto|manual"
        forward: [team_execution]
        backward: [info_gathering]
        locks: []
        activates: [engagement_letter]  # Activate feature flag

      - name: team_execution
        label: "Team Execution"
        color: amber
        entry: "manual"
        forward: [partner_review]
        backward: [commencement]
        activates: [rfi_main]

      - name: partner_review
        label: "Partner Review"
        color: amber
        entry: "manual"
        forward: [finalization]
        backward: [team_execution]

      - name: finalization
        label: "Finalization"
        color: green
        entry: "manual"
        forward: [close_out]
        backward: [partner_review]
        activates: [client_feedback, post_rfi]

      - name: close_out
        label: "Close Out"
        color: green
        entry: "partner_only"  # Only partner can transition here
        requires_validation:
          - engagement_letter_accepted OR progress == 0  # Strict gate
        forward: []
        backward: []
        readonly: true  # Most data read-only

  rfi_type_standard:
    name: "RFI"
    internal_states: [0, 1]  # 0=open, 1=completed
    display_states:
      auditor: [requested, reviewing, queries, received]
      client: [pending, partially_sent, sent]
    fields: [date_requested, date_resolved, deadline, response_count, files_count, days_outstanding]
    requires_completion: "file_upload OR text_response"
    notifications:
      escalation_thresholds: [3, 7, 14]  # Days outstanding
      deadline_warnings: [7, 3, 1, 0]    # Days before deadline

  rfi_type_post_rfi:
    name: "Post-RFI"
    internal_states: [0, 1]
    display_states:
      auditor: [pending, sent]
      client: [pending, queries, accepted]
    fields: [date_requested, date_resolved, response_count, files_count]
    requires_completion: "file_upload OR text_response"
    notifications:
      escalation_thresholds: []  # No escalation
      deadline_warnings: []      # No deadline

# ============================================================================

# SECTION 4: Numeric Thresholds (All in One Place)
thresholds:
  rfi:
    notification_days: [7, 3, 1, 0]      # Days before deadline
    aging_thresholds: [3, 7, 14]         # Days outstanding escalation
    escalation_delay_hours: 24

  collaborator:
    default_expiry_days: 7
    max_expiry_days: 30
    notify_before_expiry_hours: 24

  tender:
    warning_days_before: 7

  engagement:
    auto_transition_buffer_hours: 1  # Auto-transition 1 hour after date
    archive_after_days: 365

  workflow:
    closeout_after_days: 30
    completion_after_days: 7

# ============================================================================

# SECTION 5: Entities (Minimal DSL)
# Syntax: entity_name: {template_ref, workflow_ref, overrides}
entities:
  engagement:
    spec_template: standard_auditor
    permission_template: standard_auditor
    workflow: engagement_lifecycle
    computed_fields: [progress, daysOutstanding, createdBy]
    has_timeline: true
    has_roles: [partner, manager, clerk]
    field_overrides:
      stage:
        type: enum
        options: engagement_lifecycle.stages[].name
        validator: lifecycle_stage_transition

  rfi:
    spec_template: standard_auditor
    permission_template: standard_auditor
    workflow: rfi_type_standard
    computed_fields: [daysOutstanding]
    variants:
      post_rfi:
        workflow: rfi_type_post_rfi
        permission_template: standard_auditor

  review:
    spec_template: standard_auditor
    permission_template: review_collaboration
    workflow: review_lifecycle
    computed_fields: [progress, createdBy]

  highlight:
    spec_template: standard_auditor
    permission_template: review_collaboration
    immutable: true  # Never hard-delete
    immutable_strategy: move_to_archive

  checklist:
    spec_template: standard_auditor
    permission_template: standard_auditor
    auto_complete_when: "all_items_done"

  collaborator:
    spec_template: standard_auditor
    permission_template: partner_only
    has_temporary_access: true
    has_auto_revoke: true

  client:
    spec_template: standard_auditor
    permission_template: standard_auditor

  team:
    spec_template: standard_auditor
    permission_template: partner_only

  user:
    spec_template: standard_auditor
    permission_template: partner_only

  tender:
    spec_template: standard_auditor
    permission_template: standard_auditor
    default_deadline_days: 30
    warning_threshold_days: 7

  letter:
    spec_template: standard_auditor
    permission_template: standard_auditor
    document_type: engagement_letter

  rfi_section:
    spec_template: standard_auditor
    permission_template: standard_auditor
    parent_entity: engagement

  flag:
    spec_template: standard_auditor
    permission_template: review_collaboration
    types: [review_comment, highlight, priority]

# ============================================================================

# SECTION 6: Automation Schedules (Config-Driven Jobs)
automation:
  schedules:
    - name: user_sync
      trigger: "cron('0 2 * * *')"  # 2 AM daily
      action: sync_users_from_google_workspace
      entity: user

    - name: rfi_notifications
      trigger: "cron('0 5 * * *')"  # 5 AM daily
      action: send_rfi_deadline_notifications
      entity: rfi
      rule: rfi.notifications.deadline_warnings

    - name: engagement_recreation_yearly
      trigger: "cron('0 0 1 1 *')"  # Jan 1 @ 12 AM
      action: recreate_engagement
      filter: "engagement.repeat_interval == 'yearly'"

    - name: engagement_recreation_monthly
      trigger: "cron('0 0 1 * *')"  # 1st of month @ 12 AM
      action: recreate_engagement
      filter: "engagement.repeat_interval == 'monthly'"

    - name: auto_engagement_stage_transition
      trigger: "every_hour"
      action: auto_transition_stages
      entity: engagement
      rule: "stage.auto_transition && date >= trigger_date"

    - name: collaborator_revoke
      trigger: "cron('0 2 * * *')"  # 2 AM daily
      action: revoke_expired_collaborators
      entity: collaborator
      rule: "access_type == 'temporary' && expires_at <= now()"

    - name: tender_deadline_warning
      trigger: "cron('0 8 * * *')"  # 8 AM daily
      action: send_tender_deadline_warnings
      entity: tender
      rule: "daysUntilDeadline <= thresholds.tender.warning_days_before"

# ============================================================================

# SECTION 7: Notifications (Event-Driven Rules)
notifications:
  rfi_escalation:
    trigger: "rfi.daysOutstanding reaches threshold"
    thresholds: $workflows.rfi_type_standard.notifications.escalation_thresholds
    recipients:
      - role: partner
        channels: [email, in_app]
      - role: manager
        channels: [email, in_app]
    template: "rfi_escalation_{{threshold}}_days"

  engagement_deadline:
    trigger: "engagement.commencement_date reached"
    recipients:
      - roles: [partner, manager]
      channels: [email]
    template: "engagement_auto_transition"

  collaborator_expiry:
    trigger: "collaborator.expires_at - 24h"
    recipients:
      - entity: collaborator.user
        channels: [email]
    template: "collaborator_access_expiring"

  client_feedback_ready:
    trigger: "engagement.stage == 'finalization'"
    recipients:
      - role: client_admin
        channels: [email]
    template: "client_feedback_ready"

# ============================================================================

# SECTION 8: Document Generation (Template Variables)
document_generation:
  templates:
    engagement_letter:
      variables:
        client: "client.name"
        year: "engagement.year"
        address: "client.address"
        date: "now()"
        email: "client.email"
        engagement: "engagement.name"
        period: "engagement.period"
        fee: "engagement.fee"
        scope: "engagement.scope"

  google_drive:
    template_folder_variable: "DRIVE_ENGAGEMENT_LETTER_FOLDER"
    output_type: "pdf"
    cleanup_intermediate_docs: true

# ============================================================================

# SECTION 9: Highlight Palette (Config-Driven Colors)
highlights:
  palette:
    - color: "#B0B0B0"
      name: "grey"
      status: "unresolved"
      description: "Unresolved / Open highlight"

    - color: "#44BBA4"
      name: "green"
      status: "resolved"
      description: "Resolved highlight"

    - color: "#FF4141"
      name: "red"
      status: "high_priority"
      description: "Partner/High Priority Note"

    - color: "#7F7EFF"
      name: "purple"
      status: "active_focus"
      description: "Scrolled To (active focus state)"

# ============================================================================

# SECTION 10: Domain Configuration (Friday vs MWR)
domains:
  friday:
    name: "Friday"
    label: "Engagement Management"
    enabled: true
    features:
      engagement_management: true
      rfi_workflow: true
      engagement_letter: true
      client_feedback: true
      recreation: true

  mwr:
    name: "MWR"
    label: "My Work Review"
    enabled: true
    features:
      review_management: true
      pdf_viewer: true
      highlight_collaboration: true
      checklist_management: true
      tender_tracking: true
      pdf_comparison: true
      priority_reviews: true
      chat_merge: true

# ============================================================================

# SECTION 11: Feature Flags (Per-Domain, Config-Driven)
features:
  engagement_letter:
    enabled: true
    domain: friday
    workflow_stage: commencement

  client_feedback:
    enabled: true
    domain: friday
    workflow_stage: finalization
    roles: [client_admin]

  post_rfi:
    enabled: true
    domain: friday
    workflow_stage: finalization

  pdf_viewer:
    enabled: true
    domain: mwr
    entity: review

  highlight_collaboration:
    enabled: true
    domain: mwr
    entity: highlight
    requires: [pdf_viewer]

  chat_merge:
    enabled: true
    domain: mwr
    integration: friday_mwr
    requires: [review.review_link]

  priority_reviews:
    enabled: true
    domain: mwr
    entity: user
    field: priority_reviews

  pdf_comparison:
    enabled: true
    domain: mwr
    entity: review
    sync_scroll: true

  temporary_collaborator_access:
    enabled: true
    domain: mwr
    expiry_days: $thresholds.collaborator.default_expiry_days

  tender_deadline_warning:
    enabled: true
    domain: mwr
    warning_days: $thresholds.tender.warning_days_before

# ============================================================================

# SECTION 12: Integrations (Config-Driven External Systems)
integrations:
  google_workspace:
    enabled: true
    schedule: $automation.schedules[user_sync].trigger
    action: sync_users_from_google_workspace

  google_drive:
    enabled: true
    actions:
      - generate_letter
      - copy_files_on_recreation
    template_variables: $document_generation.templates

  google_gmail:
    enabled: true
    actions:
      - send_notifications
      - receive_email_attachments
    rate_limits:
      per_user_per_minute: 100
      per_project_per_day: 10000

# ============================================================================

# SECTION 13: Validation Rules (DSL, Not Code)
validation:
  engagement_stage_transition:
    rule: |
      if (current_stage == 'info_gathering' && date > commencement_date) {
        error: "Cannot manually set to InfoGathering after commencement_date"
      }
      if (current_stage == 'close_out' && role != 'partner') {
        error: "Only Partner can transition to CloseOut"
      }
      if (to_stage == 'close_out') {
        require: engagement_letter.status == 'accepted' OR progress == 0
      }

  rfi_completion:
    rule: |
      require: files_count > 0 OR response.text_length > 0
      error: "RFI must have file upload OR text response to mark complete"

  recreation_allowed:
    rule: |
      require: repeat_interval != 'once'
      error: "Cannot recreate engagement with repeat_interval='once'"

# ============================================================================
```

---

## PART 2: Config Generator Engine (Eliminates Boilerplate)

### File: `src/lib/config-generator-engine.js`

```javascript
/**
 * Master Config Generator Engine
 * Reads master-config.yml and generates:
 * - Entity specs
 * - Permission matrices
 * - Validation rules
 * - Notification handlers
 * - Schedule jobs
 */

export class ConfigGeneratorEngine {
  constructor(masterConfig) {
    this.config = masterConfig;
    this.cache = new Map();
  }

  /**
   * Generate an entity spec from master config template
   */
  generateEntitySpec(entityName) {
    const cacheKey = `spec:${entityName}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const entityConfig = this.config.entities[entityName];
    if (!entityConfig) throw new Error(`Entity not found: ${entityName}`);

    const permMatrix = this.getPermissionTemplate(
      entityConfig.permission_template
    );

    const spec = spec(entityName)
      .label(this.config.entity_labels?.[entityName] || entityName)
      .permissions(permMatrix);

    // Apply workflow if defined
    if (entityConfig.workflow) {
      const workflow = this.config.workflows[entityConfig.workflow];
      spec.workflow(workflow);
    }

    // Add computed fields
    if (entityConfig.computed_fields) {
      entityConfig.computed_fields.forEach((field) => {
        spec.computed(field);
      });
    }

    this.cache.set(cacheKey, spec);
    return spec;
  }

  /**
   * Get permission matrix from template
   */
  getPermissionTemplate(templateName) {
    return this.config.permission_templates[templateName];
  }

  /**
   * Generate notification handler from rules
   */
  generateNotificationHandler(notificationName) {
    const notif = this.config.notifications[notificationName];
    if (!notif) throw new Error(`Notification not found: ${notificationName}`);

    return {
      name: notificationName,
      trigger: notif.trigger,
      recipients: notif.recipients,
      template: notif.template,
    };
  }

  /**
   * Generate automation job from schedule
   */
  generateAutomationJob(scheduleName) {
    const schedule = this.config.automation.schedules.find(
      (s) => s.name === scheduleName
    );
    if (!schedule) throw new Error(`Schedule not found: ${scheduleName}`);

    return {
      name: schedule.name,
      trigger: schedule.trigger,
      action: schedule.action,
      filter: schedule.filter,
    };
  }

  /**
   * Get all entities for a domain
   */
  getEntitiesForDomain(domainName) {
    const domain = this.config.domains[domainName];
    if (!domain) throw new Error(`Domain not found: ${domainName}`);

    return Object.keys(this.config.entities).filter((entityName) => {
      const entity = this.config.entities[entityName];
      // If entity has no domain restriction, include it
      // If domain matches, include it
      return !entity.domain || entity.domain === domainName;
    });
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName, context = {}) {
    const feature = this.config.features[featureName];
    if (!feature) return false;
    if (!feature.enabled) return false;

    // Check context-specific requirements
    if (feature.requires) {
      return feature.requires.every((req) =>
        this.isFeatureEnabled(req, context)
      );
    }

    return true;
  }

  /**
   * Get threshold value
   */
  getThreshold(path) {
    // path = "rfi.notification_days" → this.config.thresholds.rfi.notification_days
    return path.split('.').reduce((obj, key) => obj[key], this.config.thresholds);
  }
}
```

---

## PART 3: Expected File Reduction

### BEFORE (Current State)
```
src/config/entities/
  ├── engagement.config.js (4.9 KB) ✗ BOILERPLATE
  ├── review.config.js (4.0 KB) ✗ DUPLICATION
  ├── rfi.config.js (3.5 KB) ✗ HARDCODED
  ├── highlight.config.js (3.1 KB) ✗ DUPLICATION
  ├── collaborator.config.js (4.5 KB) ✗ BOILERPLATE
  ├── checklist.config.js (2.4 KB) ✗ DUPLICATION
  ├── user.config.js (1.2 KB) ✗ BOILERPLATE
  ├── team.config.js (1.3 KB) ✗ BOILERPLATE
  ├── client.config.js (803 B) ✗ BOILERPLATE
  ├── client-user.config.js (861 B) ✗ BOILERPLATE
  ├── email.config.js (559 B) ✓ MINIMAL
  ├── file.config.js (587 B) ✓ MINIMAL
  ├── message.config.js (447 B) ✓ MINIMAL
  └── response.config.js (469 B) ✓ MINIMAL

src/config/system/
  ├── permission-system.js (1.6 KB) ✗ DUPLICATE
  ├── role-action-matrix.js (1.7 KB) ✗ DUPLICATE
  ├── lifecycle-stages.js (1.6 KB) ✗ DUPLICATE
  ├── rfi-state-machine.js (1.5 KB) ✗ HARDCODED
  ├── business-rules.js (1.9 KB) ✗ SCATTERED
  ├── feature-toggles.js (1.1 KB) ✗ INCOMPLETE
  ├── permission-middleware.js (1.2 KB) ✗ DUPLICATE
  └── system-config-loader.js (1.9 KB) ✓ FRAMEWORK

TOTAL: ~40 KB config files with duplication + scattered hardcoded values
```

### AFTER (Target State)
```
src/config/
  ├── master-config.yml (1.2 KB) ← SINGLE SOURCE OF TRUTH
  ├── system/
  │   ├── config-generator-engine.js (1.8 KB) ← GENERATES EVERYTHING
  │   ├── domain-loader.js (500 B) ← LOADS BY DOMAIN
  │   └── system-config-loader.js (REFACTORED to use generator)
  └── entities/
      └── [DELETED: 14 entity config files]
          ↓
      [GENERATED AT RUNTIME from master-config.yml]

Entity specs no longer files → generated on-demand from config

TOTAL: ~3.5 KB config files + runtime generation = 92% reduction
```

---

## PART 4: Implementation Stages

### STAGE 1: Write Master Config (4 hours)
1. Create `master-config.yml` from audit findings
2. Define all roles, permissions, workflows, thresholds
3. Define all entities with templates
4. Define all automations, notifications, features

### STAGE 2: Write Config Generator (6 hours)
1. Implement `ConfigGeneratorEngine`
2. Add entity spec generator
3. Add permission matrix resolver
4. Add notification handler generator
5. Add automation job generator

### STAGE 3: Refactor System Loader (3 hours)
1. Update `system-config-loader.js` to use `ConfigGeneratorEngine`
2. Load `master-config.yml` at startup
3. Generate all entity specs on demand
4. Cache generated specs

### STAGE 4: Delete Boilerplate (2 hours)
1. Delete 14 entity config files (now generated)
2. Delete 7 system config files (now in master-config.yml)
3. Update all imports to use generator
4. Build and test

### STAGE 5: Domain Routing (4 hours)
1. Create `domain-loader.js` that filters entities/features by domain
2. Update API routes to accept `?domain=friday` or `?domain=mwr`
3. Update UI to show only domain-specific features
4. Test Friday vs MWR views

### STAGE 6: Offline Strategy Cleanup (2 hours)
1. Remove offline caching code (cache-strategy-factory.js, etc.)
2. Simplify to single in-memory cache
3. Remove offline banner logic
4. Remove service worker offline support

**Total: ~21 hours (parallel: 12-15 hours)**

---

## PART 5: Key Benefits

### Code Metrics
- **Entity config files:** 14 → 0 (generated at runtime)
- **System config files:** 7 → 1 (master-config.yml)
- **Total config code:** 40 KB → 3.5 KB
- **Code reduction:** 91%

### Configuration Metrics
- **Single source of truth:** All roles, workflows, thresholds in one file
- **Change impact:** 1 threshold change → auto-applies to all jobs/notifications
- **Permission change:** 1 permission matrix → auto-applies to all 14+ entities
- **New entity:** 3 lines in master-config.yml (was 100+ lines in entity file)

### Maintainability
- **Friday vs MWR:** Toggled by domain flag, same code path
- **No offline complexity:** Removed 200+ lines of caching strategy code
- **Single codebase:** All logic config-driven, no hardcoded special cases
- **Auditability:** Every rule visible in one file, easy to review

### Testing
- **No mocking offline/cache states:** Simplifies unit tests
- **Config validation:** Validate master-config.yml once at startup
- **Feature flag testing:** Test features on/off from config
- **Domain testing:** Test Friday and MWR by loading different domain configs

---

## PART 6: Next Steps

**Clarifications needed:**

1. **Master Config Format:** Should it be:
   - YAML (readable, easy to edit) ← RECOMMENDED
   - JSON (strict, parse error messages)
   - TypeScript types (strict, IDE autocomplete)

2. **Database-Driven Config:** Should we support loading master-config from database (for SaaS)?
   - NO (single file, simple) ← RECOMMENDED
   - YES (database table, multi-tenant)

3. **Domain Switching:** Should a user session be tied to one domain?
   - NO (user can switch Friday ↔ MWR) ← RECOMMENDED
   - YES (login once per domain)

4. **Config Validation:** Should we validate master-config at:
   - Startup only (fail to start if invalid) ← RECOMMENDED
   - Hot reload (validate on every request)

**Ready to execute once you confirm above and give go-ahead for all 6 stages in parallel.**
