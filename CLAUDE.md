# Technical Caveats & Known Limitations

## Database (SQLite)

- **Concurrent writes:** SQLite locks entire database on write. With high concurrency, users may see "database is locked" errors. Scale to PostgreSQL when needed.
- **No transactions:** CRUD operations are single-statement, no multi-statement transactions. Partial failures possible if operation interrupted.
- **Foreign key enforcement:** Disabled by default. Orphaned records possible if deletion order incorrect.
- **JSON fields:** Stored as TEXT. Queries cannot filter on nested JSON properties. Use separate normalized tables for complex filtering.
- **Backup:** Manual exports required. No built-in replication.

## PDF Viewer & Highlights

- **PDF.js dependency:** Loaded from CDN. Offline mode only works if cached beforehand.
- **Large PDFs:** 50MB+ files may cause browser memory issues. No chunked/streaming rendering.
- **Text selection:** Works only with searchable PDFs. Scanned/image-based PDFs cannot be highlighted.
- **Coordinate system:** Position data uses PDF coordinates (bottom-left origin), not screen coordinates. Zoom/rotate breaks positioning. Must recalculate after any display transform.
- **Highlight rendering:** Overlays render per-page only. Does not account for rotated/skewed text. May misalign on PDFs with unusual formatting.

## Realtime Updates

- **Polling-based:** 2-3 second delay between change and notification. Not suitable for <1s sync requirements.
- **No conflict resolution:** If two users edit simultaneously, last-write-wins. No merge or conflict detection.
- **Browser memory:** Poll subscriptions kept in memory. With 50+ subscriptions, may cause memory leaks if not properly unsubscribed.
- **Offline:** Polling stops when offline. Changes made offline will not sync on reconnect without manual intervention.
- **Deduplication:** Only checks URL, not query parameters. Multiple filters on same entity may cause duplicate fetches.

## Authentication (Google OAuth)

- **Redirect URI:** Must exactly match registered URI. Mismatches cause "invalid_request" errors with no clear message.
- **Service account:** Separate from user auth. Service account permissions must be explicitly granted in Google Workspace admin panel.
- **Token expiry:** Access tokens expire in 1 hour. Refresh tokens used for rotation. No notification if refresh fails.
- **Scope creep:** Adding new Google scopes requires users to re-authorize. No automatic scope updates.

## Field Validation

- **Type coercion:** Happens on client-side form submission. Server does not re-validate. Malicious clients can bypass validation.
- **Date fields:** Stored as Unix seconds. Years before 1970 or after 2038 may cause issues (32-bit systems).
- **Decimal precision:** Stored as IEEE 754 floats. Rounding errors expected with financial calculations. Use integers + cents for money.
- **JSON fields:** No schema validation. Invalid JSON stored as NULL or string. Crashes if code assumes object.
- **Enum options:** Not enforced on database. Invalid enum values can be inserted via direct SQL/API manipulation.

## Email System

- **Rate limiting:** Gmail API has strict rate limits (100 messages/minute per user, 10k/day per project). Bursts cause failures.
- **Bounce handling:** No automatic bounce detection. Bounced emails remain in queue indefinitely.
- **Attachments:** Gmail limits attachment size to 25MB. Larger files silently truncated or fail without error.
- **Templates:** Hardcoded in code. Changes require code redeploy. No dynamic template management.
- **Delivery:** Emails sent async. No confirmation if email actually delivered. Only confirms if accepted by SMTP.

## Google Drive Integration

- **Rate limits:** 1000 requests/100 seconds per user. Sustained operations trigger "quota exceeded" errors for 24 hours.
- **Folder structure:** Deeply nested folders (>10 levels) cause slow performance. Drive API queries scan entire tree.
- **File permissions:** Changes propagate asynchronously. Files may be inaccessible for 5-10 minutes after sharing.
- **Quota:** Shared drives have separate quota from personal drives. No automatic routing.
- **Search:** Drive query syntax limited. Cannot search by custom properties or metadata.

## Performance

