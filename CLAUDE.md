# CLAUDE.md - Technical Caveats & Build Status

## Build Status (2025-12-24)

**Current:** Zero-warning build achieved, all API endpoints operational
- Build: Compiled successfully in 14.9s
- Warnings: 0
- Errors: 0
- Bundle size: ~264 kB per route, 102 kB shared

**Critical fixes (commit deab89e):**
- error-handler.js: Fixed ERROR_MESSAGES function calls to proper nested structure (operation.notFound, permission.denied, auth.unauthorized, operation.alreadyExists, system.error)
- middleware.ts: Added `export const runtime = 'nodejs'` to fix edge runtime process.cwd() errors

**Previous fixes (commit 352aa97):**
- Hook files: Added 'use client' directives to all hooks
- Imports: Fixed API_ENDPOINTS and ERROR_MESSAGES imports
- Debug: Fixed initClientDebug export name
- Dead code: Removed deprecated getSystemConfig imports
- Webpack: Added webpackIgnore comments for dynamic imports

---

## Technical Caveats & Known Limitations

### Database (SQLite)

- **Concurrent writes:** SQLite locks entire database on write. With high concurrency, "database is locked" errors possible. Scale to PostgreSQL when needed. Configured via `thresholds.system.database_busy_timeout_ms` in master-config.yml.
- **Foreign key enforcement:** ENABLED via `PRAGMA foreign_keys = ON`. Orphaned records will be rejected. Deletion order must respect referential integrity.
- **JSON fields:** Stored as TEXT. Cannot filter on nested JSON properties. Use separate normalized tables for complex filtering.
- **Backup:** Manual exports required. No built-in replication.

### PDF Viewer & Highlights

- **PDF.js dependency:** Loaded from CDN.
- **Large PDFs:** 50MB+ files may cause browser memory issues. No chunked/streaming rendering.
- **Text selection:** Works only with searchable PDFs. Scanned/image-based PDFs cannot be highlighted.
- **Coordinate system:** Position data uses PDF coordinates (bottom-left origin), not screen coordinates. Zoom/rotate breaks positioning. Must recalculate after display transform.
- **Highlight rendering:** Overlays render per-page only. Does not account for rotated/skewed text. May misalign on PDFs with unusual formatting.

### Realtime Updates

- **Polling-based:** 2-3 second delay between change and notification. Not suitable for <1s sync requirements.
- **No conflict resolution:** If two users edit simultaneously, last-write-wins. No merge or conflict detection.
- **Browser memory:** Poll subscriptions kept in memory. With 50+ subscriptions, may cause memory leaks if not properly unsubscribed.
- **Deduplication:** Only checks URL, not query parameters. Multiple filters on same entity may cause duplicate fetches.

### Authentication (Google OAuth)

- **Redirect URI:** Must exactly match registered URI. Mismatches cause "invalid_request" errors with no clear message.
- **Service account:** Separate from user auth. Service account permissions must be explicitly granted in Google Workspace admin panel.
- **Token expiry:** Access tokens expire in 1 hour. Refresh tokens used for rotation. No notification if refresh fails.
- **Scope creep:** Adding new Google scopes requires users to re-authorize. No automatic scope updates.

### Field Validation

- **Type coercion:** Happens on client-side form submission. Server does not re-validate. Malicious clients can bypass validation.
- **Date fields:** Stored as Unix seconds. Years before 1970 or after 2038 may cause issues (32-bit systems).
- **Decimal precision:** Stored as IEEE 754 floats. Rounding errors expected with financial calculations. Use integers + cents for money.
- **JSON fields:** No schema validation. Invalid JSON stored as NULL or string. Crashes if code assumes object.
- **Enum options:** Not enforced on database. Invalid enum values can be inserted via direct SQL/API manipulation.

### Email System

- **Rate limiting:** Gmail API has strict rate limits (100 messages/minute per user, 10k/day per project). Configured via `thresholds.email.rate_limit_delay_ms`. Exponential backoff capped at `thresholds.email.retry_max_delay_ms`.
- **Bounce handling:** IMPLEMENTED. Automatic bounce detection (550/551 status codes). Bounced emails marked with `status='bounced'` and `bounce_permanent=1`, excluded from retries.
- **Retry policy:** Configured via `thresholds.email.send_max_retries` and `thresholds.retry.max_attempts`. Batch size via `thresholds.email.send_batch_size`.
- **Attachments:** Gmail limits attachment size to 25MB. Larger files silently truncated or fail without error.
- **Templates:** Hardcoded in code. Changes require code redeploy. No dynamic template management.
- **Delivery:** Emails sent async. No confirmation if email actually delivered. Only confirms if accepted by SMTP.

