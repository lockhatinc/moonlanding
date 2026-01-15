# CLAUDE.md - Technical Caveats & System Status

## Zero-Build Runtime Architecture

This application uses **zero-build runtime** with typescript/jsx transpilation at runtime using `tsx`.

### How It Works
- `tsx server.js` - Runs server with on-demand TypeScript/JSX transpilation
- Import resolver: `@/` → `src/`, absolute paths auto-resolved
- Custom HTTP server loads API routes at runtime
- System config lazy-loads on first request
- File watching invalidates modules on hot reload

### Key Limitations
- Transcompilation happens at runtime (not pre-built)
- No webpack, babel, or build artifacts
- Requires Node.js 18+ for ES modules
- Module cache in server.js can become stale (file watchers handle most cases)

### Development
```bash
npm install     # Install dependencies (tsx included)
npm run dev     # Start buildless dev server on port 3004
```

## Technical Caveats & Known Limitations

### Zero-Build Runtime Caveats (CRITICAL)

**Backend/API:**
- **No Next.js framework:** App uses custom HTTP server. Must use polyfills for NextResponse, cookies, headers in `src/lib/next-polyfills.js`.
- **Polyfill completeness:** Polyfills are minimal implementations. Do not assume full Next.js behavior. Check implementation before depending on Next.js utilities.
- **Module caching:** Custom module cache can become stale. Manual cache clearing may be needed: `rm -f data/app.db data/app.db-wal data/app.db-shm`.
- **Hot reload limitations:** File changes reload modules but don't preserve state. In-memory data structures reset. Polling subscriptions may be orphaned after hot reload.
- **Database persistence:** SQLite in `data/app.db` persists across restarts. Hot reloads don't clear DB.
- **Import paths:** All imports must use absolute `@/` alias. Relative imports will fail with tsx.
- **Node.js version:** Requires 18+ for ES modules. Older versions will fail with cryptic errors.

**Frontend/UX:**
- **Client-side navigation:** useRouter() polyfill uses window.location.href. No prefetching. Each navigation is full page refresh.
- **Dynamic imports:** dynamic() uses async import(). May show loading states briefly.
- **Search params:** useSearchParams() relies on URLSearchParams API. No SSR-safe parsing.
- **Link component:** Polyfill is not a real React component. No prefetch or scroll behavior support.
- **Form status:** useFormStatus() mock always returns pending: false. Manual loading state required.
- **Redirect in actions:** Server action redirect() uses window.location.href, causing full page reload. State is lost.
- **Pathname hook:** usePathname() reads window.location.pathname. Won't detect query param changes without full reload.

### Database (SQLite)

- **Concurrent writes:** SQLite locks entire database on write. With high concurrency, "database is locked" errors possible. Scale to PostgreSQL when needed.
- **Foreign key enforcement:** ENABLED via `PRAGMA foreign_keys = ON`. Orphaned records rejected. Deletion must respect referential integrity.
- **JSON fields:** Stored as TEXT. Cannot filter on nested JSON properties. Use separate normalized tables for complex filtering.
- **Backup:** Manual exports required. No built-in replication.

### PDF Viewer & Highlights

- **PDF.js dependency:** Loaded from CDN.
- **Large PDFs:** 50MB+ files may cause browser memory issues. No chunked/streaming rendering.
- **Text selection:** Works only with searchable PDFs. Scanned/image-based PDFs cannot be highlighted.
- **Coordinate system:** Position data uses PDF coordinates (bottom-left origin). Zoom/rotate breaks positioning. Must recalculate after display transform.
- **Highlight rendering:** Overlays render per-page only. May misalign on rotated/skewed text or unusual formatting.

### Realtime Updates

- **Polling-based:** 2-3 second delay between change and notification. Not suitable for <1s sync requirements.
- **No conflict resolution:** Simultaneous edits use last-write-wins. No merge or conflict detection.
- **Browser memory:** Poll subscriptions kept in memory. 50+ subscriptions may cause leaks if not unsubscribed.
- **Deduplication:** Only checks URL, not query parameters. Multiple filters may cause duplicate fetches.

### Authentication (Google OAuth)

- **Redirect URI:** Must exactly match registered URI. Mismatches cause "invalid_request" errors.
- **Service account:** Separate from user auth. Permissions must be explicitly granted in Google Workspace admin.
- **Token expiry:** Access tokens expire in 1 hour. Refresh tokens used for rotation. No notification on failure.
- **Scope creep:** Adding new scopes requires users to re-authorize. No automatic updates.

### Field Validation

- **Type coercion:** Client-side only. Server does not re-validate. Malicious clients can bypass validation.
- **Date fields:** Stored as Unix seconds. Years before 1970 or after 2038 may cause issues.
- **Decimal precision:** IEEE 754 floats. Rounding errors with financial calculations. Use integers + cents for money.
- **JSON fields:** No schema validation. Invalid JSON stored as NULL or string. Crashes if code assumes object.
- **Enum options:** Not enforced on database. Invalid values can be inserted via direct SQL/API.

### Email System

- **Rate limiting:** Gmail API: 100 messages/minute per user, 10k/day per project. Configured via `thresholds.email.rate_limit_delay_ms`.
- **Bounce handling:** IMPLEMENTED. Automatic detection (550/551 status codes). Marked with `status='bounced'` and `bounce_permanent=1`.
- **Retry policy:** Configured via `thresholds.email.send_max_retries` and `thresholds.retry.max_attempts`.
- **Attachments:** Gmail limits to 25MB. Larger files silently truncated or fail without error.
- **Templates:** Hardcoded in code. Changes require redeploy. No dynamic template management.
- **Delivery:** Emails sent async. No confirmation of actual delivery. Only confirms SMTP acceptance.

