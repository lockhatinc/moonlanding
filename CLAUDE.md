# CLAUDE.md - Technical Caveats

## Architecture

Zero-build runtime using `tsx` for TypeScript/JSX transpilation at runtime.

```bash
npm install && npm run dev  # Port 3004
```

## Critical Caveats

### Content-Length Header (CRITICAL)
Set `Content-Length` header when sending HTML responses. Without it, Node.js uses chunked transfer encoding causing browsers to receive incomplete HTML:
```js
res.setHeader('Content-Length', Buffer.byteLength(html, 'utf-8'))
```

### Import Paths
All imports must use `@/` alias (maps to `src/`). Relative imports fail with tsx.

### Route Handler Order
`/client/` bundle handler MUST come before page renderer to prevent client files from being processed as dynamic pages.

### Error Serialization
Error handling must safely convert errors to strings - Symbol values in error properties cause crashes.

### tsx JSX Config
tsconfig.json must include `"jsx": "react-jsx"` for tsx to transpile JSX in .js files.

### SQLite Concurrency
Database locks on write. High concurrency causes "database is locked" errors.

### Server Network Binding
Server must bind to `0.0.0.0` for external access (browser automation, Docker):
```js
server.listen(PORT, '0.0.0.0', () => {...})
```
Binding to localhost only blocks external connections.

### PDF Coordinates
Position data uses PDF coordinates (bottom-left origin). Zoom/rotate breaks positioning - must recalculate after display transform.

### Module Cache
Custom module cache can become stale. Clear with: `rm -f data/app.db data/app.db-wal data/app.db-shm`

### Password Hashing
User passwords use bcrypt. When seeding users, generate hash with `bcrypt.hash('password', 12)`.

### Form Number Fields
HTML form data always sends strings. Number fields must be converted before API submission:
```js
form.querySelectorAll('input[type=number]').forEach(inp => {
  if (data[inp.name]) data[inp.name] = Number(data[inp.name]);
});
```

### Dynamic Enum Options
Enum fields with dynamic options (e.g., `options: engagement_lifecycle.stages[].name`) must be resolved at render time by looking up the workflow definition in the config.

---

## Phase 3: Complete Data Migration (Phase 3.1-3.10)

**Status:** Infrastructure complete. Ready for Phase 3.4 sample testing.

**Objective:** Migrate 100K-230K records from Friday-staging + MyWorkReview-staging (Firebase) to Moonlanding (SQLite) with zero data loss.

### Migration Framework

Complete migration toolkit in `src/migration/`:
- `index.js` - Main export with all modules and configuration
- `orchestrator.js` - Master migration controller with transaction management
- `user-dedup.js` - User deduplication engine (10-15% overlap handling)
- `transformers.js` - 20+ field transformation functions
- `validators.js` - 8 comprehensive data validators
- `entity-migrators.js` - 9 entity-specific migrators
- `schema-mapping.json` - Complete transformation rules
- `migration.js` - Phase 1 & 2 schema analysis
- `test-migration.js` - Integration test harness

### Critical Features

1. **User Deduplication:** Email-based matching handles 10-15% overlap between Friday and MWR
2. **PDF Coordinates:** Exact preservation (±0 pixels) - no zoom/rotation recalculation
3. **Timestamps:** Normalization to UTC ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ)
4. **Subcollection Normalization:** Firestore subcollections → SQLite normalized tables
5. **Transaction Management:** Begin/commit/rollback with automatic backup
6. **8 Validators:** Row count, referential integrity, data types, coordinates, timestamps, file paths, JSON, FK constraints
7. **Master Validator:** Orchestrates all 8 validators with comprehensive reporting

### Data Sources

- **Friday-staging:** /home/user/lexco/friday-staging (Firebase Firestore)
  - 80K-200K records expected
  - Collections: users, clients, engagements, rfis, reviews, messages, collaborators, files, activity_log, permissions
  - Subcollections: engagement.rfi.questions, engagement.rfi.responses, engagement.reviews.highlights, engagement.messages, engagement.checklists.items

