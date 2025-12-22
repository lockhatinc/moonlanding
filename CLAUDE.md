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

## Observability & Debugging

### Client-Side Debugging (Browser Console)
```javascript
window.__DEBUG__.getState()              // View full app state
window.__DEBUG__.getApiCalls()           // View last 100 API calls
window.__DEBUG__.getLastApiError()       // View last API error
window.__DEBUG__.getEntity('entityName') // View specific entity data
window.__DEBUG__.getErrors()             // View logged errors
window.__DEBUG__.tables.apiCalls()       // Table of API calls
window.__DEBUG__.tables.entities()       // Table of all entities
window.__DEBUG__.tables.errors()         // Table of errors
```

### Server-Side Logging
All errors logged via `console.error()` with context:
```javascript
console.error('[ENTITY] List error:', { entity, sql, error });
console.error('[API] POST error:', { endpoint, status });
console.error('[DATABASE] Transaction failed:', error.message);
```