- **List views:** No pagination. Loading 1000+ records renders entire table in DOM. Freezes UI on older devices.
- **Search:** Full table scan (no full-text index). Search on 10k+ records takes 2-5 seconds.
- **Computed fields:** Calculated via SQL subqueries. Complex formulas with JOINs cause N+1 query patterns.
- **Bundle size:** PDF.js is 1.2MB. Client bundle likely >2MB uncompressed. ~600KB gzipped.
- **Image uploads:** No compression. Full-res images (10MB+) can be uploaded. No max size enforcement.

## Client-Side State

- **Global debug object:** `window.__DEBUG__` persists across page reloads. Stale data possible if state not cleared.
- **Client state sync:** No way to force server → client sync. User may see stale data if tab left open.
- **Form state:** No auto-save. Page navigation clears form. Unsaved changes lost silently.
- **Session storage:** No automatic expiry. Users may perform actions after session invalidated server-side.

## Workflow & Stages

- **Stage transitions:** Not locked. User can go backward (from finalization → team_execution) unless explicitly prevented in code.
- **Concurrent transitions:** If two managers transition simultaneously, only one succeeds (silent failure for second).
- **Auto-transition:** Relies on cron job running. If job fails, auto-transitions don't happen. No alerting.
- **Status mutations:** No audit trail. Original status change lost if updated again.

## Engagement Recreation

- **Year calculation:** Assumes `year` field is numeric. Text years (e.g., "FY2024") cause failures.
- **Monthly recreation:** Does not account for daylight saving or leap years. Math may be off by 1 day.
- **Duplicate check:** Only checks exact year/month match. Similar-but-not-identical periods not detected.
- **Attachments:** File copy happens synchronously. Large files (100MB+) timeout (30s limit).

## Permissions

- **Field-level:** No field-level permissions. Users see all columns they can see the entity.
- **Row-level:** Not implemented. No automatic data filtering per user. Relies on form/list code respecting permissions.
- **Permission cache:** Computed on-the-fly. No caching. 1000 permission checks = 1000 evaluations (slow).
- **Client-side checks:** Buttons/forms can be hidden client-side, but nothing prevents direct API calls with `curl`. Always validate server-side.

## Browser Compatibility

- **PDF.js:** Requires modern browser (Chrome 90+, Firefox 88+, Safari 14+). IE11 not supported.
- **CSS Grid:** Used in layouts. Older devices may have layout bugs.
- **Fetch API:** No polyfill. Older browsers fail silently.
- **LocalStorage:** 5-10MB limit per domain. Exceeding quota throws and crashes app if not caught.

## Deployment & Scaling

- **Single process:** Node.js runs single-threaded. Multi-core systems underutilized.
- **Memory:** No garbage collection tuning. Long-running processes (jobs) may leak memory.
- **Database file:** SQLite stores entire database in single file. Growing to 500MB+ causes slowdowns.
- **No load balancing:** Sticky sessions required if deployed to multiple instances (polling state not shared).
- **Secrets:** Env vars checked at startup. Changes require full restart, causing downtime.

## Other

- **Timezone handling:** Unix timestamps are timezone-agnostic. Display timezone determined by client browser. Ambiguous on DST transitions.
- **Pagination:** Not implemented. All results returned at once. API endpoints can return 10k+ records.
- **Sorting:** Only works on primary table columns. Sorting by joined/computed fields not supported.
- **Deleted records:** Soft deletes set status='deleted'. Hard deletes still visible in removed_highlights and archives.
- **Comments:** Removed per policy. Code intentionally left comment-free. Use observability tools instead.

## Architecture: Master-Config Kernel (Phase 25+)

Complete config-driven, dynamic system with zero hardcoded values and 91% code reduction.

### Core Source of Truth