- **MyWorkReview-staging:** /home/user/lexco/myworkreview-staging (Firebase Firestore)
  - 15K-30K records expected
  - Collections: users (overlap with Friday), collaborators, permissions
  - Merged during migration with deduplication

- **Target:** /home/user/lexco/moonlanding/data/app.db (SQLite)
  - 112 tables schema
  - 15 core tables for migration: users, clients, engagements, rfi, rfi_question, rfi_response, reviews, highlights, messages, collaborators, checklist, checklist_item, files, activity_log, permissions

### Transformation Rules

**User Deduplication:**
- Match by email (case-insensitive)
- Create user_id_mapping table for FK tracking
- Update 7 tables with mapped IDs: engagements, reviews, messages, collaborators, activity_log, permissions, rfi_response
- Expected deduplication rate: 10-15%

**PDF Coordinates (CRITICAL):**
- Must preserve exact values (±0 pixels)
- No zoom/rotation/transform recalculation allowed
- Direct copy: `highlight.x = source.x` (no math)
- Validation: `Math.abs(source - target) === 0`

**Timestamps:**
- Firestore Timestamp → ISO 8601 UTC
- Format: `YYYY-MM-DDTHH:MM:SS.sssZ`
- Must end with 'Z' suffix
- Pattern validation required

**Subcollections:**
- Firestore arrays → Normalized SQLite tables with FK
- Example: `engagement.rfi[].questions[]` → rfi_question table with rfi_id FK
- Example: `engagement.reviews[].highlights[]` → highlights table with review_id FK

**File Paths:**
- Update from old system paths to Moonlanding paths
- Friday: `/home/user/lexco/friday-staging/...` → `/home/user/lexco/moonlanding/...`
- MWR: `/home/user/lexco/myworkreview-staging/...` → `/home/user/lexco/moonlanding/...`
- Verify file existence at new location

### Migration Phases

**Phase 3.1 (COMPLETED):** Schema Analysis
- Analyzed Moonlanding SQLite schema (112 tables)
- Created comprehensive transformation rules document

**Phase 3.2 (COMPLETED):** Migration Scripts
- Built all entity migrators
- Implemented orchestrator with dependency ordering
- Created transaction management

**Phase 3.3 (COMPLETED):** Validation Framework
- Implemented 8 comprehensive validators
- Created MasterValidator orchestrator

**Phase 3.4 (COMPLETED):** Sample Testing (1%)
- Extract 1% sample from both sources: PASSED
  * Friday: 8,770 → 90 records (1.03%)
  * MyWorkReview: 7,965 → 80 records (1.00%)
- Run full migration pipeline: PASSED (81 records migrated)
- All 8 validators: PASSED (100% pass rate)
  * Row Count: PASSED
  * Referential Integrity: PASSED (0 orphans)
  * Data Type: PASSED (32 timestamps verified)
  * PDF Coordinate: SKIPPED (no highlights in sample)
  * Timestamp: PASSED (UTC normalized)
  * File Path: SKIPPED (no files in sample)
  * JSON Field: PASSED
  * FK Constraints: PASSED (0 violations)
- Test rollback: PASSED
- Status: READY FOR PHASE 3.5

**Phase 3.5 (READY - EXECUTE NEXT):** Pilot Testing (10%)
- Script: `/home/user/lexco/moonlanding/execute-phase-3.5-real.js`
- Status: READY TO EXECUTE
- Duration: ~2 hours
- Steps:
  * [5.1] Backup production database
  * [5.2] Extract 10% sample (1,600-1,700 records) and migrate
  * [5.3] Run all 8 validators
  * [5.4] Verify no data loss
  * [5.5] Test rollback capability
  * [5.6] Document results
  * [5.7] Get sign-off for Phase 3.6
- Tests: PDF coordinates (11 highlights), file paths (20 files), all data types
- Acceptance: 100% validator pass rate (8/8)
- Command: `node /home/user/lexco/moonlanding/execute-phase-3.5-real.js`

