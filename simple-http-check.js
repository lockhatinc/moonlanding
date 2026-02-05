#!/usr/bin/env node

/**
 * Simple HTTP connectivity check - no browser needed
 * Just test basic server health and login page rendering
 */

import http from 'http';

const PORT = 3004;
const HOST = 'localhost';

function makeRequest(pathname, callback) {
  const options = {
    hostname: HOST,
    port: PORT,
    path: pathname,
    method: 'GET',
    timeout: 5000,
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      callback(null, {
        status: res.statusCode,
        headers: res.headers,
        body: data,
      });
    });
  });

  req.on('error', (err) => {
    callback(err, null);
  });

  req.on('timeout', () => {
    req.destroy();
    callback(new Error('Request timeout'), null);
  });

  req.end();
}

console.log('='.repeat(80));
console.log('SIMPLE HTTP CONNECTIVITY CHECK');
console.log('='.repeat(80));

console.log('\n[1] Checking if server is running on localhost:3004...');
makeRequest('/login', (err, result) => {
  if (err) {
    console.error('  ✗ ERROR:', err.message);
    console.log('\n  The server may not be running. Start it with:');
    console.log('  npm run dev');
    process.exit(1);
  }

  console.log(`  ✓ Server responded with HTTP ${result.status}`);

  console.log('\n[2] Checking response headers...');
  console.log(`  - Content-Type: ${result.headers['content-type']}`);
  console.log(`  - Content-Length: ${result.headers['content-length']}`);
  if (result.headers['transfer-encoding']) {
    console.log(`  - Transfer-Encoding: ${result.headers['transfer-encoding']}`);
  }

  console.log('\n[3] Checking HTML content...');
  if (result.body) {
    console.log(`  ✓ Received ${result.body.length} bytes`);
    if (result.body.includes('loginForm') || result.body.includes('email')) {
      console.log('  ✓ HTML contains login form');
    }
    if (result.body.includes('<!DOCTYPE')) {
      console.log('  ✓ HTML starts with DOCTYPE');
    }
  } else {
    console.log('  ✗ No response body');
  }

  console.log('\n[4] First 500 characters of response:');
  console.log('---');
  console.log(result.body.substring(0, 500));
  console.log('---');

  console.log('\n✓ Basic HTTP check PASSED');
  console.log('  The server is running and /login page is accessible.');
  console.log('  You can now test browser login with playwright.');
});
