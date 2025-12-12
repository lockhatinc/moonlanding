# Google Cloud Platform Setup Guide

## ✅ Completed Steps

### 1. GCP Project Creation
- **Project**: `moonlanding-platform`
- **Status**: Active and configured
- **Region**: Default (global)

### 2. APIs Enabled
- ✅ Google Drive API
- ✅ Google Sheets API
- ✅ Google Docs API
- ✅ Google Calendar API
- ✅ Gmail API (scopes needed)

### 3. Service Account
- **Name**: `moonlanding-app`
- **Email**: `moonlanding-app@moonlanding-platform.iam.gserviceaccount.com`
- **Key**: Generated and saved locally
- **Status**: Active and tested

### 4. Google Drive Folder
- **Name**: Moonlanding Platform
- **ID**: `1dMtSsVTmWb5RK0RlOTbxmCEsjDw7bhNx`
- **Access**: Service account has full access
- **Link**: https://drive.google.com/drive/folders/1dMtSsVTmWb5RK0RlOTbxmCEsjDw7bhNx

## 🔄 Setup Instructions

### Step 1: Download Service Account Key

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Select project: `moonlanding-platform`
3. Click on `moonlanding-app` service account
4. Go to **Keys** tab
5. Click **Create Key** → **JSON**
6. Save the file as `config/service-account.json`

### Step 2: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Select project: `moonlanding-platform`
3. Click **Create Credentials** → **OAuth 2.0 Client IDs**
4. Choose **Web Application**
5. Configure:
   - **Name**: Moonlanding Platform
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback`
     - `http://localhost:3000/api/auth/callback/google`
     - (add production URL later)
6. Click **Create**
7. Copy:
   - **Client ID**
   - **Client Secret**

### Step 3: Update Environment Variables

Create/update `.env` file (copy from `.env.example`):

```bash
GOOGLE_CLIENT_ID=<your-client-id-from-step-2>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-step-2>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_SERVICE_ACCOUNT_PATH=./config/service-account.json
GOOGLE_DRIVE_FOLDER_ID=1dMtSsVTmWb5RK0RlOTbxmCEsjDw7bhNx
GMAIL_SENDER_EMAIL=<your-email@domain.com>
GCP_PROJECT_ID=moonlanding-platform
NODE_ENV=development
```

### Step 4: Configure OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/consent)
2. Choose **External** (for development)
3. Fill in:
   - **App name**: Moonlanding Platform
   - **User support email**: your-email@domain.com
   - **Developer contact**: your-email@domain.com
4. Add **Scopes**:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/drive.file`
5. Save and publish

### Step 5: Test Authentication

Run the authentication test:

```bash
pnpm node test-auth.mjs
```

Expected output:
```
✅ Passed: 7
❌ Failed: 0
✨ AUTHENTICATION SETUP COMPLETE
```

## 📊 Configuration Summary

### Service Account Details
```
Project: moonlanding-platform
Email: moonlanding-app@moonlanding-platform.iam.gserviceaccount.com
Key: config/service-account.json (local only, not in git)
Scopes:
  - drive
  - drive.file
  - sheets
  - docs
  - calendar
```

### Drive Folder
```
Name: Moonlanding Platform
ID: 1dMtSsVTmWb5RK0RlOTbxmCEsjDw7bhNx
Access: Service account (read/write)
```

### OAuth Configuration
```
Redirect URIs:
  - http://localhost:3000/api/auth/google/callback
  - http://localhost:3000/api/auth/callback/google

Scopes:
  - openid
  - email
  - profile
  - drive
  - drive.file
```

## 🚀 Deployment

### For Production
1. Set up a separate GCP project
2. Create OAuth credentials for your production domain
3. Update `GOOGLE_REDIRECT_URI` with production URL
4. Store `service-account.json` securely (use Google Secret Manager)
5. Use environment variables for all sensitive data

### Security Best Practices
- **Never commit** `config/service-account.json` to git
- Store secrets in environment variables or secret managers
- Use different credentials for dev/staging/production
- Rotate service account keys regularly
- Enable Secret Scanning on GitHub repository

## 📚 Resources

- [Google Cloud Console](https://console.cloud.google.com)
- [Google Drive API Docs](https://developers.google.com/drive/api)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Service Accounts Guide](https://cloud.google.com/docs/authentication/application-default-credentials)

## ✅ Verification Checklist

- [ ] GCP Project created
- [ ] APIs enabled (Drive, Sheets, Docs, Calendar)
- [ ] Service account created and key downloaded
- [ ] Drive folder created (ID: 1dMtSsVTmWb5RK0RlOTbxmCEsjDw7bhNx)
- [ ] OAuth 2.0 credentials created
- [ ] Client ID and Secret obtained
- [ ] OAuth consent screen configured
- [ ] Environment variables updated in .env
- [ ] `config/service-account.json` in `.gitignore`
- [ ] Authentication test passes: `pnpm node test-auth.mjs`
- [ ] App starts: `pnpm dev`
- [ ] Google login works on app

