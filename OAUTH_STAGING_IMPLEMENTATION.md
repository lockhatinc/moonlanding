# Google OAuth 2.0 Staging Implementation

**Status:** Ready for Configuration  
**Target Environment:** https://app.acc.l-inc.co.za/  
**GCP Project:** moonlanding-platform  
**Created:** 2026-02-20

---

## Overview

The staging environment for Moonlanding has complete OAuth infrastructure in place. The application is ready to authenticate users via Google Sign-in. What's missing are the OAuth 2.0 credentials from Google Cloud Console.

This guide provides step-by-step instructions to:
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Configure the staging server with those credentials
3. Test the complete OAuth flow
4. Verify user creation and session management

---

## What's Ready

### Application Infrastructure
- ✓ OAuth 2.0 routes implemented (`/api/auth/google` and callback)
- ✓ Session management configured (Lucia + SQLite)
- ✓ User database schema ready
- ✓ Login page with "Sign in with Google" button
- ✓ CSRF protection via state parameter
- ✓ User profile picture storage
- ✓ Hot reload system supports OAuth config changes

### Current Issue
- ✗ `GOOGLE_CLIENT_ID` environment variable: **NOT SET** (empty)
- ✗ `GOOGLE_CLIENT_SECRET` environment variable: **NOT SET** (empty)
- Result: Login page shows Google button, but clicking it causes `client_id=undefined` error

---

## Quick Start (5 Steps)

### 1. Create OAuth Credentials in Google Cloud Console (5 min)

**URL:** https://console.cloud.google.com/apis/credentials?project=moonlanding-platform

Steps:
1. Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
2. Select **"Web application"**
3. Name it: **"Moonlanding Staging"**
4. Add JavaScript origin: `https://app.acc.l-inc.co.za`
5. Add redirect URI: `https://app.acc.l-inc.co.za/api/auth/google/callback`
6. Click **"Create"**
7. Copy the **Client ID** and **Client Secret** from the popup

### 2. Update Staging Environment (2 min)

SSH to staging server and update `.env`:

```bash
ssh user@app.acc.l-inc.co.za
cd /path/to/moonlanding

# Edit .env and add:
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback
```

Or use the automated script:

```bash
./setup-oauth-staging.sh
```

### 3. Restart Server (1 min)

```bash
sudo systemctl restart moonlanding
# or: docker restart moonlanding
```

Wait 30 seconds for full startup.

### 4. Verify Configuration (2 min)

From your local machine:

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
  - Client ID: ✓ 1234567890...apps.googleusercontent.com
  - Redirect URI: https://app.acc.l-inc.co.za/api/auth/google/callback
```

### 5. Test OAuth Flow (3 min)

1. Visit: https://app.acc.l-inc.co.za/login
2. Click "Sign in with Google"
3. Sign in with admin@coas.co.za
4. Accept permissions
5. You should be logged in to Moonlanding dashboard

**Success:** You see your name and email on the dashboard.

---

## Detailed Instructions

### Part 1: Create Google OAuth Credentials

#### A. Check if OAuth Consent Screen is Configured

1. Go to: https://console.cloud.google.com/apis/consent?project=moonlanding-platform
2. If you see "OAuth consent screen has not been configured" → Configure it first
3. Otherwise, skip to Part B

**To Configure OAuth Consent Screen:**

1. Click "Create Consent Screen"
2. Select "External" user type
3. Fill form:
   - App name: **Moonlanding**
   - User support email: **admin@coas.co.za**
   - Developer email: **admin@coas.co.za**
4. Click "Save and Continue"
5. Add scopes (click "Add or Remove Scopes"):
   - Search for and select:
     - `openid` (OpenID Connect)
     - `email` (Google Identity)
     - `profile` (Google Identity)
   - Click "Update"
6. Click "Save and Continue"
7. Add test users:
   - Click "Add Users"
   - Enter: admin@coas.co.za
   - Click "Add"
8. Click "Save and Continue" → "Back to Dashboard"

#### B. Create OAuth 2.0 Client ID

1. Go to: https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth 2.0 Client ID"** from dropdown
4. Choose **"Web application"** as the application type
5. In "Name" field, enter: **"Moonlanding Staging"**

6. In "Authorized JavaScript origins", click "Add URI":
   ```
   https://app.acc.l-inc.co.za
   ```

7. In "Authorized redirect URIs", click "Add URI":
   ```
   https://app.acc.l-inc.co.za/api/auth/google/callback
   ```

8. Click **"Create"**

9. **Important:** Copy the displayed credentials:
   - **Client ID:** (looks like `123456789-abcdefg.apps.googleusercontent.com`)
   - **Client Secret:** (alphanumeric string, keep this safe)

10. Click **"Download JSON"** to save for backup

11. Close the popup

### Part 2: Configure Staging Server

#### Option A: Manual Configuration (Recommended)

SSH to the staging server:

```bash
ssh user@app.acc.l-inc.co.za
cd /path/to/moonlanding