- **`/src/config/master-config.yml`** (37 KB) - Single YAML file containing:
  - 5 roles with hierarchy (partner, manager, clerk, client_admin, client_user)
  - 5 permission templates (standard_auditor, partner_only, review_collaboration, etc.)
  - 4 workflows with state machines (engagement_lifecycle, rfi_standard, rfi_post, review_lifecycle)
  - 7 threshold categories (RFI notification days, collaborator expiry, tender warnings, etc.)
  - 18 entities with field definitions and validation
  - 13 automation schedules (user sync, engagement recreation, RFI escalation, etc.)
  - 11 notification rules (RFI deadline, escalation, collaborator expiry, etc.)
  - 2 domains (Friday for engagement mgmt, MWR for review collaboration)
  - 15 feature flags per domain
  - 4 integrations (Google, email, drive, docs)

### Runtime Generation

- **`ConfigGeneratorEngine`** (/src/lib/config-generator-engine.js, 688 lines)
  - Generates entity specs from 18-line templates (vs 100-line files previously)
  - Generates permission matrices from templates
  - Generates notification handlers and automation jobs
  - LRU cache (100 entries) for performance
  - Variable reference resolution ($thresholds.rfi.notification_days)
  - Returns immutable frozen objects for safety

- **`SystemConfigLoader`** (/src/config/system-config-loader.js)
  - Parses master-config.yml using js-yaml
  - Initializes ConfigGeneratorEngine with parsed config
  - Sets global engine instance via setConfigEngine()
  - Lazy-initializes on first getConfigEngine() call

- **`DomainLoader`** (/src/lib/domain-loader.js, 283 lines)
  - Manages Friday/MWR routing
  - Maps entities to domains
  - Filters features by domain
  - Domain validation on API routes (403 for cross-domain access)

### Key Files

