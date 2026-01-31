import http from 'http';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : data });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('Testing Moonlanding Features\n');

  console.log('1. Testing Template API...');
  try {
    const res = await request('GET', '/api/mwr/review_template');
    console.log(`   Status: ${res.status} (expected: 200 or similar)`);
    console.log(`   Response: ${JSON.stringify(res.data).substring(0, 100)}...\n`);
  } catch (err) {
    console.log(`   Error: ${err.message}\n`);
  }

  console.log('2. Testing Template Creation...');
  try {
    const template = {
      name: 'Test Template',
      type: 'standard',
      content: 'This is a test template',
      description: 'Test description'
    };
    const res = await request('POST', '/api/mwr/review_template', template);
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${JSON.stringify(res.data).substring(0, 100)}...\n`);
  } catch (err) {
    console.log(`   Error: ${err.message}\n`);
  }

  console.log('3. Testing ML Query Endpoint...');
  try {
    const res = await request('POST', '/api/mwr/review/test-review-id/ml-query', { query: 'unresolved highlights' });
    console.log(`   Status: ${res.status}`);
    console.log(`   Has suggestions: ${'suggestions' in res.data}`);
    console.log(`   Has confidence: ${'confidence' in res.data}\n`);
  } catch (err) {
    console.log(`   Error: ${err.message}\n`);
  }

  console.log('4. Testing Highlight Suggestions...');
  try {
    const res = await request('GET', '/api/mwr/review/test-review-id/highlight-suggestions');
    console.log(`   Status: ${res.status}`);
    console.log(`   Has suggestions: ${'suggestions' in res.data}`);
    console.log(`   Has patterns: ${'patterns' in res.data}\n`);
  } catch (err) {
    console.log(`   Error: ${err.message}\n`);
  }

  console.log('5. Testing PDF Export Endpoint...');
  try {
    const res = await request('POST', '/api/mwr/review/test-review-id/export-pdf', { exportType: 'review' });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response type: ${typeof res.data}`);
    console.log(`   Response size: ${JSON.stringify(res.data).length} bytes\n`);
  } catch (err) {
    console.log(`   Error: ${err.message}\n`);
  }

  console.log('All tests completed!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