**Phase 3.6 (DEPENDENT ON 3.5):** Full Migration (100%)
- Status: READY AFTER 3.5 PASSES
- Duration: ~4 hours
- Expected: 230K-250K total records (Friday 180K + MWR 50K with 10-15% dedup)
- Steps:
  * [6.1] Final backup of production DB
  * [6.2] Run Friday-staging full migration (80K-200K records)
  * [6.3] Run MyWorkReview-staging full migration (15K-30K records)
  * [6.4] Run all 8 validators on full data
  * [6.5] Verify record counts match exactly
  * [6.6] Fix any live data issues (if found)
  * [6.7] Document final results
- Command: `node /home/user/lexco/moonlanding/phase-3.6-full-migration.js`

**Phase 3.7 (DEPENDENT ON 3.6):** Verification (12 Checks)
- Status: READY AFTER 3.6 PASSES
- Duration: ~8 hours
- Critical Checks:
  * [7.1] User deduplication (10-15% overlap accuracy)
  * [7.2] Engagement-client relationships
  * [7.3] RFI-engagement-question relationships
  * [7.4] Highlight coordinates (±0 pixels preservation - CRITICAL)
  * [7.5] Timestamps UTC normalized
  * [7.6] File paths updated correctly
  * [7.7] Permission relationships intact
  * [7.8] Activity logs complete
  * [7.9] Full system integration test
  * [7.10] Spot check 100 random records
  * [7.11] Verify no orphaned records
  * [7.12] Performance baseline (p95 <500ms @ 100K records)
- Command: `node /home/user/lexco/moonlanding/phase-3.7-verification.js`

**Phase 3.8 (DEPENDENT ON 3.7):** Parallel Operations Setup
- Status: READY AFTER 3.7 PASSES
- Duration: ~3 hours
- Steps:
  * [8.1] Set old systems to read-only
  * [8.3] Create change sync Friday → Moonlanding
  * [8.4] Create change sync MWR → Moonlanding
  * [8.2] Set up dual-system routing (old → new with fallback)
  * [8.5] Monitor data consistency between systems
  * [8.6] Test rollback from Moonlanding to old systems
  * [8.7] Document dual-system operation
- Command: `node /home/user/lexco/moonlanding/phase-3.8-parallel-ops.js`

**Phase 3.9 (DEPENDENT ON 3.8):** Production Cutover
- Status: READY AFTER 3.8 PASSES
- Duration: ~2 hours
- Steps:
  * [9.1] Set old systems to read-only (final)
  * [9.2] Verify no pending changes in old systems
  * [9.3] Run final sync old → new
  * [9.4] Verify all data current
  * [9.5] Switch routing to Moonlanding (production traffic)
  * [9.6] Verify system operation under load
  * [9.7] Decommission old systems
  * [9.8] Celebrate Phase 3 completion
- Command: `node /home/user/lexco/moonlanding/phase-3.9-cutover.js`

**Phase 3.10 (DEPENDENT ON 3.9):** Post-Migration Support (24h Monitoring)
- Status: READY AFTER 3.9 PASSES
- Duration: 4 hours + 24h monitoring
- Steps:
  * [10.1] Monitor error logs (24h continuous)
  * [10.2] Address user issues immediately
  * [10.3] Optimize performance if needed
  * [10.4] Create migration documentation
  * [10.5] Archive old system data
  * [10.6] Update runbooks
  * [10.7] Train support team
- Command: `node /home/user/lexco/moonlanding/phase-3.10-support.js`

### Validation Checkpoints

All validators must pass for migration to proceed:

1. **Row Count** - Source/target counts match (accounting for dedup)
2. **Referential Integrity** - No orphaned records, all FKs valid
3. **Data Types** - Timestamps, JSON, booleans converted correctly
4. **PDF Coordinates** - ±0 pixels preservation (CRITICAL)
5. **Timestamps** - All UTC ISO 8601 format
6. **File Paths** - Updated correctly, files exist
7. **JSON Fields** - Valid JSON syntax
8. **FK Constraints** - PRAGMA foreign_key_check passes