### Google Drive Integration

- **Rate limits:** 1000 requests/100 seconds per user. Sustained operations trigger 24-hour quota exceeded.
- **Folder structure:** Deeply nested folders (>10 levels) cause slow performance.
- **File permissions:** Changes propagate asynchronously. 5-10 minute accessibility delay after sharing.
- **Quota:** Shared drives have separate quota from personal drives.
- **Search:** Limited query syntax. Cannot search by custom properties or metadata.

### Performance

- **List views:** PAGINATION ENFORCED. Default 50 records/page, max 100. Via `thresholds.system.default_page_size` and `thresholds.system.max_page_size`.
- **Search:** Full-text search (FTS5) IMPLEMENTED. Virtual tables created for all searchable entities.
- **Computed fields:** Calculated via SQL subqueries. Complex formulas with JOINs cause N+1 query patterns.
- **Bundle size:** PDF.js is 1.2MB. Client bundle likely >2MB uncompressed. ~600KB gzipped.
- **Image uploads:** No compression. Full-res images (10MB+) uploadable. No max size enforcement.

### Client-Side State

- **Global debug object:** `window.__DEBUG__` persists across reloads. Stale data possible if not cleared.
- **Client state sync:** No forced server → client sync. Users may see stale data if tab left open.
- **Form state:** No auto-save. Page navigation clears forms. Unsaved changes lost silently.
- **Session storage:** No automatic expiry. Users may act after server-side session invalidation.

### Workflow & Stages

- **Stage transitions:** LOCKED between transitions. Lockout enforced via `thresholds.workflow.stage_transition_lockout_minutes`.
- **Field locks:** Locked fields enforced during update. Editing returns 403 Forbidden.
- **Auto-transition:** Relies on cron job running (configured in automation.schedules).
- **RFI expiry:** Hard expiry at 90 days (configurable via `thresholds.rfi.max_days_outstanding`). Uses working days.
- **Checklist blocking:** Finalization blocked unless all checklists have `all_items_done=true`.

### Engagement Recreation

- **Year calculation:** Assumes numeric `year` field. Text years (e.g., "FY2024") cause failures.
- **Monthly recreation:** Does not account for daylight saving or leap years. Math may be off by 1 day.
- **Duplicate check:** Only exact year/month match. Similar-but-not-identical periods not detected.
- **Attachments:** File copy is synchronous. 100MB+ files timeout (30s limit).

### Permissions

- **Field-level:** Not implemented. Users see all columns of accessible entities.
- **Row-level:** Not implemented. No automatic data filtering per user. Relies on form/list code respecting permissions.
- **Permission cache:** Computed on-the-fly. No caching. 1000 checks = 1000 evaluations (slow).
- **Client-side checks:** Buttons/forms hideable client-side, but nothing prevents direct API calls. Always validate server-side.

### Browser Compatibility

- **PDF.js:** Requires Chrome 90+, Firefox 88+, Safari 14+. IE11 not supported.
- **CSS Grid:** Used in layouts. Older devices may have layout bugs.
- **Fetch API:** No polyfill. Older browsers fail silently.
- **LocalStorage:** 5-10MB limit per domain. Exceeding quota throws error and may crash app.

### Deployment & Scaling

- **Single process:** Node.js runs single-threaded. Multi-core systems underutilized.
- **Memory:** No garbage collection tuning. Long-running jobs may leak memory.
- **Database file:** SQLite stores entire database in single file. 500MB+ causes slowdowns.
- **No load balancing:** Sticky sessions required if deployed to multiple instances. Polling state not shared.
- **Secrets:** Env vars checked at startup. Changes require full restart, causing downtime.

### Business Logic Notes

- **CloseOut read-only:** Stage enforced read-only at API. All field updates blocked. No partial edits.
- **Team scope access:** Non-Partners access only team-assigned engagements. Partners see all.
- **Stage transition lockout:** 5-minute lockout prevents race conditions.
- **Engagement recreation:** Atomic all-or-nothing. Partial failures roll back completely.
- **RFI dual-state:** Binary status (0/1) separate from display states. Days Outstanding resets in InfoGathering.
- **Highlight soft-delete:** Moved to `removedHighlight`. Never hard-deleted.
- **Clerk RFI restriction:** Cannot mark complete without file upload or response text.
- **RFI response counting:** Auto-incremented atomically when responses added.
- **Client inactive cleanup:** Repeat_interval set to "once" on all engagements, InfoGathering+0% deleted atomically.
- **Team user removal:** Auto-removed from users[] array in all active engagements. Cascades to children.

### Other

- **Timezone handling:** Unix timestamps are timezone-agnostic. Display timezone determined by client browser.
- **Sorting:** Only works on primary table columns. Sorting by joined/computed fields not supported.
- **Deleted records:** Soft deletes set status='deleted'. Hard deletes still visible in archives.
- **Highlight comments:** Support threaded comments via parent_comment_id field.
- **Firebase Admin SDK:** Gracefully handles missing configuration. Returns 503 if not initialized.

### Frontend Rendering (CRITICAL)

- **No client-side React entry point:** Server sends empty HTML shell (`<div id="__next"></div>`) with no bundler or SSR
- **Pages not rendering:** Login and all dashboard/entity pages display blank
- **Browser cannot load JSX:** No client-side transpiler, bundler, or server-side rendering implemented
- **API endpoints work:** Backend fully operational; frontend rendering is the blocker
- **Required fix:** Implement client-side bundle (tsx/esbuild), server-side rendering (renderToString), or SSR framework

