#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test Configuration
const API_BASE = 'http://localhost:3000/api';
const TESTS = [];
let testResults = [];

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Mode': 'true',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test helper
function createTest(name, fn) {
  TESTS.push({ name, fn });
}

function recordResult(testName, passed, details) {
  const status = passed ? 'PASS' : 'FAIL';
  const result = `Test: ${testName} | Status: ${status} | Details: ${details}`;
  console.log(result);
  testResults.push(result);
}

// ==================== SETUP ====================

let engagementId = null;
let rfiId1 = null;
let rfiId2 = null;
let userId = null;
let clientId = null;

async function setupTest() {
  console.log('\n========== SETUP ==========\n');

  try {
    // Create test user
    const userRes = await makeRequest('POST', `${API_BASE}/friday/engagement`, {
      entity: 'user',
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        status: 'active'
      }
    });

    if (userRes.body?.data?.id) {
      userId = userRes.body.data.id;
      console.log(`Created test user: ${userId}`);
    }

    // Create test engagement
    const engRes = await makeRequest('POST', `${API_BASE}/friday/engagement`, {
      entity: 'engagement',
      data: {
        name: `Test Engagement ${Date.now()}`,
        status: 'active',
        stage: 'info_gathering',
        year: new Date().getFullYear(),
        client_id: clientId
      }
    });

    if (engRes.body?.data?.id) {
      engagementId = engRes.body.data.id;
      console.log(`Created test engagement: ${engagementId}`);
    } else {
      throw new Error('Failed to create engagement');
    }

  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

// ==================== TEST SUITE ====================

createTest('TEST 28.1: RFI created with status=0 (Waiting)', async () => {
  try {
    const res = await makeRequest('POST', `${API_BASE}/friday/rfi`, {
      entity: 'rfi',
      data: {
        engagement_id: engagementId,
        question: 'Test RFI Question 1',
        date_requested: Math.floor(Date.now() / 1000),
        status: undefined // Should default to 0
      }
    });

    rfiId1 = res.body?.data?.id;
    const rfiData = res.body?.data;

    const passed = rfiData && rfiData.status === 0;
    recordResult('28.1: RFI Initial Status (0=Waiting)', passed,
      `RFI ID: ${rfiId1}, status value: ${rfiData?.status}, expected: 0`);

    if (rfiData) {
      console.log(`  RFI JSON: ${JSON.stringify(rfiData, null, 2)}`);
    }
  } catch (error) {
    recordResult('28.1: RFI Initial Status', false, error.message);
  }
});

createTest('TEST 28.2: RFI status=1 (Completed) after file upload', async () => {
  try {
    // First, upload a response file
    const uploadRes = await makeRequest('POST', `${API_BASE}/files`, {
      entity: 'rfi_response',
      entity_id: rfiId1,
      filename: `rfi-response-${Date.now()}.pdf`,
      content_type: 'application/pdf'
    });

    // Check RFI status after upload
    const rfiRes = await makeRequest('GET', `${API_BASE}/friday/rfi/${rfiId1}`);
    const rfiData = rfiRes.body?.data;

    const passed = rfiData && rfiData.status === 1;
    recordResult('28.2: RFI Status After File Upload (1=Completed)', passed,
      `RFI ID: ${rfiId1}, status value: ${rfiData?.status}, expected: 1`);

    if (rfiData) {
      console.log(`  RFI JSON: ${JSON.stringify(rfiData, null, 2)}`);
    }
  } catch (error) {
    recordResult('28.2: RFI Status After File Upload', false, error.message);
  }
});

createTest('TEST 28.3: New RFI starts as status=0 (Waiting)', async () => {
  try {
    const res = await makeRequest('POST', `${API_BASE}/friday/rfi`, {
      entity: 'rfi',
      data: {
        engagement_id: engagementId,
        question: 'Test RFI Question 2',
        date_requested: Math.floor(Date.now() / 1000)
      }
    });

    rfiId2 = res.body?.data?.id;
    const rfiData = res.body?.data;

    const passed = rfiData && rfiData.status === 0;
    recordResult('28.3: New RFI Status (0=Waiting)', passed,
      `RFI ID: ${rfiId2}, status value: ${rfiData?.status}, expected: 0`);

    if (rfiData) {
      console.log(`  RFI JSON: ${JSON.stringify(rfiData, null, 2)}`);
    }
  } catch (error) {
    recordResult('28.3: New RFI Status', false, error.message);
  }
});

createTest('TEST 28.4: RFI status field contains only 0 or 1 (binary)', async () => {
  try {
    const res = await makeRequest('GET', `${API_BASE}/friday/rfi/${rfiId1}`);
    const rfiData = res.body?.data;

    const isBinary = rfiData && (rfiData.status === 0 || rfiData.status === 1);
    recordResult('28.4: RFI Status is Binary (0 or 1)', isBinary,
      `RFI ID: ${rfiId1}, status value: ${rfiData?.status}, is binary: ${isBinary}`);

    console.log(`  RFI Status Log: ${JSON.stringify({
      id: rfiData?.id,
      status: rfiData?.status,
      type: typeof rfiData?.status,
      isBinary
    })}`);
  } catch (error) {
    recordResult('28.4: RFI Status is Binary', false, error.message);
  }
});

createTest('TEST 29.1: RFI display_status="Requested" on creation', async () => {
  try {
    const res = await makeRequest('POST', `${API_BASE}/friday/rfi`, {
      entity: 'rfi',
      data: {
        engagement_id: engagementId,
        question: 'Test RFI for Display Status',
        date_requested: Math.floor(Date.now() / 1000)
      }
    });

    const rfiData = res.body?.data;
    const passed = rfiData && rfiData.display_status === 'Requested';
    recordResult('29.1: RFI Display Status "Requested"', passed,
      `display_status: ${rfiData?.display_status}, expected: "Requested"`);

    console.log(`  RFI Display Status Log: ${JSON.stringify({
      id: rfiData?.id,
      status: rfiData?.status,
      display_status: rfiData?.display_status,
      auditor_status: rfiData?.auditor_status,
      client_status: rfiData?.client_status
    })}`);
  } catch (error) {
    recordResult('29.1: RFI Display Status', false, error.message);
  }
});

createTest('TEST 29.2: RFI display_status="Received" after client upload', async () => {
  try {
    // Create RFI
    const createRes = await makeRequest('POST', `${API_BASE}/friday/rfi`, {
      entity: 'rfi',
      data: {
        engagement_id: engagementId,
        question: 'Test RFI for Received Status',
        date_requested: Math.floor(Date.now() / 1000)
      }
    });

    const testRfiId = createRes.body?.data?.id;

    // Upload response file
    await makeRequest('POST', `${API_BASE}/files`, {
      entity: 'rfi_response',
      entity_id: testRfiId,
      filename: `client-response-${Date.now()}.pdf`,
      content_type: 'application/pdf'
    });

    // Check display status
    const rfiRes = await makeRequest('GET', `${API_BASE}/friday/rfi/${testRfiId}`);
    const rfiData = rfiRes.body?.data;

    const passed = rfiData && rfiData.display_status === 'Received';
    recordResult('29.2: RFI Display Status "Received"', passed,
      `display_status: ${rfiData?.display_status}, expected: "Received"`);

    console.log(`  RFI Display Status Log: ${JSON.stringify({
      id: rfiData?.id,
      status: rfiData?.status,
      display_status: rfiData?.display_status,
      auditor_status: rfiData?.auditor_status
    })}`);
  } catch (error) {
    recordResult('29.2: RFI Display Status Received', false, error.message);
  }
});

createTest('TEST 30.1: RFI client display_status="Pending" on creation', async () => {
  try {
    const res = await makeRequest('POST', `${API_BASE}/friday/rfi`, {
      entity: 'rfi',
      data: {
        engagement_id: engagementId,
        question: 'Test RFI for Client View',
        date_requested: Math.floor(Date.now() / 1000)
      }
    });

    const rfiData = res.body?.data;
    const passed = rfiData && rfiData.client_status === 'Pending';
    recordResult('30.1: RFI Client Status "Pending"', passed,
      `client_status: ${rfiData?.client_status}, expected: "Pending"`);

    console.log(`  Client View Status Log: ${JSON.stringify({
      id: rfiData?.id,
      client_status: rfiData?.client_status,
      auditor_status: rfiData?.auditor_status
    })}`);
  } catch (error) {
    recordResult('30.1: RFI Client Status', false, error.message);
  }
});

createTest('TEST 31.1: RFI status=1 after text response', async () => {
  try {
    // Create RFI
    const createRes = await makeRequest('POST', `${API_BASE}/friday/rfi`, {
      entity: 'rfi',
      data: {
        engagement_id: engagementId,
        question: 'Test RFI for Text Response',
        date_requested: Math.floor(Date.now() / 1000)
      }
    });

    const testRfiId = createRes.body?.data?.id;

    // Create RFI response with text
    const responseRes = await makeRequest('POST', `${API_BASE}/friday/rfi_response`, {
      entity: 'rfi_response',
      data: {
        rfi_id: testRfiId,
        response_text: 'This is a text response to the RFI',
        response_type: 'client_response',
        submitted_by: userId
      }
    });

    // Check RFI status
    const rfiRes = await makeRequest('GET', `${API_BASE}/friday/rfi/${testRfiId}`);
    const rfiData = rfiRes.body?.data;

    const passed = rfiData && rfiData.status === 1;
    recordResult('31.1: RFI Status After Text Response (1=Completed)', passed,
      `RFI ID: ${testRfiId}, status: ${rfiData?.status}, expected: 1`);

    console.log(`  Text Response Status Log: ${JSON.stringify({
      id: rfiData?.id,
      status: rfiData?.status,
      response_count: rfiData?.response_count
    })}`);
  } catch (error) {
    recordResult('31.1: RFI Status After Text Response', false, error.message);
  }
});

createTest('TEST 31.2: RFI status persists after page reload', async () => {
  try {
    // Get current RFI (simulates page reload)
    const rfiRes = await makeRequest('GET', `${API_BASE}/friday/rfi/${rfiId1}`);
    const rfiData = rfiRes.body?.data;

    const passed = rfiData && rfiData.status === 1;
    recordResult('31.2: RFI Status Persistence', passed,
      `RFI ID: ${rfiId1}, status after reload: ${rfiData?.status}, expected: 1`);
  } catch (error) {
    recordResult('31.2: RFI Status Persistence', false, error.message);
  }
});

// ==================== MAIN ====================

async function runAllTests() {
  await setupTest();

  console.log('\n========== RUNNING TESTS ==========\n');

  for (const test of TESTS) {
    try {
      await test.fn();
    } catch (error) {
      console.error(`Error in ${test.name}:`, error);
    }
    // Small delay between tests
    await new Promise(r => setTimeout(r, 100));
  }

  // Print summary
  console.log('\n========== TEST SUMMARY ==========\n');
  const passed = testResults.filter(r => r.includes('PASS')).length;
  const failed = testResults.filter(r => r.includes('FAIL')).length;

  console.log(`Total Tests: ${testResults.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / testResults.length) * 100)}%`);

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = `/home/user/lexco/moonlanding/test-results-rfi-${timestamp}.txt`;
  fs.writeFileSync(outputFile, testResults.join('\n'));
  console.log(`\nResults saved to: ${outputFile}`);
}

// Start tests when server is ready
setTimeout(() => {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}, 2000);
