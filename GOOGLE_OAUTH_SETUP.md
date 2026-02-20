# Google OAuth 2.0 Setup Guide for Moonlanding

## Current Status

✓ Service account created and configured
✓ Service account key downloaded to `config/service-account.json`
✓ APIs enabled: Google Drive, Gmail, OAuth2
✓ Auth routes implemented: Google OAuth flow + callback
✓ .env file partially configured

## What's Been Done

### 1. Service Account Configuration
- **Service Account Email:** moonlanding-app@moonlanding-platform.iam.gserviceaccount.com
- **Service Account Key:** `config/service-account.json`
- **Project ID:** moonlanding-platform
- **Status:** ✓ Ready

### 2. Environment Setup
The following have been configured in `.env`:
- `GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json`
- `GMAIL_SENDER_EMAIL=moonlanding-app@moonlanding-platform.iam.gserviceaccount.com`
- `GCP_PROJECT_ID=moonlanding-platform`
- `GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback`

### 3. OAuth Routes
The following OAuth routes are implemented and ready:
- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Handles OAuth callback
- `POST /api/auth/login` - Email/password login (fallback)
- `GET /api/auth/me` - Get current user info

## What Still Needs To Be Done

### Manual Step: Create OAuth 2.0 Credentials

Since the Google Cloud Console gcloud CLI doesn't support creating OAuth credentials, you must do this manually:

#### Step 1: Navigate to Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials?project=moonlanding-platform

#### Step 2: Configure OAuth Consent Screen (if not already done)
1. Click "Create Credentials" in the top right
2. Select "Configure Consent Screen" or go to the "OAuth consent screen" tab
3. Select **User Type: External**
4. Fill in the following:
   - **App name:** Moonlanding
   - **User support email:** admin@coas.co.za
   - **Developer contact information:** admin@coas.co.za
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Search for and add these scopes:
   - `openid`
   - `email`
   - `profile`
8. Click "Update" then "Save and Continue"
9. On "Test Users" page (optional), you can add test emails
10. Click "Back to Dashboard"

#### Step 3: Create OAuth 2.0 Client ID
1. Go back to Credentials (https://console.cloud.google.com/apis/credentials?project=moonlanding-platform)
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Select **Application type: Web application**
4. Name it: "Moonlanding Web Client"
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000`
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/google/callback`
7. Click "Create"
8. A popup will show your credentials. Copy:
   - **Client ID**
   - **Client Secret**

#### Step 4: Update Environment Variables
Run this command with the credentials from Step 3:

```bash
node scripts/setup-oauth.js --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
```

Or manually edit `.env` and set:
```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

#### Step 5: Verify Configuration
Run:
```bash
node scripts/verify-oauth.js
```

Expected output:
```
OAuth Configuration Status:
==================================================
✓ GOOGLE_CLIENT_ID configured
✓ GOOGLE_CLIENT_SECRET configured
✓ GOOGLE_REDIRECT_URI correct: http://localhost:3000/api/auth/google/callback
✓ Service account found: moonlanding-app@moonlanding-platform.iam.gserviceaccount.com

==================================================
✓ All OAuth credentials configured!

You can now start the server:
  npm run dev
```

#### Step 6: Start the Server
```bash
npm run dev
```

Visit http://localhost:3000 and test the Google login button.

## Testing the OAuth Flow

1. Start the server: `npm run dev`
2. Navigate to http://localhost:3000
3. Click "Sign in with Google" button
4. You'll be redirected to Google's login page
5. After authenticating, you'll be redirected back to the app
6. A new user account will be automatically created with your Google profile info

## Troubleshooting

### Error: "GOOGLE_CLIENT_ID not configured"
- Make sure you've created the OAuth 2.0 Web Client credentials in Google Cloud Console
- Run `node scripts/verify-oauth.js` to check your configuration

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console matches exactly:
  - `http://localhost:3000/api/auth/google/callback`
- Check for trailing slashes and protocol (http vs https)

### OAuth consent screen not appearing
- Make sure you've configured the OAuth consent screen before creating credentials
- Go to: https://console.cloud.google.com/apis/consent?project=moonlanding-platform

### User not created after login
- Check the server logs for errors
- Verify the user's email doesn't already exist in the database
- Check that the default role exists in your configuration

## File Structure

```
moonlanding/
├── config/
│   └── service-account.json        # ✓ Created (GCP service account key)
├── scripts/
│   ├── setup-oauth.js              # ✓ Created (helper to update .env)
│   └── verify-oauth.js             # ✓ Created (verify configuration)
├── src/app/api/auth/
│   ├── google/
│   │   ├── route.js                # ✓ Initiates OAuth flow
│   │   └── callback/route.js       # ✓ Handles callback
│   ├── login/route.js              # ✓ Email/password login
│   └── logout/route.js             # ✓ Logout
└── .env                            # Partially configured
```

## Architecture

The OAuth flow works as follows:

1. User clicks "Sign in with Google" button
2. Browser navigates to `/api/auth/google`
3. Server redirects to Google's OAuth consent screen
4. User authenticates with Google
5. Google redirects back to `/api/auth/google/callback` with authorization code
6. Server validates the code and exchanges it for tokens
7. Server fetches user info from Google's APIs
8. Server creates/finds user in database and creates session
9. User is redirected to home page and logged in

## Next Steps

1. **Complete the manual OAuth credential creation** (see Step 1-3 above)
2. **Update .env file** with the Client ID and Secret (Step 4)
3. **Verify the setup** (Step 5)
4. **Test the OAuth flow** (Step 6)
5. **Monitor logs** for any issues during testing

## Security Notes

- The service account key is sensitive. Never commit it to version control.
- The `GOOGLE_CLIENT_SECRET` is sensitive. Never share it publicly.
- OAuth credentials are scoped to `openid`, `email`, and `profile` only.
- All OAuth state is validated to prevent CSRF attacks.
- Redirect URIs are strictly validated.

## Support

If you encounter issues:
1. Check server logs: `npm run dev`
2. Run verification script: `node scripts/verify-oauth.js`
3. Review this guide's troubleshooting section
4. Check Google Cloud Console for OAuth consent screen and credentials configuration
