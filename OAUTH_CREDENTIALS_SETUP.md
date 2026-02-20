# Google OAuth 2.0 Credentials Setup for Staging

## Quick Summary

The staging environment at `https://app.acc.l-inc.co.za/` needs Google OAuth 2.0 credentials to enable "Sign in with Google" functionality.

**What needs to be done:**
1. Create an OAuth 2.0 Web Client in Google Cloud Console
2. Set environment variables on the staging server
3. Test the OAuth flow

---

## Step-by-Step Instructions

### Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
2. Ensure you're logged in as admin@coas.co.za
3. Verify the project is set to "moonlanding-platform"

### Step 2: Configure OAuth Consent Screen (if not done)

1. Click "OAuth consent screen" in left sidebar
2. Select "External" for user type (unless you have a Google Workspace domain)
3. Fill in the form:
   - **App name:** Moonlanding
   - **User support email:** admin@coas.co.za
   - **Developer contact:** admin@coas.co.za
4. Add scopes:
   - `openid` (for ID token)
   - `email` (for user email)
   - `profile` (for user name and picture)
5. Add test users:
   - admin@coas.co.za
   - (any other Google accounts that need early access)
6. Click "Save and Continue" → "Save and Continue" again

### Step 3: Create OAuth 2.0 Client ID

1. Go to: https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
2. Click **"+ Create Credentials"** button
3. Select **"OAuth 2.0 Client ID"**
4. Choose **"Web application"** as the Application type
5. Enter the name: **"Moonlanding Staging"**
6. Under "Authorized JavaScript origins", add:
   ```
   https://app.acc.l-inc.co.za
   ```
7. Under "Authorized redirect URIs", add:
   ```
   https://app.acc.l-inc.co.za/api/auth/google/callback
   ```
8. Click **"Create"**
9. A popup will show your credentials:
   - **Client ID:** (copy this)
   - **Client Secret:** (copy this)
10. Click **"Download JSON"** to save for backup, then close

### Step 4: Update Staging Environment Variables

Now that you have the Client ID and Client Secret, they need to be set on the staging server.

**Where to set them depends on your deployment:**

#### Option A: If using `.env` file on server
```bash
# SSH into staging server and edit .env
ssh user@app.acc.l-inc.co.za

# Edit the file
nano .env

# Add or update these lines:
GOOGLE_CLIENT_ID=<paste-your-client-id-here>
GOOGLE_CLIENT_SECRET=<paste-your-client-secret-here>
GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback

# Save (Ctrl+O, Enter, Ctrl+X)
```

#### Option B: If using Docker environment variables
```bash
# Update your Docker Compose or Docker run command:
docker run -e GOOGLE_CLIENT_ID=<your-id> \
           -e GOOGLE_CLIENT_SECRET=<your-secret> \
           -e GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback \
           ...
```

#### Option C: If using Kubernetes secrets
```bash
kubectl create secret generic google-oauth \
  --from-literal=GOOGLE_CLIENT_ID=<your-id> \
  --from-literal=GOOGLE_CLIENT_SECRET=<your-secret>

# Then reference in your deployment YAML:
env:
  - name: GOOGLE_CLIENT_ID
    valueFrom:
      secretKeyRef:
        name: google-oauth
        key: GOOGLE_CLIENT_ID
  - name: GOOGLE_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: google-oauth
        key: GOOGLE_CLIENT_SECRET
  - name: GOOGLE_REDIRECT_URI
    value: "https://app.acc.l-inc.co.za/api/auth/google/callback"
```

#### Option D: If using Cloud Run
```bash
gcloud run deploy moonlanding \
  --set-env-vars="GOOGLE_CLIENT_ID=<your-id>,GOOGLE_CLIENT_SECRET=<your-secret>,GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback" \
  --project=moonlanding-platform
```

### Step 5: Restart the Staging Server

After updating environment variables, restart the application:

```bash
# If using systemd
sudo systemctl restart moonlanding

# If using Docker
docker restart <container-name>

# If using Kubernetes
kubectl rollout restart deployment/moonlanding

# If using Cloud Run (auto-deploys)
# No action needed - already updated
```

Wait 30 seconds for the server to fully start.

