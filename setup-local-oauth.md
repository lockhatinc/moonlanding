# Local Google OAuth Setup

## Current Status

✅ OAuth Client Created in Google Cloud  
✅ Client ID: `4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com`  
✅ Client Secret: Generated (needs extraction)  

## How to Get Client Secret

Since the secret is masked in Google Cloud Console for security, you need to:

### Option 1: Copy from Downloaded JSON (RECOMMENDED)
1. Check your browser downloads folder
2. Find the `*.json` file that was downloaded
3. Open it and copy the `"client_secret"` value
4. Paste into local .env below

### Option 2: Generate New Secret via Google Cloud
1. Go to https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
2. Click "Moonlanding Platform Web App"
3. Click "Add client secret"
4. Copy the new secret immediately (before it gets masked)
5. Paste into local .env below

## Local Configuration

Update `.env` in `/config/workspace/moonlanding/`:

```bash
# Add to .env:
GOOGLE_CLIENT_ID=4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<paste-secret-here>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## Testing

1. Save .env
2. Restart: `npm run dev`
3. Visit http://localhost:3000/login
4. Click "Sign in with Google"
5. Log in with admin@coas.co.za

## Authorized URIs

Make sure Google Cloud has these configured:

**JavaScript Origins:**
- http://localhost:3000
- http://localhost:3000/ 

**Redirect URIs:**
- http://localhost:3000/api/auth/google/callback