### Google Drive Integration

- **Rate limits:** 1000 requests/100 seconds per user. Sustained operations trigger "quota exceeded" errors for 24 hours.
- **Folder structure:** Deeply nested folders (>10 levels) cause slow performance. Drive API queries scan entire tree.
- **File permissions:** Changes propagate asynchronously. Files may be inaccessible for 5-10 minutes after sharing.
- **Quota:** Shared drives have separate quota from personal drives. No automatic routing.
- **Search:** Drive query syntax limited. Cannot search by custom properties or metadata.

### Performance

- **List views:** PAGINATION ENFORCED. Default page size 50 records, max 100. Configured via `thresholds.system.default_page_size` and `thresholds.system.max_page_size` (or from env).
- **Search:** Full-text search (FTS5) IMPLEMENTED. Virtual tables created for all searchable entities. Significant performance improvement over table scans.
- **Computed fields:** Calculated via SQL subqueries. Complex formulas with JOINs cause N+1 query patterns.
- **Bundle size:** PDF.js is 1.2MB. Client bundle likely >2MB uncompressed. ~600KB gzipped.
- **Image uploads:** No compression. Full-res images (10MB+) can be uploaded. No max size enforcement.

### Client-Side State

- **Global debug object:** `window.__DEBUG__` persists across page reloads. Stale data possible if state not cleared.
- **Client state sync:** No way to force server → client sync. User may see stale data if tab left open.
- **Form state:** No auto-save. Page navigation clears form. Unsaved changes lost silently.
- **Session storage:** No automatic expiry. Users may perform actions after session invalidated server-side.

### Workflow & Stages

- **Stage transitions:** LOCKED between transitions. Transition lockout enforced via `thresholds.workflow.stage_transition_lockout_minutes`. Concurrent transitions detected and rejected.
- **Field locks:** Fields marked as locked in stage definition are enforced during update. Attempting to edit locked fields returns 403 Forbidden.
- **Auto-transition:** Relies on cron job running (scheduled via automation.schedules in master-config.yml). Max attempts tracked via `thresholds.workflow.stage_transition_lockout_minutes`.
- **RFI expiry:** Hard expiry at 90 days (configurable via `thresholds.rfi.max_days_outstanding`). Uses working days calculation.
- **Checklist blocking:** Finalization blocked unless all checklists have `all_items_done=true`.

### Engagement Recreation

- **Year calculation:** Assumes `year` field is numeric. Text years (e.g., "FY2024") cause failures.
- **Monthly recreation:** Does not account for daylight saving or leap years. Math may be off by 1 day.
- **Duplicate check:** Only checks exact year/month match. Similar-but-not-identical periods not detected.
- **Attachments:** File copy happens synchronously. Large files (100MB+) timeout (30s limit).

### Permissions

- **Field-level:** No field-level permissions. Users see all columns they can see the entity.
- **Row-level:** Not implemented. No automatic data filtering per user. Relies on form/list code respecting permissions.
- **Permission cache:** Computed on-the-fly. No caching. 1000 permission checks = 1000 evaluations (slow).
- **Client-side checks:** Buttons/forms can be hidden client-side, but nothing prevents direct API calls with `curl`. Always validate server-side.

### Browser Compatibility

- **PDF.js:** Requires modern browser (Chrome 90+, Firefox 88+, Safari 14+). IE11 not supported.
- **CSS Grid:** Used in layouts. Older devices may have layout bugs.
- **Fetch API:** No polyfill. Older browsers fail silently.
- **LocalStorage:** 5-10MB limit per domain. Exceeding quota throws and crashes app if not caught.

### Deployment & Scaling

- **Single process:** Node.js runs single-threaded. Multi-core systems underutilized.
- **Memory:** No garbage collection tuning. Long-running processes (jobs) may leak memory.
- **Database file:** SQLite stores entire database in single file. Growing to 500MB+ causes slowdowns.
- **No load balancing:** Sticky sessions required if deployed to multiple instances (polling state not shared).
- **Secrets:** Env vars checked at startup. Changes require full restart, causing downtime.

### Other

- **Timezone handling:** Unix timestamps are timezone-agnostic. Display timezone determined by client browser. Ambiguous on DST transitions.
- **Sorting:** Only works on primary table columns. Sorting by joined/computed fields not supported.
- **Deleted records:** Soft deletes set status='deleted'. Hard deletes still visible in removed_highlights and archives.
- **Comments:** Removed per policy. Code intentionally left comment-free. Use observability tools instead.
- **RFI response counting:** Auto-incremented via post-create hook when rfi_response entity is created.
- **Highlight comments:** Support threaded comments via parent_comment_id field. Requires highlight entity as parent.
