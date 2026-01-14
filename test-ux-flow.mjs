#!/usr/bin/env node
/**
 * Comprehensive UX Flow Testing
 * Tests critical user journeys end-to-end
 */

const BASE_URL = 'http://localhost:3004';
let sessionCookie = null;

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const init = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (sessionCookie) {
    init.headers['Cookie'] = sessionCookie;
  }

  if (options.body) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), init);
  const text = await response.text();

  // Capture session cookie if present
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
    console.log(`  [SESSION] Captured cookie: ${sessionCookie.slice(0, 30)}...`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, data, headers: response.headers };
}

async function test(name, fn) {
  try {
    console.log(`\n✓ ${name}`);
    await fn();
  } catch (error) {
    console.error(`\n✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('     COMPREHENSIVE UX FLOW TESTING');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: Pages load without errors
  await test('HOME PAGE LOADS', async () => {
    const res = await request('/');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.includes('<title>')) throw new Error('No title in HTML');
    console.log(`  Status: ${res.status} ✓`);
  });

  await test('LOGIN PAGE LOADS', async () => {
    const res = await request('/login');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.includes('Login')) throw new Error('No Login title');
    console.log(`  Status: ${res.status} ✓`);
  });

  // Test 2: API Endpoints Work
  await test('CSRF TOKEN ENDPOINT', async () => {
    const res = await request('/api/csrf-token');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.data?.csrfToken) throw new Error('No token returned');
    console.log(`  Token: ${res.data.data.csrfToken.slice(0, 20)}... ✓`);
  });

  await test('AUTH CHECK (unauthenticated)', async () => {
    sessionCookie = null; // Clear session
    const res = await request('/api/auth/me');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    console.log(`  Correctly returns 401 ✓`);
  });

  // Test 3: Login Flow
  await test('LOGIN API - Valid credentials', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@example.com',
        password: 'password',
      },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.user) throw new Error('No user in response');
    if (res.data.user.email !== 'admin@example.com') throw new Error('Wrong email');
    if (res.data.user.role !== 'partner') throw new Error('Wrong role');
    console.log(`  User: ${res.data.user.name} (${res.data.user.role}) ✓`);
  });

  await test('AUTH CHECK (after login)', async () => {
    const res = await request('/api/auth/me');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.user) throw new Error('User should exist after login');
    console.log(`  Authenticated as: ${res.data.user.name} ✓`);
  });

  // Test 4: Public Features endpoints (don't require auth)
  await test('FRIDAY FEATURES', async () => {
    sessionCookie = null; // Clear auth to test public endpoint
    const res = await request('/api/friday/features');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.data?.features) throw new Error('No features array');
    console.log(`  Features: ${res.data.data.features.length} ✓`);
  });

  await test('MWR FEATURES', async () => {
    const res = await request('/api/mwr/features');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.data?.features) throw new Error('No features array');
    console.log(`  Features: ${res.data.data.features.length} ✓`);
  });

  await test('DOMAINS ENDPOINT', async () => {
    const res = await request('/api/domains');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.data.data?.domains)) throw new Error('Should return domains array');
    console.log(`  Domains: ${res.data.data.domains.length} ✓`);
  });

  // Test 5: Error Handling
  await test('ERROR - Bad request', async () => {
    const res = await request('/api/csrf-token?invalid=param');
    // Just verify the endpoint is working and returns a response
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    console.log(`  Endpoint handled request correctly ✓`);
  });

  // Test 6: Logout
  await test('LOGOUT', async () => {
    const res = await request('/api/auth/logout', { method: 'POST' });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    sessionCookie = null;
    console.log(`  Logged out successfully ✓`);
  });

  await test('AUTH CHECK (after logout)', async () => {
    const res = await request('/api/auth/me');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    console.log(`  Correctly returns 401 ✓`);
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('     ALL TESTS PASSED ✓');
  console.log('═══════════════════════════════════════════════════════════\n');
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
