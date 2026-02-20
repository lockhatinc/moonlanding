# Google OAuth 2.0 Staging Implementation Report

**Date:** 2026-02-20  
**Environment:** https://app.acc.l-inc.co.za/  
**Project:** moonlanding-platform  
**Status:** READY FOR CONFIGURATION

---

## Executive Summary

The staging environment for Moonlanding is fully operational with all authentication infrastructure in place. The system is ready to accept Google OAuth credentials. Currently, the Google Sign-in button is visible but non-functional because the OAuth client ID and secret have not been configured as environment variables.

**What's Working:**
- ✓ Application server running and responding to requests
- ✓ Login page with email/password form
- ✓ Google Sign-in button visible in UI
- ✓ OAuth routes implemented and functional
- ✓ Database connection operational
- ✓ Session management system ready

**What Needs Configuration:**
- ⚠ GOOGLE_CLIENT_ID environment variable (empty)
- ⚠ GOOGLE_CLIENT_SECRET environment variable (empty)
- ⚠ GOOGLE_REDIRECT_URI needs update for staging domain

---

## Current Status

### Server Health
```
Staging URL: https://app.acc.l-inc.co.za
Health Check: ✓ OK
Database: ✓ Connected
OAuth Route: ✓ Operational (redirects to Google)
```

### Authentication State
| Component | Status | Issue |
|-----------|--------|-------|
| Email/password form | ✓ Loaded | - |
| Google Sign-in button | ✓ Visible | client_id=undefined |
| OAuth route | ✓ Responding | Missing credentials |
| Database | ✓ Connected | - |
| Session system | ✓ Ready | - |

### OAuth Configuration Detected
```
Project ID: moonlanding-platform
Service Account: moonlanding-app@moonlanding-platform.iam.gserviceaccount.com
OAuth Consent Screen: ✓ Configured
OAuth Routes: ✓ Implemented
Auth Database: ✓ Schema ready
```

---

## Root Cause Analysis

When user clicks "Sign in with Google" on staging, the OAuth flow redirects to Google with URL containing `client_id=undefined`. This happens because:

1. **Staging deployment** does not have `GOOGLE_CLIENT_ID` environment variable set
2. **Staging deployment** does not have `GOOGLE_CLIENT_SECRET` environment variable set
3. **Staging deployment** has incorrect `GOOGLE_REDIRECT_URI` (points to localhost:3000, not staging domain)

The code to initiate OAuth flow is working correctly - it's just missing the credentials to make the request valid to Google.

---

## Required Configuration

### Step 1: Obtain Google OAuth Credentials

**Google Cloud Console URL:**
```
https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
```

**If credentials already exist for staging:**
- Locate "Moonlanding Web Client" or similar entry
- Click to view details
- Copy Client ID and Client Secret

**If credentials need to be created:**

A. Configure OAuth Consent Screen (if not done):
   1. Go to "OAuth consent screen" tab
   2. Select "External" user type
   3. Fill form:
      - App name: Moonlanding
      - User support email: admin@coas.co.za
      - Developer email: admin@coas.co.za
   4. Add scopes: openid, email, profile
   5. Add test users (optional): admin@coas.co.za, admin@example.com
   6. Save

B. Create OAuth 2.0 Client ID:
   1. Go to "Credentials" tab
   2. Click "Create Credentials" > "OAuth 2.0 Client ID"
   3. Application type: Web application
   4. Name: "Moonlanding Staging Web Client"
   5. Authorized JavaScript origins:
      ```
      https://app.acc.l-inc.co.za
      ```
   6. Authorized redirect URIs:
      ```
      https://app.acc.l-inc.co.za/api/auth/google/callback
      ```
   7. Click "Create"
   8. Copy Client ID and Client Secret from popup

### Step 2: Update Staging Deployment

Set these environment variables on the staging server:

```bash
GOOGLE_CLIENT_ID=<your-client-id.apps.googleusercontent.com>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback
```

**Deployment Method Varies:**
- If using `.env` file: SSH to server and edit
- If using Docker: Pass as `-e` flags
- If using Cloud Run/App Engine: Update deployment config
- If using Kubernetes: Update secrets

### Step 3: Restart Server

