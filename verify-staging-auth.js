#!/usr/bin/env node

import fetch from 'node-fetch';

const STAGING_URL = 'https://app.acc.l-inc.co.za';

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('STAGING AUTHENTICATION VERIFICATION TESTS');
  console.log('='.repeat(80) + '\n');

  console.log(`Target: ${STAGING_URL}\n`);

  // Test 1: Check login page loads
  console.log('TEST 1: Login Page Accessibility');
  console.log('-'.repeat(80));
  try {
    const response = await fetch(`${STAGING_URL}/login`);
    if (response.ok) {
      const html = await response.text();
      const hasEmailForm = html.includes('type="email"');
      const hasPasswordForm = html.includes('type="password"');
      const hasGoogleButton = html.includes('Sign in with Google');
      
      console.log('✓ Login page loads (200 OK)');
      console.log(`  - Email form: ${hasEmailForm ? '✓' : '✗'}`);
      console.log(`  - Password form: ${hasPasswordForm ? '✓' : '✗'}`);
      console.log(`  - Google button: ${hasGoogleButton ? '✓' : '✗ (NOT CONFIGURED)'}`);
    } else {
      console.log(`✗ Login page failed: ${response.status}`);
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  // Test 2: Check OAuth route
  console.log('\nTEST 2: OAuth Route Configuration');
  console.log('-'.repeat(80));
  try {
    const response = await fetch(`${STAGING_URL}/api/auth/google`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`Status: ${response.status}`);
    const location = response.headers.get('location');
    
    if (location) {
      const url = new URL(location);
      const clientId = url.searchParams.get('client_id');
      const redirectUri = url.searchParams.get('redirect_uri');
      
      console.log(`✓ OAuth route redirects (${response.status})`);
      console.log(`  - Client ID: ${clientId === 'undefined' ? '✗ NOT CONFIGURED' : '✓ ' + clientId.substring(0, 20) + '...'}`);
      console.log(`  - Redirect URI: ${redirectUri}`);
      console.log(`  - Scope: ${url.searchParams.get('scope')}`);
      
      if (clientId !== 'undefined') {
        console.log('\n✓ GOOGLE OAUTH IS CONFIGURED');
      } else {
        console.log('\n✗ GOOGLE OAUTH NOT CONFIGURED - client_id=undefined');
        console.log('   Need to set GOOGLE_CLIENT_ID environment variable on staging');
      }
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  // Test 3: Check health endpoint
  console.log('\nTEST 3: Server Health Check');
  console.log('-'.repeat(80));
  try {
    const response = await fetch(`${STAGING_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Server is responding');
      console.log(`  - Database: ${data.database ? '✓' : '✗'}`);
      console.log(`  - Status: ${data.status}`);
    } else {
      console.log(`✗ Health check failed: ${response.status}`);
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('NEXT STEPS');
  console.log('='.repeat(80));
  console.log(`
1. CONFIGURE GOOGLE OAUTH:
   - Go to: https://console.cloud.google.com/apis/credentials?project=moonlanding-platform
   - Create OAuth 2.0 Client ID for: https://app.acc.l-inc.co.za
   - Add redirect URI: https://app.acc.l-inc.co.za/api/auth/google/callback

2. SET ENVIRONMENT VARIABLES on staging:
   - GOOGLE_CLIENT_ID=<your_client_id>
   - GOOGLE_CLIENT_SECRET=<your_client_secret>
   - GOOGLE_REDIRECT_URI=https://app.acc.l-inc.co.za/api/auth/google/callback

3. RESTART staging server and re-run this test

4. FOR EMAIL/PASSWORD LOGIN:
   - Use: admin@example.com / password (or configured credentials)
   - This should work immediately without OAuth setup

See: OAUTH_STAGING_SETUP_GUIDE.txt for detailed instructions
  `);
  console.log('='.repeat(80) + '\n');
}

runTests().catch(console.error);
