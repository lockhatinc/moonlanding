# Implementation Guide: FRIDAY & MWR Business Rules

This guide outlines how to implement the business rules configurations into your engine layer.

## Configuration Files Overview

### Entity Specs (`/config/entities/`)
- **engagement.config.js** - Engagement lifecycle with letter/team management
- **engagement-letter.config.js** - Letter workflow status tracking
- **review.config.js** - Review workflow with templates/collaborators/flags
- **rfi.config.js** - RFI with post-RFI workflow and client access
- **highlight.config.js** - Highlights with color mapping and partner notes
- **collaborator.config.js** - Permanent/temporary review access
- **template.config.js** - Review templates with default checklists
- **flag.config.js** - Review flags (query, issue, missed deadline, etc.)
- **notification.config.js** - All notifications (pending → sent/failed)
- **removed-highlight.config.js** - Audit trail for deleted highlights
- **recreation-log.config.js** - Engagement recreation tracking

### Configuration Files (`/config/`)
- **business-rules.js** - Business logic gates and CASL functions
- **casl-matrix.js** - Role-based permission matrix
- **email-templates.js** - Email trigger configurations
- **theme-config.js** - Color mappings (70+)
- **jobs-config.js** - Job schedules and configs
- **jobs.js** - Job implementations

---

## Critical Engine-Layer Implementations

### 1. ENGAGEMENT CLOSEOUT VALIDATION (CRITICAL)

**Location**: `query-engine.js` - `update()` method

```javascript
// Before allowing stage transition to close_out:
if (newValues.stage === 'close_out') {
  // Check: Only partner can transition
  if (user.role !== 'partner') {
    throw new Error('Only Partner can transition to CloseOut');
  }

  // Check: Must be from finalization stage
  const engagement = get('engagement', id);
  if (engagement.stage !== 'finalization') {
    throw new Error('Can only transition to CloseOut from Finalization');
  }

  // Check: Engagement Letter must be accepted OR Progress = 0%
  if (engagement.engagement_letter_id) {
    const letter = get('engagement_letter', engagement.engagement_letter_id);
    if (letter.status !== 'accepted') {
      // Allow bypass if progress = 0
      if (engagement.progress !== 0) {
        throw new Error('Engagement Letter must be Accepted (or Progress=0% for cancelled jobs)');
      }
    }
  } else if (engagement.progress !== 0) {
    throw new Error('No Engagement Letter found and Progress > 0%');
  }

  // Lock to read-only after transition
  Object.assign(newValues, {
    // Mark fields as read-only (application concern)
  });
}
```

---

### 2. RFI CLIENT VISIBILITY FILTER (CRITICAL)

**Location**: `query-engine.js` - `list()` method for RFI

```javascript
// When client user queries RFIs:
if (user.role === 'client') {
  const userClientIds = JSON.parse(user.client_access || '[]');
  const filtered = records.filter(rfi => {
    const rfiClientIds = JSON.parse(rfi.client_ids || '[]');
    return rfiClientIds.some(cid => userClientIds.includes(cid));
  });
  return filtered;
}
```

---

### 3. HIGHLIGHT IMMUTABILITY (CRITICAL)

**Location**: `query-engine.js` - `remove()` method for Highlight

```javascript
// Never hard-delete highlights
export function remove(entity, id) {
  if (entity === 'highlight') {
    // SOFT DELETE: Move to removed_highlights
    const highlight = get('highlight', id);
    const removedHighlight = {
      review_id: highlight.review_id,
      original_highlight_id: highlight.id,
      page_number: highlight.page_number,
      text: highlight.text,
      position_data: highlight.position_data,
      status: highlight.status,
      severity: highlight.severity,
      resolved_by_display: highlight.resolved_by_display,
      removed_by: userId, // current user
      removed_at: Math.floor(Date.now() / 1000),
      ...withAuditFields(),
    };
    create('removed_highlight', removedHighlight);
    // Do NOT hard-delete from database
    return { success: true, archived: true };
  }
  // Normal hard delete for other entities
  // ...
}
```

---