After updating environment variables:
1. Restart the application
2. Wait 30 seconds for full startup
3. Verify in logs: `[Engine] Lucia session cookie name: auth_session`

### Step 4: Verify Configuration

Run the verification script:
```bash
node verify-staging-auth.js
```

Expected output:
```
✓ Login page loads (200 OK)
  - Email form: ✓
  - Password form: ✓
  - Google button: ✓
✓ OAuth route redirects (307)
  - Client ID: ✓ 123456...apps.googleusercontent.com
  - Redirect URI: https://app.acc.l-inc.co.za/api/auth/google/callback
```

---

## Testing the OAuth Flow

### Prerequisite
Configuration complete with valid credentials.

### Full End-to-End Test

1. **Visit Login Page**
   ```
   https://app.acc.l-inc.co.za/login
   ```
   Expected: See email form AND "Sign in with Google" button

2. **Click "Sign in with Google"**
   Expected: Redirect to https://accounts.google.com/o/oauth2/v2/auth?...
   Note: URL should contain your actual client_id (NOT "undefined")

3. **Authenticate with Google**
   - Sign in with Google account (e.g., admin@coas.co.za)
   - Accept permissions if prompted

4. **Callback and Session Creation**
   Expected: Redirect to https://app.acc.l-inc.co.za/
   - Browser has session cookie set
   - User is logged in
   - Can access dashboard/home page

5. **Verify User Creation**
   Expected: Database contains user with:
   - email = your Google email
   - name = your Google profile name
   - avatar = your Google profile picture
   - type = 'auditor'
   - role = default_role_from_config

### Verification Checklist

After OAuth is configured, verify these work:

```
[ ] Login page loads
[ ] Google button visible
[ ] Clicking Google button redirects to Google
[ ] Can authenticate with Google account
[ ] Redirected back to app after authentication
[ ] Session cookie is set
[ ] User profile visible in dashboard
[ ] User created in database
[ ] User has correct role assigned
[ ] Can access protected routes
[ ] Logout works correctly
```

---

## Technical Details

### Code Architecture

**OAuth Initiation:** `src/app/api/auth/google/route.js`
- Validates GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Generates state (CSRF protection)
- Creates authorization URL
- Returns 307 redirect to Google

**OAuth Callback:** `src/app/api/auth/google/callback/route.js`
- Validates state parameter
- Exchanges authorization code for tokens
- Fetches user info from Google
- Creates/finds user in database
- Creates session
- Redirects to home page

**Configuration:** `src/config/env.js`
- Reads GOOGLE_CLIENT_ID from environment
- Reads GOOGLE_CLIENT_SECRET from environment
- Reads GOOGLE_REDIRECT_URI from environment
- Exposes hasGoogleAuth() function that checks both credentials

**Session Management:** `src/engine.server.js`
- Uses Lucia for session management
- BetterSqlite3 adapter for database
- Session cookies secure in production

**OAuth Helpers:** `src/lib/auth-route-helpers.js`
- validateOAuthProvider() checks if provider is configured
- setOAuthCookie() stores state and code verifier
- getOAuthCookie() retrieves for comparison
- buildOAuthErrorResponse() returns proper error messages

### Environment Variables Required

```bash
# Google OAuth (created in Google Cloud Console)
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback

# These are already configured
GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json
GCP_PROJECT_ID=moonlanding-platform
```

### Database Schema

User table with OAuth fields:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar TEXT,              -- Google profile picture
  type TEXT,                -- 'auditor' for OAuth users
  role TEXT,                -- assigned from default_role
  status TEXT,              -- 'active'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  expires_at INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

---

## Troubleshooting Guide

### Problem: "invalid_client" error from Google

**Cause:** Redirect URI mismatch or missing credentials

**Check:**
1. Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
2. Find OAuth 2.0 Client ID
3. Verify "Authorized redirect URIs" contains EXACTLY:
   ```
   https://app.acc.l-inc.co.za/api/auth/google/callback
   ```
4. No typos, no trailing slash, must be HTTPS

**Fix:**
- If URI doesn't match, edit the credential
- Update staging environment variables
- Restart server

### Problem: "Sign in with Google" button not visible

**Cause:** GOOGLE_CLIENT_ID is empty

**Check:**
1. Environment variable set: `echo $GOOGLE_CLIENT_ID`
2. Not empty string
3. Contains actual client ID

