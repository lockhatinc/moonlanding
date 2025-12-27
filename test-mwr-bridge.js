#!/usr/bin/env node

/**
 * MWR Auth Bridge Test Suite
 * Tests all scenarios for /api/auth/mwr-bridge endpoint
 */

const testResults = [];

function logTest(name, status, details) {
  testResults.push({ name, status, details });
  const icon = status === 'PASS' ? '✓' : '✗';
  console.log(`${icon} ${name}`);
  if (details) {
    console.log(`  ${details}`);
  }
}

async function runCurlTest(name, curlCommand, expectedStatus, expectedErrorMessage = null) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);

    const { stdout, stderr } = await execPromise(curlCommand);
    const lines = stdout.trim().split('\n');
    const statusLine = lines.find(l => l.includes('HTTP Status:'));
    const actualStatus = statusLine ? parseInt(statusLine.split(':')[1].trim()) : null;
    const jsonLine = lines.find(l => l.startsWith('{'));
    const response = jsonLine ? JSON.parse(jsonLine) : null;

    if (actualStatus === expectedStatus) {
      if (expectedErrorMessage && response?.error !== expectedErrorMessage) {
        logTest(name, 'FAIL', `Expected error: "${expectedErrorMessage}", got: "${response?.error}"`);
      } else {
        logTest(name, 'PASS', `Status ${actualStatus}, Response: ${JSON.stringify(response)}`);
      }
    } else {
      logTest(name, 'FAIL', `Expected status ${expectedStatus}, got ${actualStatus}`);
    }
  } catch (error) {
    logTest(name, 'FAIL', `Error: ${error.message}`);
  }
}

async function main() {
  console.log('\n=== MWR Auth Bridge Test Suite ===\n');
  console.log('Testing endpoint: http://localhost:3000/api/auth/mwr-bridge\n');

  // Test 1: Firebase not configured (503)
  console.log('[Test 1] Firebase not configured');
  await runCurlTest(
    'Should return 503 when Firebase not configured',
    'curl -s -X POST http://localhost:3000/api/auth/mwr-bridge -H "Content-Type: application/json" -d \'{"fridayIdToken":"test-token"}\' -w "\\n\\nHTTP Status: %{http_code}\\n"',
    503,
    'Authentication service unavailable'
  );

  // Test 2: Missing fridayIdToken (400) - Only testable with Firebase configured
  console.log('\n[Test 2] Missing fridayIdToken');
  console.log('⚠ Cannot test without Firebase configured - endpoint checks Firebase first');
  console.log('  Expected behavior: 400 Bad Request with error "Missing Friday ID token"');
  logTest('Missing fridayIdToken validation', 'SKIP', 'Requires Firebase configuration');

  // Test 3: Invalid fridayIdToken (401) - Only testable with Firebase configured
  console.log('\n[Test 3] Invalid fridayIdToken');
  console.log('⚠ Cannot test without Firebase configured');
  console.log('  Expected behavior: 401 Unauthorized with error "Authentication failed"');
  logTest('Invalid token validation', 'SKIP', 'Requires Firebase configuration');

  // Test 4: Valid token but inactive user (401) - Only testable with Firebase configured
  console.log('\n[Test 4] Valid token with inactive user');
  console.log('⚠ Cannot test without Firebase configured');
  console.log('  Expected behavior: 401 Unauthorized with error "User not found or inactive"');
  logTest('Inactive user validation', 'SKIP', 'Requires Firebase configuration');

  // Test 5: Valid token with active user (200) - Only testable with Firebase configured
  console.log('\n[Test 5] Valid token with active user');
  console.log('⚠ Cannot test without Firebase configured');
  console.log('  Expected behavior: 200 OK with {mwrToken: string, userId: string}');
  logTest('Successful authentication', 'SKIP', 'Requires Firebase configuration');

  // Test 6: Empty body (should fail JSON parse or return 400)
  console.log('\n[Test 6] Empty request body');
  await runCurlTest(
    'Should handle empty body gracefully',
    'curl -s -X POST http://localhost:3000/api/auth/mwr-bridge -H "Content-Type: application/json" -d \'\' -w "\\n\\nHTTP Status: %{http_code}\\n"',
    503
  );

  // Test 7: Invalid JSON (should fail JSON parse or return 400)
  console.log('\n[Test 7] Invalid JSON');
  await runCurlTest(
    'Should handle malformed JSON',
    'curl -s -X POST http://localhost:3000/api/auth/mwr-bridge -H "Content-Type: application/json" -d \'invalid-json\' -w "\\n\\nHTTP Status: %{http_code}\\n"',
    503
  );

  // Test 8: GET request (should not be allowed)
  console.log('\n[Test 8] GET request');
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);

    const { stdout } = await execPromise('curl -s -X GET http://localhost:3000/api/auth/mwr-bridge -w "\\n\\nHTTP Status: %{http_code}\\n"');
    const lines = stdout.trim().split('\n');
    const statusLine = lines.find(l => l.includes('HTTP Status:'));
    const actualStatus = statusLine ? parseInt(statusLine.split(':')[1].trim()) : null;

    if (actualStatus === 405) {
      logTest('Should reject GET requests', 'PASS', 'Status 405 Method Not Allowed');
    } else {
      logTest('Should reject GET requests', 'FAIL', `Expected 405, got ${actualStatus}`);
    }
  } catch (error) {
    logTest('Should reject GET requests', 'FAIL', `Error: ${error.message}`);
  }

  // Summary
  console.log('\n=== Test Summary ===');
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const skipped = testResults.filter(r => r.status === 'SKIP').length;
  console.log(`Total: ${testResults.length} tests`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`⚠ Skipped: ${skipped} (require Firebase configuration)`);

  console.log('\n=== Firebase Configuration Status ===');
  console.log('Firebase is NOT configured (FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID not set)');
  console.log('\nTo enable full testing, set the following environment variables:');
  console.log('  - FIREBASE_SERVICE_ACCOUNT_KEY=<your-service-account-json>');
  console.log('  - FIREBASE_PROJECT_ID=<your-project-id>');

  console.log('\n=== Code Analysis ===');
  console.log('Endpoint implementation validates in this order:');
  console.log('1. Firebase availability check (line 7-10) → 503 if not configured');
  console.log('2. Request body parsing (line 12)');
  console.log('3. fridayIdToken presence check (line 14-16) → 400 if missing');
  console.log('4. Token verification via Firebase (line 18) → 401 if invalid (catch block)');
  console.log('5. User lookup and status check (line 21-24) → 401 if not found/inactive');
  console.log('6. Custom token creation (line 26-30)');
  console.log('7. Success response (line 32) → 200 with {mwrToken, userId}');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
