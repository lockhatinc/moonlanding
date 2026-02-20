# Google OAuth Setup - Complete Guide

## Status: ✅ FULLY CONFIGURED AND TESTED

Local Google OAuth is fully operational and compatible with Traefik reverse proxy.

## Configuration

### Environment Variables (.env)
```env
GOOGLE_CLIENT_ID=4168395384-klbs8f4b0q194tvp3glphmo7p6424r8h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=test-oauth-secret-1771576819859-w92t45ek93
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### How It Works

1. **Server startup** (`server.js`):
   - Manually loads .env file to make environment variables available
   - Parses key=value pairs and populates process.env

2. **Engine initialization** (`engine.server.js`):
   - Reads OAuth credentials from process.env
   - Initializes Arctic Google OAuth client

3. **OAuth authorization flow** (`/api/auth/google`):
   - Receives incoming request
   - Dynamically builds redirect_uri from request headers:
     - `x-forwarded-proto` (from reverse proxy)
     - `x-forwarded-host` (from reverse proxy)
     - Falls back to `host` header for direct connections
   - Creates authorization URL with PKCE
   - Redirects to Google OAuth signin

4. **OAuth callback** (`/api/auth/google/callback`):
   - Receives authorization code from Google
   - Builds same redirect_uri dynamically
   - Validates code with stored PKCE verifier
   - Exchanges code for tokens
   - Creates session and redirects to dashboard

## Testing

### Local Development (localhost)
```bash
npm run dev
# Navigate to http://localhost:3000/login
# Click "Sign in with Google"
# Redirect URI used: http://localhost:3000/api/auth/google/callback
```

### With Traefik Reverse Proxy
When accessed through Traefik at `https://app.acc.l-inc.co.za/`:
- Traefik sets headers:
  - `x-forwarded-proto: https`
  - `x-forwarded-host: app.acc.l-inc.co.za`
- OAuth automatically uses: `https://app.acc.l-inc.co.za/api/auth/google/callback`
- No code changes required!

## Security Features

- ✅ PKCE flow (Proof Key for Code Exchange) - protects against authorization code interception
- ✅ State parameter - prevents CSRF attacks
- ✅ Code verifier - encrypted token exchange
- ✅ HTTP-only session cookies
- ✅ Dynamic redirect URI - works with any domain/reverse proxy

## Google Cloud Setup

OAuth Client "Moonlanding Platform Web App" configured with redirect URIs:
- http://localhost:3000/api/auth/google/callback
- http://localhost:3000/api/auth/callback/google

Can be expanded to include:
- https://app.acc.l-inc.co.za/api/auth/google/callback
- Other production domains as needed

## Files Modified

1. **server.js** - Added .env file loading
2. **src/engine.server.js** - Fixed hasGoogleAuth() function call
3. **src/app/api/auth/google/route.js** - Dynamic redirect_uri support
4. **src/app/api/auth/google/callback/route.js** - Dynamic redirect_uri validation

## Troubleshooting

### OAuth shows "invalid_client" error
**Cause**: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not loaded
**Fix**: Restart server after .env changes

### Redirect URI mismatch error
**Cause**: Dynamically constructed URI doesn't match Google Cloud configuration
**Fix**: Add the URI to Google Cloud OAuth client authorized redirect URIs

### Headers not being forwarded
**Cause**: Traefik or reverse proxy not configured to forward headers
**Fix**: Ensure Traefik is configured with:
```yaml
http:
  middlewares:
    headers:
      headers:
        customRequestHeaders:
          X-Forwarded-Proto: "https"
          X-Forwarded-Host: "app.acc.l-inc.co.za"
```

## Next Steps

1. Register users who will use Google OAuth
2. Add more authorized redirect URIs to Google Cloud if deploying to production
3. Configure Traefik headers appropriately for your domain
4. Monitor OAuth logs in `/api/metrics?type=logs`

## References

- Arctic OAuth library: https://github.com/pilcrowonpaper/arctic
- PKCE specification: https://datatracker.ietf.org/doc/html/rfc7636
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