# Create backup
cp .env .env.backup

# Edit with your preferred editor
nano .env
# or
vi .env
```

Add or update these lines:

```bash
GOOGLE_CLIENT_ID=<paste-your-client-id>
GOOGLE_CLIENT_SECRET=<paste-your-client-secret>
GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback
```

Save the file.

#### Option B: Automated Script

On the staging server:

```bash
cd /path/to/moonlanding
./setup-oauth-staging.sh
```

Follow the prompts to enter Client ID and Client Secret.

#### Option C: Using Cloud Run (if deployed there)

```bash
gcloud run deploy moonlanding \
  --set-env-vars="GOOGLE_CLIENT_ID=<your-id>,GOOGLE_CLIENT_SECRET=<your-secret>,GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback" \
  --project=moonlanding-platform
```

#### Option D: Using Docker

Update your docker-compose.yml or run command:

```yaml
# docker-compose.yml
services:
  moonlanding:
    environment:
      GOOGLE_CLIENT_ID: "<your-client-id>"
      GOOGLE_CLIENT_SECRET: "<your-client-secret>"
      GOOGLE_REDIRECT_URI: "https://app.acc.l-inc.co.za/api/auth/google/callback"
```

### Part 3: Restart Server

On the staging server:

```bash
# If using systemd
sudo systemctl restart moonlanding

# If using Docker
docker-compose restart moonlanding

# If using Docker directly
docker restart moonlanding

# If using Cloud Run
# Already deployed - no action needed
```

Wait 30 seconds for full server startup.

### Part 4: Verify Configuration

From your local development machine (in the moonlanding directory):

```bash
node verify-staging-auth.js
```

This script checks:
- Login page loads
- Google Sign-in button is present
- OAuth route redirects correctly
- Client ID is configured (not undefined)
- Redirect URI is correct

### Part 5: End-to-End Testing

#### Test 1: Login Page

1. Visit: https://app.acc.l-inc.co.za/login
2. Verify you see:
   - Email input field
   - Password input field
   - "Sign in with Google" button

#### Test 2: OAuth Flow

1. Click "Sign in with Google"
2. You should be redirected to: https://accounts.google.com/o/oauth2/v2/auth?...
   - URL should contain your actual client_id (NOT "undefined")
3. Sign in with a Google account (admin@coas.co.za recommended)
4. Accept permissions if prompted
5. You should be redirected back to: https://app.acc.l-inc.co.za/
6. You should be logged in (see dashboard, user menu with your name)

#### Test 3: Database Verification

SSH to staging server:

```bash
sqlite3 data/app.db << EOF
SELECT id, email, name, avatar FROM users 
WHERE email = 'admin@coas.co.za'
LIMIT 1;
EOF
```

Expected output:
```
some-uuid-here|admin@coas.co.za|Your Full Name|https://lh3.googleusercontent.com/...
```

#### Test 4: Session Persistence

1. Log in with Google
2. Reload the page (F5)
3. You should still be logged in (session persists)
4. Click logout
5. You should be logged out

---

## Troubleshooting

### Issue 1: "Sign in with Google" button missing from login page

**Symptom:** Login page shows email/password form but no Google button

**Cause:** `GOOGLE_CLIENT_ID` not set (empty)

**Solution:**
```bash
# Check if variable is set
echo $GOOGLE_CLIENT_ID
# Should show your client ID, not empty

# If empty, update .env
nano .env
# Add GOOGLE_CLIENT_ID=your-value

# Restart server
sudo systemctl restart moonlanding
```

### Issue 2: "invalid_client" error from Google

**Symptom:** Redirect to Google shows error page

**Cause:** Client ID/secret mismatch or redirect URI incorrect

**Solution:**
1. Verify in Google Cloud Console:
   - Credentials page shows your OAuth 2.0 Client ID
   - Client ID matches what's in .env
2. Check redirect URI EXACTLY matches:
   ```
   https://app.acc.l-inc.co.za/api/auth/google/callback
   ```
   - No typos, no trailing slash, HTTPS (not HTTP)
3. Wait 2-3 minutes for Google to propagate changes
4. Try again

### Issue 3: "state_mismatch" error

**Symptom:** OAuth flow redirects back with state_mismatch error

**Cause:** Session cookies not working properly

**Solution:**
1. Clear browser cookies for app.acc.l-inc.co.za
2. Try login again
3. If persists:
   - Restart server
   - Check that cookies are enabled in browser
   - Try in incognito window

### Issue 4: User not created in database after login

**Symptom:** Successfully authenticated with Google but no user in database

**Cause:** Database error or role configuration issue

**Solution:**
```bash
# Check database connection
sqlite3 data/app.db "SELECT 1;" 