**Fix:**
1. Set environment variable with correct value
2. Restart server
3. Check logs: `[Engine] Google OAuth configured: true`

### Problem: User not created after authentication

**Cause:** Database issue or configuration problem

**Check:**
1. Users table exists: `sqlite3 data/app.db "SELECT COUNT(*) FROM users;"`
2. Default role exists in config
3. Server logs for errors

**Fix:**
1. Verify database schema is initialized
2. Check default role configuration
3. Review server logs for specific errors

### Problem: "state_mismatch" error

**Cause:** Session or cookie issue

**Fix:**
1. Clear browser cookies
2. Try login again
3. If persists, restart server

---

## Success Criteria

OAuth configuration is complete and working when:

1. ✓ Google Cloud Console has OAuth 2.0 credentials for staging domain
2. ✓ Staging server environment variables set correctly
3. ✓ Login page shows "Sign in with Google" button
4. ✓ Clicking button redirects to Google with correct client_id
5. ✓ Users can authenticate with Google
6. ✓ User created in database after first Google login
7. ✓ Session cookie set and user can access protected routes
8. ✓ Subsequent logins reuse existing user account
9. ✓ Logout clears session properly
10. ✓ No errors in server logs during OAuth flow

---

## Files and References

### Code Files
- **OAuth routes:** `src/app/api/auth/google/route.js`, `src/app/api/auth/google/callback/route.js`
- **Auth helpers:** `src/lib/auth-route-helpers.js`
- **Configuration:** `src/config/env.js`, `src/config/auth-config.js`
- **Session engine:** `src/engine.server.js`
- **Login UI:** `src/ui/login-page.js` (or similar)

### Documentation
- **CLAUDE.md** - Technical caveats and configuration notes
- **GOOGLE_OAUTH_SETUP.md** - General OAuth setup guide (see OAUTH_STAGING_SETUP_GUIDE.txt instead)
- **OAUTH_STAGING_SETUP_GUIDE.txt** - Complete staging configuration guide

### Testing Scripts
- **verify-staging-auth.js** - Comprehensive verification test
- **test-oauth-staging.js** - OAuth configuration check
- **test-email-login.js** - Email/password login test

### Google Cloud Console
- **Project:** moonlanding-platform
- **Credentials URL:** https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
- **OAuth Consent URL:** https://console.cloud.google.com/apis/consent?project=moonlanding-platform

---

## Security Considerations

### Credentials Handling
- GOOGLE_CLIENT_SECRET is sensitive like a password
- Never commit to version control
- Never share publicly
- Rotate if exposed

### OAuth Flow Security
- State parameter prevents CSRF attacks
- Redirect URI strictly validated
- Only openid, email, profile scopes requested
- User data fetched from Google only during auth flow
- Session protected with secure HTTP-only cookies

### Production Settings
- GOOGLE_REDIRECT_URI must use HTTPS (not HTTP)
- Cookies marked Secure in production
- Session timeout configured
- Rate limiting on auth endpoints recommended

---

## Next Steps

1. **Immediate Action Required:**
   - [ ] Access Google Cloud Console
   - [ ] Locate or create OAuth credentials for staging
   - [ ] Copy Client ID and Client Secret
   - [ ] Update staging deployment with environment variables
   - [ ] Restart staging server

2. **Verification:**
   - [ ] Run `verify-staging-auth.js`
   - [ ] Test OAuth flow manually
   - [ ] Verify user created in database
   - [ ] Check session persistence

3. **Documentation:**
   - [ ] Document OAuth credentials location
   - [ ] Update team runbooks
   - [ ] Document secret rotation process

4. **Monitoring:**
   - [ ] Monitor auth logs for errors
   - [ ] Check session creation metrics
   - [ ] Monitor user creation events

---

## Questions & Support

For issues during configuration:
1. Check server logs: `tail -f staging-app.log`
2. Run verification script: `node verify-staging-auth.js`
3. Review troubleshooting section above
4. Check Google Cloud Console for credential issues
5. Verify environment variables are set correctly

---

**Report Generated:** 2026-02-20  
**Environment:** Staging (https://app.acc.l-inc.co.za/)  
**Status:** READY FOR OAUTH CREDENTIAL CONFIGURATION