### 4. REVIEW CHECKLIST INHERITANCE (IMPORTANT)

**Location**: `hook-engine.js` - `review:create` hook

```javascript
// When review is created, inherit template checklists
hookEngine.on('review:create', async (review) => {
  if (!review.template_id) return;

  const template = get('template', review.template_id);
  if (!template) return;

  const defaultChecklists = JSON.parse(template.default_checklists || '[]');
  for (const checklist of defaultChecklists) {
    create('checklist', {
      review_id: review.id,
      ...checklist, // title, description, etc.
    });
  }

  const sections = JSON.parse(template.sections || '[]');
  if (sections.length > 0) {
    update('review', review.id, {
      sections: JSON.stringify(sections),
    });
  }
});
```

---

### 5. RFI DAYS OUTSTANDING (IMPORTANT)

**Location**: `query-engine.js` - Computed field for RFI

```javascript
// Spec already has:
// .computedField('days_outstanding', "SQL calculation")

// Engine should adjust at retrieval:
function getDaysOutstanding(rfi, engagement) {
  // If engagement in info_gathering, zero-out
  if (engagement?.stage === 'info_gathering') {
    return 0;
  }

  // Otherwise calculate: working_days(date_requested, date_resolved || today)
  return calculateWorkingDays(rfi.date_requested, rfi.date_resolved);
}
```

---

### 6. ENGAGEMENT RECREATION LOCK (IMPORTANT)

**Location**: `jobs.js` - Already implemented in createRecreationJob()

```javascript
// After recreating engagement, lock original:
await update('engagement', original_id, {
  repeat_interval: 'once', // Prevents infinite loops
});

// Reset new engagement RFIs:
const rfis = list('rfi', { engagement_id: new_id });
for (const rfi of rfis) {
  await update('rfi', rfi.id, {
    date_requested: null,
    date_resolved: null,
    status: 'waiting',
    client_status: 'pending',
    auditor_status: 'requested',
  });
}
```

---

### 7. TENDER DEADLINE TRACKING (IMPORTANT)

**Location**: `jobs.js` - `daily_tender_missed` job

```javascript
// Check tender reviews and apply "missed" flag if deadline passed:
const now = Math.floor(Date.now() / 1000);
for (const review of list('review', { is_tender: true, status: 'open' })) {
  if (review.deadline && review.deadline < now) {
    const flags = JSON.parse(review.tender_flags || '[]');
    if (!flags.includes('missed')) {
      await update('review', review.id, {
        tender_flags: JSON.stringify([...flags, 'missed']),
      });
      // Send email to partners
      await queueEmail('tender_missed', { review });
    }
  }
}
```

---

### 8. COLLABORATOR EXPIRY (IMPORTANT)

**Location**: `jobs.js` - `daily_temp_access_cleanup` job

```javascript
// Remove expired temporary collaborators:
const now = Math.floor(Date.now() / 1000);
for (const collab of list('collaborator', { type: 'temporary' })) {
  if (collab.expires_at && collab.expires_at < now) {
    remove('collaborator', collab.id);
    // No email notification (automatic removal)
  }
}
```

---

## Permission Enforcement Points

### At Query Layer (`query-engine.js`)
- ✅ RFI client visibility filter
- ✅ Row-level access (engagement_team, review_team, etc.)
- ✅ Field-level permissions (view/edit by role)

### At Update Layer (`query-engine.js` update())
- ✅ Stage transition validation
- ✅ CloseOut gate checks
- ✅ Tender deadline field restrictions (Partner-only)

### At Deletion Layer (`query-engine.js` remove())
- ✅ Highlight soft-delete to removed_highlights
- ✅ Collaborator removal (Partner-only)
- ✅ Attachment deletion (Partner-only)

### At Creation Layer (`hook-engine.js`)
- ✅ Review checklist inheritance from template
- ✅ Notification creation on lifecycle events
- ✅ Engagement letter placeholder on creation

---

## Email Notification Triggers

All email templates configured in `/config/email-templates.js`:

