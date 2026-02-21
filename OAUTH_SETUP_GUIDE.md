# Fix: Google OAuth Redirect URI Mismatch on Staging (Traefik Reverse Proxy)

## Problem
When accessing https://app.acc.l-inc.co.za (Traefik reverse proxy → localhost:3000), Google OAuth fails with:
```
Error 400: redirect_uri_mismatch
You can't sign in because this app sent an invalid request.
```

## Root Cause
Google Cloud Console doesn't have `https://app.acc.l-inc.co.za/api/auth/google/callback` registered as an authorized redirect URI.

## ✓ Good News: Code is Already Fixed
The application code (`src/app/api/auth/google/route.js` and `src/app/api/auth/google/callback/route.js`) already:
- Detects Traefik headers (`x-forwarded-proto`, `x-forwarded-host`)
- Dynamically builds the correct redirect URI
- Works with any domain/reverse proxy combination

**Example:** When you access via Traefik:
1. Browser requests `https://app.acc.l-inc.co.za/api/auth/google`
2. Traefik forwards to `http://localhost:3000/api/auth/google`
3. Code detects headers and builds redirect URI: `https://app.acc.l-inc.co.za/api/auth/google/callback`
4. Creates Google OAuth client with that dynamic URI
5. Google validates the URI... **and fails because it's not registered** ❌

## Solution: Register the Staging Redirect URI in Google Cloud Console

### Quick Steps
1. **Go to:** https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
2. **Sign in** with admin@coas.co.za
3. **Find** the OAuth 2.0 Client ID row (should show the client ID: `4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com`)
4. **Click** on it to edit
5. **Scroll to** "Authorized redirect URIs" section
6. **Add** this URI:
   ```
   https://app.acc.l-inc.co.za/api/auth/google/callback
   ```
7. **Click** "SAVE"
8. **Wait** ~30 seconds for changes to propagate
9. **Test** at https://app.acc.l-inc.co.za/login → "Sign in with Google"

### Expected Result
- ✓ "Sign in with Google" button visible
- ✓ Click initiates OAuth flow
- ✓ Google login page appears
- ✓ After auth, user is created and logged in

## Current Registered URIs
These should already be there (for local development):
- `http://localhost:3000/api/auth/google/callback` (local dev)

After the fix, these will be registered:
- `http://localhost:3000/api/auth/google/callback` (local dev)
- `https://app.acc.l-inc.co.za/api/auth/google/callback` (staging via Traefik)

## Why This Works with Traefik
Traefik (reverse proxy) adds these headers:
```
x-forwarded-proto: https
x-forwarded-host: app.acc.l-inc.co.za
```

The code reads these and constructs the correct redirect URI:
```javascript
const protocol = request.headers['x-forwarded-proto'] || 'http';
const host = request.headers['x-forwarded-host'] || request.headers.host;
const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
// Result: https://app.acc.l-inc.co.za/api/auth/google/callback
```

## Alternative: Environment Variable (Not Needed - Already Fixed)
If you needed to override the redirect URI for some reason, you could set:
```
GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback
```
But **this is not necessary** because the code auto-detects it from headers.

## Testing Locally
Local development still works as before:
- Visit http://localhost:3000/login
- Click "Sign in with Google"
- Should work without changes (uses `http://localhost:3000/api/auth/google/callback`)

## Troubleshooting
If it still doesn't work after adding the URI:

1. **Wait 30-60 seconds** - Google Cloud changes take time to propagate
2. **Clear browser cache** - Try in an incognito window
3. **Verify the URI** - Make sure it's exactly: `https://app.acc.l-inc.co.za/api/auth/google/callback` (no trailing slash)
4. **Check Traefik headers** - Verify proxy is sending correct headers (check server logs)
5. **Restart server** - Not usually necessary, but can help

## Configuration Files
- **Route logic:** `src/app/api/auth/google/route.js`
- **Callback handler:** `src/app/api/auth/google/callback/route.js`
- **OAuth config:** `src/config/env.js`
- **Environment file:** `.env` (has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`)