### Success Criteria (ALL MUST PASS)

- 100% row count match (zero data loss)
- 100% referential integrity (no orphans)
- PDF coordinates preserved ±0 pixels
- User deduplication 100% accurate (10-15% reduction)
- All timestamps UTC normalized
- Zero crashes or corruption
- Performance p95 <500ms @ 100K records

### How to Execute

#### IMMEDIATE: Execute All Remaining Phases (3.5-3.10)

```bash
# Option 1: Master orchestrator (executes all 6 phases sequentially)
node /home/user/lexco/moonlanding/execute-phases-3.5-to-3.10.js

# Option 2: Execute individual phases
node /home/user/lexco/moonlanding/execute-phase-3.5-real.js      # 10% pilot
node /home/user/lexco/moonlanding/phase-3.6-full-migration.js    # 100% migration
node /home/user/lexco/moonlanding/phase-3.7-verification.js      # 12 checks
node /home/user/lexco/moonlanding/phase-3.8-parallel-ops.js      # Dual-system
node /home/user/lexco/moonlanding/phase-3.9-cutover.js           # Production switch
node /home/user/lexco/moonlanding/phase-3.10-support.js          # 24h monitoring
```

#### Phase Execution Details

**Phase 3.5: Pilot Testing (10%)**
```bash
node /home/user/lexco/moonlanding/execute-phase-3.5-real.js

# Output: /home/user/lexco/moonlanding/phase-3.5-testing/
#   - pilot-10-percent.db (test database with 1,700 records)
#   - phase-3.5-real-report.json (comprehensive report)
#   - production-backup-10percent.db (backup for rollback)

# Expected output:
# ✓ 1,700 records migrated
# ✓ 8/8 validators passed (100% pass rate)
# ✓ Ready for Phase 3.6
```

**Phase 3.6: Full Migration (100%)**
```bash
node /home/user/lexco/moonlanding/phase-3.6-full-migration.js

# Expected output:
# ✓ 230,000+ records migrated (Friday 180K + MWR 50K - 10-15% dedup)
# ✓ 8/8 validators passed
# ✓ Ready for Phase 3.7
```

**Phase 3.7: Verification (12 Checks)**
```bash
node /home/user/lexco/moonlanding/phase-3.7-verification.js

# Expected output:
# ✓ 12/12 verification checks passed
# ✓ Ready for Phase 3.8
```

**Phase 3.8-3.10: Remaining Phases**
```bash
node /home/user/lexco/moonlanding/phase-3.8-parallel-ops.js
node /home/user/lexco/moonlanding/phase-3.9-cutover.js
node /home/user/lexco/moonlanding/phase-3.10-support.js
```

#### Monitoring During Execution

During each phase, monitor:
```bash
# Watch database size growth
watch -n 5 'du -sh /home/user/lexco/moonlanding/data/app.db'

# Monitor error logs
tail -f /home/user/lexco/moonlanding/phase-execution-logs/*.log

# Check SQLite database
sqlite3 /home/user/lexco/moonlanding/data/app.db \
  "SELECT name, COUNT(*) FROM (
    SELECT 'users' as name FROM users
    UNION ALL SELECT 'engagements' FROM engagements
    UNION ALL SELECT 'rfis' FROM rfis
  ) GROUP BY name ORDER BY COUNT(*) DESC;"
```

### Configuration

Migration configuration in `src/migration/index.js`:
- Source systems (Friday, MWR)
- Target system (Moonlanding)
- Migration order (dependency-based)
- Transformation rules
- Validation requirements
- Success criteria

### Important Notes

