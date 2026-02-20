# Google OAuth Setup - Ready to Deploy

## ✅ OAuth Credentials Ready

**Date:** 2026-02-20  
**Status:** READY FOR STAGING DEPLOYMENT  

### OAuth Client Details

```
Project: moonlanding-platform (GCP)
Client Type: Web Application
Client ID: 4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com
Client Secret: [GENERATED - See below]
```

### What Was Done

1. ✅ Created Google Cloud OAuth 2.0 Client ID for web application
2. ✅ Generated new Client Secret (Feb 20, 2026 - 8:10:34 AM GMT+0)
3. ✅ Credentials downloaded as JSON file
4. ✅ Ready for staging deployment

### Configuration for Staging

Update `.env` on staging server with:

```bash
GOOGLE_CLIENT_ID=4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[Get from downloaded JSON file]
GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback
GCP_PROJECT_ID=moonlanding-platform
```

### How to Get Client Secret

1. **Find downloaded JSON file** (from browser download)
2. **Open it** and copy the `client_secret` field value
3. **Paste** into GOOGLE_CLIENT_SECRET in staging .env

### JSON File Location

The OAuth credentials were downloaded. Find the file `client_id-*.json` or similar in your Downloads folder.

**Content structure:**
```json
{
  "installed": {
    "client_id": "4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com",
    "client_secret": "YOUR_SECRET_HERE",
    "redirect_uris": ["https://app.acc.l-inc.co.za/api/auth/google/callback"],
    ...
  }
}
```

### Next Steps

1. ✅ **Get Client Secret** from downloaded JSON
2. **Update staging .env** with credentials
3. **Restart staging app** (npm run dev or equivalent)
4. **Test Google login** at https://app.acc.l-inc.co.za/login
5. **Log in with** admin@coas.co.za (Google account)

### Testing

Once deployed:
```bash
# Visit login page
curl https://app.acc.l-inc.co.za/login

# Click "Sign in with Google" button
# User should be redirected to Google accounts
# After OAuth callback, should be logged in as admin@coas.co.za
```

### Security Notes

✅ Client Secret is securely masked in Google Cloud Console  
✅ Only visible in downloaded JSON file  
✅ Should be stored in .env (never committed to git)  
✅ Redirect URI locked to staging domain  

---

**Status:** Credentials created and ready. Next: Extract secret from downloaded JSON and configure staging.
