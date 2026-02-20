#!/usr/bin/env node

import fetch from 'node-fetch';

const STAGING_URL = 'https://app.acc.l-inc.co.za';
const OAUTH_ROUTE = '/api/auth/google';
const CALLBACK_ROUTE = '/api/auth/google/callback';

async function testOAuthConfig() {
  console.log('Testing Google OAuth Configuration for Staging');
  console.log('='.repeat(60));
  console.log(`Staging URL: ${STAGING_URL}`);
  console.log(`OAuth Route: ${OAUTH_ROUTE}`);
  console.log(`Callback Route: ${CALLBACK_ROUTE}`);
  console.log('');

  try {
    // Test if the OAuth route is accessible
    console.log('1. Testing OAuth route accessibility...');
    const oauthResponse = await fetch(`${STAGING_URL}${OAUTH_ROUTE}`, {
      method: 'GET',
      redirect: 'manual'
    });

    console.log(`   Status: ${oauthResponse.status}`);
    console.log(`   Location: ${oauthResponse.headers.get('location')}`);

    if (oauthResponse.status === 307 || oauthResponse.status === 302) {
      const location = oauthResponse.headers.get('location');
      if (location && location.includes('google')) {
        console.log('   ✓ OAuth route is configured and redirecting to Google');
      } else if (location && location.includes('error')) {
        console.log('   ✗ OAuth route returned error:', location);
      }
    } else if (oauthResponse.status === 500 || oauthResponse.status === 400) {
      const text = await oauthResponse.text();
      if (text.includes('GOOGLE_CLIENT_ID') || text.includes('OAuth not configured')) {
        console.log('   ✗ OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
      } else {
        console.log('   ✗ Server error:', text.substring(0, 200));
      }
    } else {
      console.log(`   ✗ Unexpected status: ${oauthResponse.status}`);
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }

  console.log('');
  console.log('Configuration Required:');
  console.log('='.repeat(60));
  console.log('To enable Google OAuth for staging, you must:');
  console.log('');
  console.log('1. Go to Google Cloud Console:');
  console.log('   https://console.cloud.google.com/apis/credentials?project=moonlanding-platform');
  console.log('');
  console.log('2. Create OAuth 2.0 Client ID (if not exists):');
  console.log('   - Type: Web application');
  console.log('   - Authorized JavaScript origins:');
  console.log('     * https://app.acc.l-inc.co.za');
  console.log('   - Authorized redirect URIs:');
  console.log('     * https://app.acc.l-inc.co.za/api/auth/google/callback');
  console.log('');
  console.log('3. Set environment variables on staging:');
  console.log('   GOOGLE_CLIENT_ID=<your_client_id>');
  console.log('   GOOGLE_CLIENT_SECRET=<your_client_secret>');
  console.log('   GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback');
  console.log('');
  console.log('4. Restart the staging server');
  console.log('');
  console.log('5. Test the login at: https://app.acc.l-inc.co.za/login');
}

testOAuthConfig().catch(console.error);