### Engagement Workflow
- `engagement_created` → assigned_to
- `engagement_status_changed` → assigned_to
- `letter_status_changed` → partner

### RFI Deadlines
- `rfi_deadline` → assigned_users (at 7, 3, 1, 0 days)
- Trigger: `daily_rfi_notifications` job

### Review Workflow
- `review_created` → reviewer_id
- `review_status_changed` → reviewer_id
- `tender_deadline_7days` → assigned_to
- `tender_deadline_today` → assigned_to
- Trigger: `daily_tender_notifications` job

### Collaborator Management
- `collaborator_added` → new user
- `collaborator_removed` → (not sent, automatic expiry)
- Trigger: On event

### Flags & Issues
- `flag_created` → assigned_to
- `flag_status_changed` → assigned_to
- Trigger: On event

### Weekly Reports
- `weekly_checklist_pdf` → all partners (Monday 8 AM)
- `weekly_client_emails` → client admins + individual users (Monday 9 AM)
- Trigger: `weekly_client_emails` job

---

## Testing Checklist

### Engagement Lifecycle
- [ ] Auto-transition info_gathering → commencement on commencement_date
- [ ] Cannot transition to close_out without Partner role
- [ ] Cannot transition to close_out without accepted letter OR 0% progress
- [ ] CloseOut becomes read-only after transition
- [ ] Clerk can approve stage transitions if clerksCanApprove=true

### RFI Management
- [ ] Days outstanding calculated correctly
- [ ] Days outstanding = 0 when engagement in info_gathering
- [ ] Client cannot see RFIs not in their assigned_users
- [ ] Post-RFI workflow distinct from standard RFIs
- [ ] RFI dates reset on engagement recreation

### Review & MWR
- [ ] Checklists inherited from template on review creation
- [ ] Highlights cannot be hard-deleted (moved to removed_highlights)
- [ ] Collaborators with 24h expiry removed automatically
- [ ] Tender reviews with missed deadlines get "missed" flag
- [ ] Partner notes rendered with red color (#FF4141)

### Permissions
- [ ] Partner can delete attachments, others cannot
- [ ] Partner can remove checklists, others cannot
- [ ] Clerk cannot transition stages (unless clerksCanApprove)
- [ ] Client can only rate at finalization stage
- [ ] Only Partner can manage tender deadline

### Automation
- [ ] Yearly recreation runs Jan 1
- [ ] Monthly recreation runs 1st of month
- [ ] Original engagement locked to 'once' after recreation
- [ ] RFI deadlines send notifications at 7/3/1/0 days
- [ ] Weekly reports sent Monday morning
- [ ] Temporary collaborators removed after 24h

---

## Known Limitations (from CLAUDE.md)

1. **Concurrent writes**: SQLite locks entire DB. Scale to PostgreSQL if needed.
2. **Recreation file copy**: Synchronous, 30s timeout for 100MB+ files.
3. **Days outstanding**: Uses raw date math, may be off by 1 day for DST.
4. **Collaborator email**: Not sent on automatic expiry (by design).
5. **Highlight coordinates**: PDF zoom/rotate breaks positioning (must recalculate).

---

## Configuration Usage Pattern

All business logic is **configuration-driven**:

```javascript
// Engine reads from specs:
const spec = allSpecs.engagement;

// Access field config:
spec.fields.stage.options // engagement_stage enum options
spec.fieldPermissions.stage.edit // who can change stage
spec.transitions // allowed stage transitions
spec.onLifecycle // what to do on create/update

// Access business rules:
import { BUSINESS_RULES, CASL_GATES } from '@/config/business-rules';
BUSINESS_RULES.engagement.closeOutValidation
CASL_GATES.canTransitionEngagementToCloseOut(user, engagement, letter)

// Access permissions:
import { CASL_MATRIX } from '@/config/casl-matrix';
CASL_MATRIX.engagement.stage_transition // role-based rules
```

This architecture ensures:
- ✅ Changes to business logic only require config updates
- ✅ No hardcoding of rules in application code
- ✅ Easy to audit and trace business requirements
- ✅ Single source of truth for all business logic
