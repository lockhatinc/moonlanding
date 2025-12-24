# Deployment & Launch Checklist

## Pre-Deployment (Local Testing)

- [x] Build succeeds with zero warnings: `npm run build`
- [x] All API routes operational (domains, friday, mwr)
- [x] Authentication enforces 401 Unauthorized
- [x] Database initializes on first request
- [x] Error handling returns proper HTTP status codes
- [x] Middleware initializes system config correctly

## Environment Setup

### Required Environment Variables

```
GOOGLE_CLIENT_ID=<oauth_app_id>
GOOGLE_CLIENT_SECRET=<oauth_app_secret>
GOOGLE_REDIRECT_URI=https://<domain>/api/auth/google/callback
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json
DATABASE_PATH=./data/app.db
NODE_ENV=production
```

### Service Account Configuration

1. Create Google Service Account for Drive/Docs API access
2. Place service-account.json at project root
3. Grant necessary scopes to service account in Google Workspace Admin

### Database

1. Ensure `data/` directory is writable by Node process
2. SQLite database file will be created automatically at `data/app.db`
3. Migration runs automatically on first API request
4. **Backup database regularly** - SQLite stores all data in single file

## Deployment Steps

### 1. Build & Preparation

```bash
npm install
npm run build
```

**Verify:**
- Zero build warnings
- All routes listed in build output
- Bundle size reasonable (~600KB gzipped)

### 2. Environment Variables

- Set all required environment variables
- Test Google OAuth redirect URI matches exactly
- Service account JSON has proper permissions

### 3. Start Application

```bash
npm run start  # production mode
# or
NODE_ENV=production node .next/standalone/server.js
```

**Verify:**
- Server starts without errors
- Middleware initializes system config
- Port 3000 listening (or configured port)

### 4. Test Core Functionality

```bash
# Test domain routes
curl http://localhost:3000/api/domains

# Test authentication redirect
curl http://localhost:3000/api/auth/me
# Should return 401 or redirect to /login

# Test database access (requires auth)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/friday/engagement
```

### 5. Monitor Initial Startup

- Check logs for config initialization
- Verify database migration completed
- Monitor memory usage during startup
- Check for any permission errors

## Post-Deployment (Staging/Production)

### Day 1

- [x] Verify all critical API endpoints returning correct HTTP status codes
- [ ] Test Google OAuth flow end-to-end
- [ ] Test creating/updating records in each domain (Friday, MWR)
- [ ] Verify domain isolation (cross-domain requests return 403)
- [ ] Test permissions with different user roles

### Week 1

- [ ] Monitor database file size growth
- [ ] Check for "database is locked" errors under load
- [ ] Test backup/restore procedures
- [ ] Verify email functionality (if enabled)
- [ ] Test file uploads/downloads

### Ongoing

- [ ] Regular database backups (daily)
- [ ] Monitor API response times
- [ ] Check error logs for patterns
- [ ] Update environment variables as needed (no downtime for Node restart)

## Known Issues & Workarounds

### Database Locking

**Issue:** "database is locked" errors under high concurrency
**Workaround:**
- Reduce concurrent write operations
- Increase `busy_timeout` in database-core.js
- Plan PostgreSQL migration for production scale (10k+ records)

### Cold Start Delay

**Issue:** First request takes ~100ms for YAML config parsing
**Explanation:** ConfigGeneratorEngine lazy-initializes and caches specs
**Verification:** Subsequent requests are <10ms

### Edge Runtime Incompatibility

**Issue:** Middleware uses Node.js APIs (process.cwd)
**Status:** Fixed - middleware exports `runtime = 'nodejs'`
**Verified:** ✅ Middleware initializes correctly

## Rollback Procedure

1. Keep previous `.next/standalone` directory
2. Switch back to previous NODE_VERSION
3. Restore `data/app.db` from backup
4. Restart application
5. Verify API endpoints responding

## Performance Baseline (Production)

Expected metrics:
- **API response time:** <100ms (warm cache)
- **Bundle size:** ~600KB gzipped
- **Database size:** <100MB for initial 10k records
- **Memory usage:** ~200-300MB base, grows with record volume

## Critical Files to Monitor

- `data/app.db` - SQLite database (backup regularly)
- `.env` / `.env.local` - Environment variables (never commit)
- `service-account.json` - Google service account (never commit)
- Logs - Monitor for errors or rate limiting

## Deployment Verification Checklist

After deploying, verify:

```javascript
// Browser console on production URL
window.__CONFIG__.status()                    // { initialized: true }
window.__DOMAINS__.getCurrentDomain()         // Should work
window.__DEBUG__.api.lastError()              // Check for recent errors
window.__HELPERS__.quickTest()                // Run system tests
```

## Support & Debugging

**Common issues:**
- 401 responses: Check authentication middleware
- 403 responses: Check entity belongs to requested domain
- 500 responses: Check CLAUDE.md for known caveats
- Slow startup: YAML parsing on cold start (normal)

**Enable debug logging:**
```bash
DEBUG=true npm run start
```

**Database inspection:**
```bash
sqlite3 data/app.db ".tables"
sqlite3 data/app.db "SELECT COUNT(*) FROM engagement"
```