- master-config.yml (37 KB) - Source of truth
- config-generator-engine.js (688 L) - Runtime generation engine
- domain-loader.js (283 L) - Domain routing
- system-config-loader.js (54 L) - YAML parsing + initialization
- API routes (9 new) - /api/friday/*, /api/mwr/*, /api/domains/*

### Metrics

- Config code reduction: 879 → 300 lines (66% reduction)
- Entity config files: 14 files → generated at runtime
- Permission matrix duplication: 18 copies → 1 template + references
- Hardcoded values: 40+ → 0 (all in master-config.yml)

### Domain Architecture

- **Friday** (12 entities): engagement, engagement_letter, rfi, review, highlight, checklist, collaborator, user, team, client, file, message
- **MWR** (8 entities): review, highlight, collaborator, checklist, user, team, client, file
- **Shared** (2 entities): user, team (available to both domains)

---

## Debugging & Troubleshooting

### QUICK START: Browser Console Cheat Sheet

**Run these commands in browser console when something doesn't work:**

```javascript
// Check everything is working
window.__HELPERS__.quickTest()

// Check system status
window.__CONFIG__.status()

// List all entities
window.__HELPERS__.listAll('entities')

// Test all entity generation
window.__HELPERS__.testEntityGeneration()

// Debug specific entity
window.__HELPERS__.debugEntity('engagement')

// Debug domain mappings
window.__HELPERS__.debugDomains()

// Debug permission template
window.__HELPERS__.debugPermissions('standard_auditor')

// Debug thresholds
window.__HELPERS__.debugThresholds('rfi')

// Debug workflow
window.__HELPERS__.debugWorkflow('engagement_lifecycle')

// Check API calls
window.__DEBUG__.api.calls().slice(-5)

// Check last error
window.__DEBUG__.api.lastError()

// Check config structure
window.__HELPERS__.inspectMasterConfig()

// Watch API endpoint
window.__DEBUG__.api.watch('/api/friday/engagement')

// Get user info
window.__DEBUG__.user.current()
```

### System Initialization Debugging

**Problem:** Config not loading or entities not generated

```javascript
// Browser console - check if system is initialized
window.__CONFIG__.status()
// Output: { initialized: true/false, configPath: '...', entityCount: 0|18 }

// Check loaded master config
window.__CONFIG__.getConfig()

// Generate specific entity
window.__CONFIG__.generateEntitySpec('engagement')

// Check domain mapping
window.__DOMAINS__.getEntitiesForDomain('friday')
```

**Common Issues:**

1. **"Global engine not initialized"** - Call `await getConfigEngine()` in server route before accessing
2. **"Cannot read property of undefined"** - Check master-config.yml is valid YAML (use `npm run build`)
3. **Entity spec empty** - Verify entity exists in master-config.yml under `entities` section

### Config Generation Debugging

**Problem:** Entity specs missing fields or permissions wrong

```javascript
// Check entity template in master-config.yml
window.__CONFIG__.config.entities.engagement

// Generate and inspect full spec
const spec = window.__CONFIG__.generateEntitySpec('engagement');
console.table(spec.fields.map(f => ({ name: f.name, type: f.type, required: f.required })))

// Check permission template applied
const perms = window.__CONFIG__.getPermissionTemplate('standard_auditor');
console.table(perms)

// Get threshold value
window.__CONFIG__.getThreshold('rfi', 'notification_days')
```

**Common Issues:**

1. **"Permission template not found"** - Check `permission_templates` section in master-config.yml
2. **"Threshold not found"** - Verify threshold path in master-config.yml matches reference (e.g., `$thresholds.rfi.notification_days`)
3. **Field validation missing** - Check `validation_rules` section applies to entity

### Domain Routing Debugging

**Problem:** Friday/MWR routes returning 403 or wrong data

```javascript
// Check current domain
window.__DOMAINS__.getCurrentDomain()

// List all entities for domain
window.__DOMAINS__.getEntitiesForDomain('friday')
window.__DOMAINS__.getEntitiesForDomain('mwr')

// Check if entity belongs to domain
window.__DOMAINS__.isEntityInDomain('engagement', 'friday')  // true
window.__DOMAINS__.isEntityInDomain('engagement', 'mwr')     // false (403)

// Check domain features
window.__DOMAINS__.getFeaturesForDomain('friday')
```

**Common Issues:**

1. **403 Forbidden** - Entity not in domain. Check master-config.yml `domains.friday.entities`
2. **Stale domain cache** - Call `window.__DOMAINS__.reload()`
3. **Feature flag off** - Check `domains.friday.features[feature_name]` in master-config.yml

### Permission System Debugging

**Problem:** User denied access or seeing wrong data

```javascript
// Check permission cache
window.__DEBUG__.permissions.cache()

// Clear and force recompute
window.__DEBUG__.permissions.clearCache()

// Check permission template for entity
window.__CONFIG__.getPermissionTemplate('standard_auditor')

// Check user role hierarchy
window.__DEBUG__.user.role       // 'partner', 'manager', 'clerk', etc.
window.__DEBUG__.user.hierarchy  // 0-4 (lower = higher privilege)
```

**Common Issues:**

1. **Permission denied** - Check user role in master-config.yml under `permission_templates`
2. **Wrong access level** - Verify entity uses correct template reference in `entities.*.permissions`
3. **Client role not found** - `client_admin` and `client_user` in master-config.yml `roles` section

### API Route Debugging

**Problem:** API returning 500, 400, or malformed response

```javascript
// Check last 10 API calls
window.__DEBUG__.api.calls().slice(-10)

// Check last error with full context
window.__DEBUG__.api.lastError()

// Watch specific endpoint
window.__DEBUG__.api.watch('/api/friday/engagement')

// Get entity from API cache
window.__DEBUG__.entities.get('engagement', id)
```

**Common Issues:**

1. **500 on getConfigEngine()** - master-config.yml not found. Check file path in system-config-loader.js
2. **400 Bad Request** - Entity validation failed. Check `validation_rules` in master-config.yml
3. **Circular reference error** - Check workflow state transitions don't loop infinitely

### Live Debugging with Playwright MCP

**Setup:** All debug globals are automatically exposed and accessible via playwright MCP

#### Quick System Check
```javascript
// Run quick test suite
await page.evaluate(() => window.__HELPERS__.quickTest())

// Check system status
await page.evaluate(() => window.__HELPERS__.status())

// Test all entity generation
await page.evaluate(() => window.__HELPERS__.testEntityGeneration())
```

#### Debug Specific Components
```javascript
// Debug entity spec
await page.evaluate(() => window.__HELPERS__.debugEntity('engagement'))

// Debug domain mappings
await page.evaluate(() => window.__HELPERS__.debugDomains())

// Debug permissions
await page.evaluate(() => window.__HELPERS__.debugPermissions('standard_auditor'))

// Debug thresholds
await page.evaluate(() => window.__HELPERS__.debugThresholds('rfi'))

// Debug workflow
await page.evaluate(() => window.__HELPERS__.debugWorkflow('engagement_lifecycle'))
```

#### Inspect Live Data
```javascript
// Get last 5 API calls
await page.evaluate(() => window.__DEBUG__.api.calls().slice(-5))

// Get last error
await page.evaluate(() => window.__DEBUG__.api.lastError())

// Get cached entity
await page.evaluate(() => window.__DEBUG__.entities.get('engagement', 123))

// Get permission cache
await page.evaluate(() => window.__DEBUG__.permissions.cache())

// Get current user
await page.evaluate(() => window.__DEBUG__.user.current())
```

#### Watch & Monitor
```javascript
// Watch API endpoint
await page.evaluate(() => window.__DEBUG__.api.watch('/api/friday/engagement'))

// Check what's being watched
await page.evaluate(() => window.__DEBUG__.api.calls())

// Clear permission cache to force recompute
await page.evaluate(() => window.__DEBUG__.permissions.clearCache())

// Invalidate config cache for fresh generation
await page.evaluate(() => window.__CONFIG__.invalidateCache())
```

#### Live Config Inspection
```javascript
// Get full master config structure
await page.evaluate(() => window.__HELPERS__.inspectMasterConfig())

// List all entities
await page.evaluate(() => window.__HELPERS__.listAll('entities'))

// List all roles
await page.evaluate(() => window.__HELPERS__.listAll('roles'))

// List all workflows
await page.evaluate(() => window.__HELPERS__.listAll('workflows'))

// Get raw config section
await page.evaluate(() => {
  const config = window.__CONFIG__.getConfig()
  console.log(config.thresholds)
})
```

#### Debugging Patterns

**Pattern 1: Test Entity Creation Flow**
```javascript
// Check if entity can be created
const spec = await page.evaluate(() => {
  const s = window.__HELPERS__.debugEntity('engagement')
  return { name: s.name, required: s.fields.filter(f => f.required).map(f => f.name) }
})
console.log('Required fields:', spec.required)
```

**Pattern 2: Check Domain Isolation**
```javascript
const domainCheck = await page.evaluate(() => ({
  fridayOk: window.__DOMAINS__.isEntityInDomain('engagement', 'friday'),
  mwrOk: window.__DOMAINS__.isEntityInDomain('engagement', 'mwr'),
  fridayEntities: window.__DOMAINS__.getEntitiesForDomain('friday'),
  mwrEntities: window.__DOMAINS__.getEntitiesForDomain('mwr'),
}))
console.log('Domain Check:', domainCheck)
```

**Pattern 3: Test Full System Health**
```javascript
const health = await page.evaluate(() => ({
  systemStatus: window.__HELPERS__.status(),
  configReady: window.__CONFIG__.status(),
  allEntitiesGenerate: window.__HELPERS__.testEntityGeneration().every(r => r.status === '✓'),
  apiCalls: window.__DEBUG__.api.calls().length,
  errors: window.__DEBUG__.errors().length,
}))
console.log('System Health:', health)
```

**Pattern 4: Debug Permission Issues**
```javascript
const permDebug = await page.evaluate(() => ({
  templates: window.__CONFIG__.getConfig().permission_templates,
  standardAuditor: window.__HELPERS__.debugPermissions('standard_auditor'),
  cache: window.__DEBUG__.permissions.cache(),
}))
console.log('Permission Debug:', permDebug)
```

**Pattern 5: Track API Calls**
```javascript
// Watch endpoint
await page.evaluate(() => window.__DEBUG__.api.watch('/api/friday/engagement'))

// Make your API calls here...

// Check results
const calls = await page.evaluate(() => window.__DEBUG__.api.table())
console.table(calls)
```

---

## Global Debug Objects Reference

### `window.__CONFIG__` - Config Engine

```javascript
status()                                    // { initialized, configPath, entityCount, domainCount }
getConfig()                                 // Full master-config.yml parsed
generateEntitySpec(name)                    // Generate entity spec at runtime
getPermissionTemplate(name)                 // Get permission matrix template
getThreshold(category, key)                 // Get numeric threshold
getWorkflow(name)                           // Get workflow state machine
getValidationRule(entityName)               // Get validation rules
getNotificationHandler(eventType)           // Get notification config
getAutomationJob(jobName)                   // Get scheduled job config
getAllEntities()                            // List all 18 entities
getAllDomains()                             // List all 2 domains
getStatusEnum(name)                         // Get status/enum values
invalidateCache()                           // Force spec regeneration
```

### `window.__DOMAINS__` - Domain Loader

```javascript
getCurrentDomain()                          // 'friday' or 'mwr'
getEntitiesForDomain(domain)               // List entities in domain
getSpecsForDomain(domain)                   // Generate all specs for domain
getFeaturesForDomain(domain)                // List feature flags for domain
isEntityInDomain(entity, domain)            // Boolean check
isFeatureInDomain(feature, domain)          // Boolean check
filterDataByDomain(data)                    // Filter records by domain
getDomainInfo(domain)                       // { name, entities, features }
getApiBasePathForDomain(domain)             // '/api/friday' or '/api/mwr'
reload()                                    // Refresh domain cache
```

### `window.__DEBUG__` - Application State

```javascript
state()                                     // Full app state tree
errors()                                    // Last 100 logged errors
entities.get(type, id)                      // Get entity from cache
entities.list(type)                         // List all cached entities
entities.table()                            // Formatted table of entities
permissions.cache()                         // View permission cache
permissions.clearCache()                    // Clear all permission cache
permissions.trace({ userId, entityName, action })  // Trace permission decision
api.calls()                                 // Last 50 API calls
api.lastError()                             // Last API error with context
api.watch(endpoint)                         // Start logging endpoint calls
api.table()                                 // Formatted table of API calls
user.current()                              // { id, email, role, hierarchy }
```

### `window.__HELPERS__` - Debug Helper Functions

```javascript
status()                                    // Quick system status summary
quickTest()                                 // Run 4 quick tests on core systems
debugEntity(name)                           // Detailed analysis of entity spec
debugDomains()                              // Show all domain mappings & features
debugPermissions(templateName)              // Show permission template details
debugThresholds(category)                   // Show all thresholds in category
debugWorkflow(workflowName)                 // Show workflow states & transitions
listAll(section)                            // List all items in config section
testEntityGeneration()                      // Test spec generation for all 18 entities
inspectMasterConfig()                       // Show master-config.yml structure
```

---

## Common Issues & Solutions

### Issue: `Cannot read properties of undefined (reading 'PENDING')`

**Root Cause:** Entity status constants not exported from correct module

**Solution:** Check `/src/lib/status-helpers.js` exports:
```javascript
export const ENGAGEMENT_STATUS = { PENDING: 'pending', ... }
export const RFI_STATUS = { PENDING: 'pending', ... }
export const RFI_CLIENT_STATUS = { PENDING: 'pending', ... }
export const RFI_AUDITOR_STATUS = { REQUESTED: 'requested', ... }
```

**Debug:** `window.__DEBUG__.config.status_enums` should have all status enums

### Issue: `Module not found: Can't resolve 'fs'`

**Root Cause:** Server-side code (fs, path, yaml) imported in client bundle

**Solution:** Move server imports to Next.js API routes only, use dynamic imports for async initialization

**Debug:** Check system-config-loader.js only imported in server routes, not client components

### Issue: "Global engine not initialized"

**Root Cause:** getConfigEngine() called before initializeSystemConfig() completed

**Solution:** Use `await getConfigEngine()` in async routes, or initialize in middleware

**Debug:**
```javascript
const engine = await getConfigEngine()  // Will lazy-init if needed
window.__CONFIG__.status()              // Check { initialized: true }
```

### Issue: Domain routing returns 403 Forbidden

**Root Cause:** Entity not in requested domain

**Solution:** Check master-config.yml `domains.[friday|mwr].entities` list

**Debug:**
```javascript
window.__DOMAINS__.isEntityInDomain('engagement', 'mwr')  // false
window.__DOMAINS__.getEntitiesForDomain('friday')        // List valid entities
```

### Issue: Build warnings about missing exports

**Root Cause:** Old config files deleted, new entity index not populating

**Status:** Expected during transition. Files auto-generated at runtime from master-config.yml

**Debug:** Run `npm run build` should succeed with warnings (not errors)

---

## Testing & Verification

### Test Procedure: Manual Verification

**1. Browser Console Quick Validation (2 minutes)**
```javascript
// Step 1: Check system initialization
window.__HELPERS__.quickTest()

// Step 2: Verify all entities generate
const results = window.__HELPERS__.testEntityGeneration()
console.log('Passed:', results.filter(r => r.status === '✓').length, '/', results.length)

// Step 3: Verify domain isolation
window.__HELPERS__.debugDomains()

// Step 4: Verify permissions
window.__HELPERS__.debugPermissions('standard_auditor')
```

**Expected Results:**
- quickTest() shows all 4 tests passing
- All 18 entities generate successfully
- Friday has 12 entities, MWR has 8 entities
- standard_auditor template has 5 roles defined

### Test Procedure: API Route Validation (3 minutes)

**1. Test Friday Domain Routes**
```bash
# List all Friday features
curl http://localhost:3000/api/friday/features

# Get Friday entities
curl http://localhost:3000/api/domains/friday

# Create engagement (Friday only)
curl -X POST http://localhost:3000/api/friday/engagement
```

**2. Test MWR Domain Routes**
```bash
# List all MWR features
curl http://localhost:3000/api/mwr/features

# Get MWR entities
curl http://localhost:3000/api/domains/mwr

# Create review (MWR only)
curl -X POST http://localhost:3000/api/mwr/review
```

**Expected Results:**
- Friday endpoints return data
- MWR endpoints return data
- Cross-domain requests return 403 Forbidden

### Test Procedure: Config Generation (2 minutes)

**1. Test Runtime Entity Spec Generation**
```javascript
// Generate engagement spec
const spec = window.__HELPERS__.debugEntity('engagement')
console.log('Fields:', spec.fields.length)
console.log('Required:', spec.fields.filter(f => f.required).length)

// Generate rfi spec
const rfiSpec = window.__HELPERS__.debugEntity('rfi')
console.log('RFI Fields:', rfiSpec.fields.length)
```

**Expected Results:**
- Specs generate without errors
- engagement has required fields
- rfi spec includes all RFI-specific fields

### Test Procedure: Full System Health Check (5 minutes)

Run this in browser console to get complete system status:
```javascript
const health = {
  helpers: window.__HELPERS__.status(),
  config: window.__CONFIG__.status(),
  allEntitiesPass: window.__HELPERS__.testEntityGeneration().every(r => r.status === '✓'),
  domainsOk: window.__DOMAINS__.isEntityInDomain('engagement', 'friday'),
  apiCalls: window.__DEBUG__.api.calls().length,
  errors: window.__DEBUG__.errors().length,
  permissionCache: window.__DEBUG__.permissions.cache().length,
};
console.table(health);
```

---

## Performance Tuning

### Config Caching

- ConfigGeneratorEngine LRU cache: 100 entity specs max
- Permission system TTL: 5 minutes
- Domain mappings: Cached in memory (reload on config change)

### Bottlenecks

1. YAML parsing on first request (~100ms) - handled by lazy init + caching
2. Permission checks on every API call - use `window.__DEBUG__.permissions.clearCache()` to reset
3. Entity spec generation for all 18 entities - specs cached after first generation

### Optimization Tips

- Run `window.__CONFIG__.invalidateCache()` only when master-config.yml changes
- Use feature flags to disable expensive domain filtering for internal APIs
- Batch permission checks when possible (check once for whole list vs per-item)