# Check users table exists
sqlite3 data/app.db ".tables" | grep users

# Check default role exists
sqlite3 data/app.db "SELECT name FROM roles LIMIT 1;"

# Check server logs for errors
tail -f logs/app.log
```

### Issue 5: Redirect URI Mismatch in Google Cloud Console

**Symptom:** Google says "The redirect_uri parameter doesn't match..."

**Cause:** Registered redirect URI doesn't match what app sends

**Solution:**
1. Go to Google Cloud Console credentials page
2. Click on your OAuth 2.0 Client ID to edit
3. Check "Authorized redirect URIs" section
4. Ensure it contains EXACTLY:
   ```
   https://app.acc.l-inc.co.za/api/auth/google/callback
   ```
5. If it shows localhost or old domain:
   - Delete the old URI
   - Add the correct one
6. Save changes
7. Wait 2-3 minutes for propagation
8. Try again

---

## Security Considerations

### Credential Safety

- **GOOGLE_CLIENT_SECRET** is sensitive (like a password)
- Never commit to version control
- Never share in emails or chat
- If leaked, regenerate immediately in Google Cloud Console
- Store only in secure environment variable systems

### OAuth Security

- **Redirect URI validation:** Must use HTTPS in production
- **State parameter:** Prevents CSRF attacks (handled by code)
- **Scope minimization:** Only requesting openid, email, profile
- **Session security:** HTTP-only cookies, secure in production

### Production Checklist

- [ ] Use separate OAuth credentials for production domain
- [ ] Ensure HTTPS is enabled
- [ ] Set `NODE_ENV=production`
- [ ] Disable debug logging
- [ ] Configure secure session cookies
- [ ] Monitor OAuth logs for suspicious activity
- [ ] Set up alerts for auth failures

---

## Files Reference

### Configuration
- `.env` - Environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- `src/config/env.js` - Reads and validates environment
- `src/config/auth-config.js` - OAuth configuration

### OAuth Routes
- `src/app/api/auth/google/route.js` - Initiates OAuth flow
- `src/app/api/auth/google/callback/route.js` - Handles OAuth callback
- `src/lib/auth-route-helpers.js` - OAuth utility functions

### UI
- `src/ui/login-page.js` - Login form with Google button
- `src/ui/styles.css` - Styling for OAuth button

### Testing
- `verify-staging-auth.js` - Automated verification script
- `test-oauth-staging.js` - Manual OAuth testing
- `setup-oauth-staging.sh` - Automated setup script

### Documentation
- `OAUTH_CREDENTIALS_SETUP.md` - Setup instructions
- `staging-oauth-implementation-report.md` - Status report
- This file: `OAUTH_STAGING_IMPLEMENTATION.md`

---

## Success Criteria Checklist

Mark as complete when:

- [ ] **Google Cloud Console:**
  - [ ] OAuth 2.0 Client ID created for staging domain
  - [ ] Client ID copied
  - [ ] Client Secret copied
  - [ ] Authorized origins: https://app.acc.l-inc.co.za
  - [ ] Authorized redirect URI: https://app.acc.l-inc.co.za/api/auth/google/callback

- [ ] **Staging Server:**
  - [ ] GOOGLE_CLIENT_ID set in .env
  - [ ] GOOGLE_CLIENT_SECRET set in .env
  - [ ] GOOGLE_REDIRECT_URI set correctly
  - [ ] Server restarted
  - [ ] No errors in startup logs

- [ ] **Application:**
  - [ ] Login page loads at https://app.acc.l-inc.co.za/login
  - [ ] "Sign in with Google" button visible
  - [ ] Clicking button redirects to Google (not error)

- [ ] **OAuth Flow:**
  - [ ] Can authenticate with Google
  - [ ] Can create user account (first login)
  - [ ] Can reuse existing account (subsequent logins)
  - [ ] Session persists across page reloads

- [ ] **Verification:**
  - [ ] `verify-staging-auth.js` passes all tests
  - [ ] User created in database
  - [ ] User profile visible in app (name, email, avatar)
  - [ ] Can logout successfully

---

## Additional Resources

- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2/web-server
- **Google Cloud Console:** https://console.cloud.google.com/
- **Project:** moonlanding-platform
- **GCP Credentials:** https://console.cloud.google.com/apis/credentials?project=moonlanding-platform

---

## Support

For issues:
1. Check the Troubleshooting section above
2. Review server logs: `tail -f logs/app.log`
3. Run verification: `node verify-staging-auth.js`
4. Check Google Cloud Console for credential configuration
5. Ensure staging domain is https://app.acc.l-inc.co.za (exact match)

---

**Last Updated:** 2026-02-20  
**Status:** Ready for Implementation
