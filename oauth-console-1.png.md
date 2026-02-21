
# Google OAuth Redirect URI Fix - Summary

## Issue
Error 400: redirect_uri_mismatch when signing in with Google on staging (https://app.acc.l-inc.co.za/)

## Root Cause
The OAuth 2.0 Client in Google Cloud Console does not have the staging redirect URI registered.

## Solution

### Step 1: Access Google Cloud Console
Visit this direct link to edit the OAuth client:
https://console.cloud.google.com/apis/credentials/oauthclient/4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com?project=moonlanding-platform

### Step 2: Add Redirect URI
1. Scroll down to "Authorized redirect URIs" section
2. Click the "ADD URI" button
3. Enter this exact URI:
   https://app.acc.l-inc.co.za/api/auth/google/callback
4. Click "SAVE" button at the bottom of the page

### Step 3: Wait for Propagation
Wait 30-60 seconds for changes to propagate through Google's systems.

### Step 4: Verify Environment Variables (on staging server)
Ensure these are set:
```bash
GOOGLE_CLIENT_ID=4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your_secret>
```

Note: GOOGLE_REDIRECT_URI is NOT needed - the app uses dynamic detection.

### Step 5: Test
1. Visit: https://app.acc.l-inc.co.za/login
2. Click "Sign in with Google"
3. Complete authentication
4. Verify successful login

## Technical Details

### How Dynamic Redirect URI Works
The code in `src/app/api/auth/google/route.js` builds redirect URIs dynamically:

```javascript
const protocol = request.headers['x-forwarded-proto'] || 'http';
const host = request.headers['x-forwarded-host'] || request.headers.host;
const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
```

For staging with Traefik reverse proxy:
- x-forwarded-proto: "https"
- x-forwarded-host: "app.acc.l-inc.co.za"
- Result: "https://app.acc.l-inc.co.za/api/auth/google/callback"

### Required Redirect URIs in Google Cloud Console
The OAuth client must have these URIs registered:
1. http://localhost:3000/api/auth/google/callback (local dev)
2. https://app.acc.l-inc.co.za/api/auth/google/callback (staging)
3. https://your-production-domain/api/auth/google/callback (future production)

## Files Updated
- CLAUDE.md: Updated "Google OAuth Staging Configuration" section with complete documentation

## Verification
After adding the redirect URI, check server logs for:
```
[OAuth] Redirect URI: {
  'x-forwarded-proto': 'https',
  'x-forwarded-host': 'app.acc.l-inc.co.za',
  'computed-redirectUri': 'https://app.acc.l-inc.co.za/api/auth/google/callback'
}
```

## Status
✅ Root cause identified
✅ Solution documented
✅ CLAUDE.md updated
⏳ Awaiting manual fix in Google Cloud Console (cannot be automated)
