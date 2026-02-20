#!/usr/bin/env node

import fetch from 'node-fetch';

const STAGING_URL = 'https://app.acc.l-inc.co.za';

async function testEmailLogin() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING EMAIL/PASSWORD LOGIN (NO OAUTH REQUIRED)');
  console.log('='.repeat(80) + '\n');

  // Test credentials - these are demo credentials
  const testCredentials = [
    { email: 'admin@example.com', password: 'password', description: 'Demo admin account' },
    { email: 'admin@coas.co.za', password: 'password', description: 'Staging admin account' }
  ];

  for (const cred of testCredentials) {
    console.log(`\nTesting: ${cred.email} (${cred.description})`);
    console.log('-'.repeat(80));

    try {
      // Attempt login
      const response = await fetch(`${STAGING_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password
        })
      });

      console.log(`Status: ${response.status}`);

      if (response.status === 200) {
        const data = await response.json();
        console.log('✓ Login successful');
        console.log(`  User: ${data.user?.email}`);
        console.log(`  Session: ${response.headers.get('set-cookie') ? '✓ Cookie set' : '✗ No cookie'}`);
      } else if (response.status === 401 || response.status === 403) {
        console.log('✗ Invalid credentials');
      } else if (response.status === 400) {
        const text = await response.text();
        console.log(`✗ Bad request: ${text.substring(0, 100)}`);
      } else {
        const text = await response.text();
        console.log(`✗ Server error: ${text.substring(0, 100)}`);
      }
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('NOTE: Email/password login does NOT require Google OAuth setup');
  console.log('This is available as a fallback while OAuth is being configured');
  console.log('='.repeat(80) + '\n');
}

testEmailLogin().catch(console.error);