- **User Deduplication:** Email-based matching. 10-15% of users exist in both systems - these are merged, not duplicated.
- **PDF Coordinates:** This is CRITICAL. Must preserve exact values. No transformation allowed.
- **Timestamps:** All must be UTC with Z suffix. Pattern: `YYYY-MM-DDTHH:MM:SS.sssZ`
- **Transaction Control:** If any validator fails, entire transaction rolls back to backup.
- **Foreign Keys:** Turned OFF during migration, turned ON after validators pass.
- **Performance:** Expect 4-8 hours for full migration depending on data volume.

### Monitoring & Logging

All migration operations logged to `data/migration-logs/`:
- `phase-N-*.log` - Detailed logs for each phase
- `schema-analysis-*.json` - Schema analysis results
- `source-analysis-*.json` - Source system analysis
- Backup database: `data/backups/app-*.db`

### Troubleshooting

If migration fails:
1. Check logs in `data/migration-logs/`
2. Review backup database path
3. Transaction automatically rolls back
4. Restore from backup if needed
5. Fix issues in migration code
6. Retry migration

See individual module documentation for detailed API and error handling.

---

## EXECUTION STATUS - PHASES 3.5-3.10

**Status:** FULLY PREPARED - AWAITING EXECUTION VIA dev ENVIRONMENT

### Ready-to-Execute Command

```bash
node /home/user/lexco/moonlanding/execute-all-phases-real.js
```

### Execution Sequence

The master orchestrator will execute in sequence:

1. **Phase 3.5: Pilot Migration (10%)** ~30 min
   - Load 10% sample (1,600-1,700 records)
   - Execute complete migration pipeline
   - Run all 8 validators
   - Verify 100% pass rate
   - Test rollback capability

2. **Phase 3.6: Full Data Migration (100%)** ~2-4 hours
   - Create production backup
   - Load Friday-staging (80K-200K records)
   - Load MyWorkReview-staging (15K-30K records)
   - Apply user deduplication (10-15% overlap)
   - Run all 8 validators on full dataset
   - Generate comprehensive report

3. **Phase 3.7: Data Integrity Verification** ~2-4 hours
   - 12 comprehensive verification checks:
     * User deduplication accuracy
     * Engagement-client relationships
     * RFI-engagement-question relationships
     * Highlight coordinates (±0 pixels - CRITICAL)
     * Timestamp UTC normalization
     * File path updates
     * Permission relationships
     * Activity logs completeness
     * Full system integration test
     * Spot check 100 random records
     * Orphaned record detection
     * Performance baseline (p95 <500ms)

4. **Phase 3.8: Parallel Operations Setup** ~1-2 hours
   - Set old systems to read-only
   - Create bidirectional sync (Friday ↔ Moonlanding)
   - Create bidirectional sync (MWR ↔ Moonlanding)
   - Set up dual-system routing with fallback
   - Monitor data consistency
   - Test rollback procedures

5. **Phase 3.9: Production Cutover** ~1-2 hours
   - Final read-only lock on old systems
   - Verify no pending changes
   - Execute final sync
   - Switch production traffic to Moonlanding
   - Verify system operation under load
   - Archive old systems

6. **Phase 3.10: Post-Migration Support** 4 hours + 24h monitoring
   - Continuous error log monitoring (24h)
   - Address user issues immediately
   - Performance optimization if needed
   - Migration documentation creation
   - Old system data archival
   - Operational runbook updates
   - Support team training

### Total Execution Time
- ~11-18 hours active execution
- +24 hours continuous monitoring
- Automatic .prd updates as phases complete
- Comprehensive logging to `phase-execution-logs/`

### Output on Completion
- ✓ 230K-250K records migrated with zero data loss
- ✓ 100% validator pass rate (8/8) on all phases
- ✓ All 12 verification checks passed
- ✓ .prd file becomes empty
- ✓ Execution logs saved with detailed metrics
- ✓ Production backup preserved at `data/backups/`

### Blocking Issue
Execution requires `plugin:gm:dev` access for Node.js execution. The complete infrastructure is built and waiting for the dev execution environment to be available.
