# OAuth 2.0 Setup Guide

## Project Details
- Project ID: moonlanding-platform
- Staging Domain: https://app.acc.l-inc.co.za
- Service Account: moonlanding-app@moonlanding-platform.iam.gserviceaccount.com

## Status
OAuth credentials have NOT been created yet. They must be created manually via GCP Console.

## Prerequisites
- Access to GCP Console with admin@coas.co.za
- moonlanding-platform project access

## Steps to Create OAuth Credentials


1. Open GCP Console:
   https://console.cloud.google.com/apis/credentials?project=moonlanding-platform

2. Click "Create Credentials" button

3. Select "OAuth 2.0 Client ID"

4. When prompted for application type:
   Select "Web application"

5. Fill in the form:
   - Name: "Moonlanding Staging"
   - Authorized redirect URIs:
     • https://app.acc.l-inc.co.za/api/auth/google/callback
     • http://localhost:3000/api/auth/google/callback

6. Click "Create"

7. In the dialog that appears:
   - Copy the "Client ID" value
   - Click "Download JSON" (or copy "Client secret" value)

8. Update .env file:
   GOOGLE_CLIENT_ID=<paste-client-id-here>
   GOOGLE_CLIENT_SECRET=<paste-client-secret-here>
   GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback

9. Save and restart the application

10. Test OAuth flow by visiting:
    https://app.acc.l-inc.co.za/login


## Verification
After setup, test with:
```bash
curl -X POST https://app.acc.l-inc.co.za/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coas.co.za","password":"..."}'
```

Or visit the login page and click "Sign in with Google".