### Step 6: Verify Configuration

Run the verification script to confirm setup:

```bash
# From local machine, in the moonlanding directory:
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

### Test 1: Manual Browser Test

1. Visit: https://app.acc.l-inc.co.za/login
2. You should see:
   - Email/password form
   - "Sign in with Google" button
3. Click "Sign in with Google"
4. You should be redirected to Google accounts (not an error page)
5. Sign in with your Google account
6. Accept permissions if prompted
7. You should be redirected back to the app logged in

### Test 2: Automated Verification

```bash
node verify-staging-auth.js
```

### Test 3: Database Verification

After successful Google login, verify the user was created:

```bash
# SSH to staging server
ssh user@app.acc.l-inc.co.za

# Check database
sqlite3 data/app.db "SELECT id, email, name, avatar FROM users WHERE email='admin@coas.co.za';"

# Expected output:
# Some-UUID | admin@coas.co.za | Your Name | https://lh3.googleusercontent.com/...
```

---

## Troubleshooting

### Problem: "Sign in with Google" button not visible on login page

**Cause:** `GOOGLE_CLIENT_ID` is empty or not set

**Fix:**
1. Verify environment variable is set: `echo $GOOGLE_CLIENT_ID`
2. Should show your actual client ID, not empty
3. Restart the server
4. Check logs for: `[Engine] Google OAuth configured: true`

### Problem: Google redirect shows "invalid_client" error

**Cause:** Client ID and secret don't match, or redirect URI is wrong

**Fix:**
1. Check Google Cloud Console credentials are correct
2. Verify `GOOGLE_REDIRECT_URI` exactly matches what's in Google Console:
   - Must be: `https://app.acc.l-inc.co.za/api/auth/google/callback`
   - No typos, no trailing slash
3. Ensure credentials are for the right project (moonlanding-platform)

### Problem: Redirect URI mismatch error

**Cause:** The staging domain is https but Google Console expects http, or vice versa

**Fix:**
1. In Google Cloud Console, edit the OAuth 2.0 Client ID
2. Check "Authorized redirect URIs" - must be HTTPS for production
3. If showing http://localhost:3000, delete that and add the staging domain
4. Save changes
5. Wait 2-3 minutes for changes to propagate
6. Try login again

### Problem: "state_mismatch" or "code_verifier" error

**Cause:** Session cookies not persisting properly

**Fix:**
1. Clear browser cookies for app.acc.l-inc.co.za
2. Try login again
3. If persists, restart the server
4. Check that cookies are enabled in browser

### Problem: User not created in database after Google login

**Cause:** Database error or missing default role configuration

**Fix:**
1. Check server logs for errors: `tail -f staging-app.log`
2. Verify the `users` table exists: `sqlite3 data/app.db ".tables"`
3. Verify default role exists in config
4. Check database permissions

---

## Important Security Notes

1. **GOOGLE_CLIENT_SECRET is sensitive** - treat like a password
2. Never commit to version control
3. Never share publicly
4. If exposed, regenerate in Google Cloud Console
5. Only set on staging/production servers, not in repositories
6. Use secure environment variable management (secrets, not .env files checked in)

---

## Files Modified

None yet - this is just the setup process.

After setting credentials, these files reference them:
- `src/config/env.js` - Reads environment variables
- `src/app/api/auth/google/route.js` - OAuth initiation endpoint
- `src/app/api/auth/google/callback/route.js` - OAuth callback handler
- `src/ui/login-page.js` - Renders the login form with Google button

---

## Success Criteria

Configuration is complete when:

- [ ] Google Cloud Console has OAuth 2.0 Client ID created
- [ ] Client ID and Secret copied
- [ ] Staging environment variables set
- [ ] Server restarted
- [ ] `verify-staging-auth.js` passes all tests
- [ ] Manual login with Google works
- [ ] User created in database
- [ ] Session persists
- [ ] User can access protected pages
- [ ] Logout works correctly
- [ ] No errors in server logs

---

## References

- Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
- OAuth 2.0 Documentation: https://developers.google.com/identity/protocols/oauth2/web-server
- Setup Guide: See `staging-oauth-implementation-report.md`
- Verification Script: `verify-staging-auth.js`
