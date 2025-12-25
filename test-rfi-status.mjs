#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';

const API_BASE = 'http://localhost:3000/api/friday';
const results = [];

function log(message) {
  console.log(message);
}

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: res.status,
      data
    };
  } catch (error) {
    log(`Request error to ${url}: ${error.message}`);
    throw error;
  }
}

function recordTest(name, passed, details) {
  const status = passed ? 'PASS' : 'FAIL';
  const result = `Test: ${name} | Status: ${status} | Details: ${details}`;
  log(result);
  results.push(result);
}

let engagementId = null;
let rfiId1 = null;
let rfiId2 = null;

async function setup() {
  log('\n========== SETUP ==========\n');

  try {
    // Create engagement using generic entity route
    const engRes = await request('POST', '/engagement', {
      name: `Test Engagement ${Date.now()}`,
      status: 'active',
      stage: 'info_gathering',
      year: new Date().getFullYear()
    });

    log(`Engagement creation response: ${engRes.status}`);
    log(`Response body: ${JSON.stringify(engRes.data, null, 2)}\n`);

    if (engRes.status === 201 && engRes.data?.data?.id) {
      engagementId = engRes.data.data.id;
      log(`Created engagement: ${engagementId}\n`);
    } else if (engRes.status === 200 && engRes.data?.id) {
      engagementId = engRes.data.id;
      log(`Created engagement: ${engagementId}\n`);
    } else {
      throw new Error(`Failed to create engagement: ${engRes.status}`);
    }
  } catch (error) {
    log(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

async function runTests() {
  log('\n========== TEST 28: RFI Binary Status System ==========\n');

  // TEST 28.1: RFI created with status=0 (Waiting)
  log('TEST 28.1: Create RFI and verify status=0 (Waiting)');
  try {
    const res = await request('POST', '/rfi', {
      engagement_id: engagementId,
      question: 'Test RFI 1',
      date_requested: Math.floor(Date.now() / 1000)
    });

    log(`RFI creation response status: ${res.status}`);

    if (res.status === 201 || res.status === 200) {
      const rfiData = res.data?.data || res.data;
      rfiId1 = rfiData?.id;
      const passed = rfiData?.status === 0;

      recordTest(
        '28.1: RFI Initial Status (Waiting)',
        passed,
        `ID: ${rfiId1}, status: ${rfiData?.status} (expected 0)`
      );

      log(`RFI JSON: ${JSON.stringify(rfiData, null, 2)}\n`);
    } else {
      recordTest('28.1: RFI Initial Status', false, `Status ${res.status}`);
      log(`Response: ${JSON.stringify(res.data, null, 2)}\n`);
    }
  } catch (error) {
    recordTest('28.1: RFI Initial Status', false, error.message);
  }

  // TEST 28.2: Verify status persists
  log('\nTEST 28.2: Verify RFI status persists (reload simulation)');
  try {
    const res = await request('GET', `/rfi/${rfiId1}`);

    if (res.status === 200) {
      const rfiData = res.data?.data || res.data;
      const passed = rfiData?.status === 0;

      recordTest(
        '28.2: RFI Status Persistence',
        passed,
        `ID: ${rfiId1}, status after reload: ${rfiData?.status} (expected 0)`
      );

      log(`RFI JSON: ${JSON.stringify(rfiData, null, 2)}\n`);
    } else {
      recordTest('28.2: RFI Status Persistence', false, `Status ${res.status}`);
    }
  } catch (error) {
    recordTest('28.2: RFI Status Persistence', false, error.message);
  }

  // TEST 28.3: Create second RFI and verify it starts at 0
  log('\nTEST 28.3: New RFI also starts with status=0');
  try {
    const res = await request('POST', '/rfi', {
      engagement_id: engagementId,
      question: 'Test RFI 2',
      date_requested: Math.floor(Date.now() / 1000)
    });

    if (res.status === 201 || res.status === 200) {
      const rfiData = res.data?.data || res.data;
      rfiId2 = rfiData?.id;
      const passed = rfiData?.status === 0;

      recordTest(
        '28.3: Second RFI Initial Status',
        passed,
        `ID: ${rfiId2}, status: ${rfiData?.status} (expected 0)`
      );

      log(`RFI JSON: ${JSON.stringify(rfiData, null, 2)}\n`);
    } else {
      recordTest('28.3: Second RFI Initial Status', false, `Status ${res.status}`);
    }
  } catch (error) {
    recordTest('28.3: Second RFI Initial Status', false, error.message);
  }

  // TEST 28.4: Verify status is binary
  log('\nTEST 28.4: Verify RFI status is binary (0 or 1 only)');
  try {
    const res = await request('GET', `/rfi/${rfiId1}`);

    if (res.status === 200) {
      const rfiData = res.data?.data || res.data;
      const isBinary = rfiData?.status === 0 || rfiData?.status === 1;

      recordTest(
        '28.4: RFI Status is Binary',
        isBinary,
        `ID: ${rfiId1}, status: ${rfiData?.status}, typeof: ${typeof rfiData?.status}, isBinary: ${isBinary}`
      );
    } else {
      recordTest('28.4: RFI Status is Binary', false, `Status ${res.status}`);
    }
  } catch (error) {
    recordTest('28.4: RFI Status is Binary', false, error.message);
  }

  log('\n========== TEST 29: RFI Auditor Display Status ==========\n');

  // TEST 29.1: Create RFI and check display_status
  log('TEST 29.1: Check auditor display_status="Requested" on creation');
  try {
    const res = await request('POST', '/rfi', {
      engagement_id: engagementId,
      question: 'Test RFI for Auditor Status',
      date_requested: Math.floor(Date.now() / 1000)
    });

    if (res.status === 201 || res.status === 200) {
      const rfiData = res.data?.data || res.data;
      const passed = rfiData?.auditor_status === 'requested';

      recordTest(
        '29.1: Auditor Status "Requested"',
        passed,
        `auditor_status: "${rfiData?.auditor_status}" (expected "requested")`
      );

      log(`RFI Status Fields: ${JSON.stringify({
        status: rfiData?.status,
        auditor_status: rfiData?.auditor_status,
        client_status: rfiData?.client_status,
        display_status: rfiData?.display_status
      }, null, 2)}\n`);
    } else {
      recordTest('29.1: Auditor Status', false, `Status ${res.status}`);
    }
  } catch (error) {
    recordTest('29.1: Auditor Status', false, error.message);
  }

  log('\n========== TEST 30: RFI Client Display Status ==========\n');

  // TEST 30.1: Check client display_status
  log('TEST 30.1: Check client display_status on creation');
  try {
    const res = await request('POST', '/rfi', {
      engagement_id: engagementId,
      question: 'Test RFI for Client Status',
      date_requested: Math.floor(Date.now() / 1000)
    });

    if (res.status === 201 || res.status === 200) {
      const rfiData = res.data?.data || res.data;

      recordTest(
        '30.1: Client Status on Creation',
        true,
        `client_status: "${rfiData?.client_status}", auditor_status: "${rfiData?.auditor_status}"`
      );

      log(`RFI Status Fields: ${JSON.stringify({
        status: rfiData?.status,
        client_status: rfiData?.client_status,
        auditor_status: rfiData?.auditor_status,
        display_status: rfiData?.display_status
      }, null, 2)}\n`);
    } else {
      recordTest('30.1: Client Status', false, `Status ${res.status}`);
    }
  } catch (error) {
    recordTest('30.1: Client Status', false, error.message);
  }

  log('\n========== TEST 31: RFI Status Transitions ==========\n');

  // TEST 31.1: Create RFI response and check status
  log('TEST 31.1: Create text response and verify status changes');
  try {
    // First create an RFI
    const createRes = await request('POST', '/rfi', {
      engagement_id: engagementId,
      question: 'Test RFI for Response',
      date_requested: Math.floor(Date.now() / 1000)
    });

    if (createRes.status === 201 || createRes.status === 200) {
      const testRfiId = (createRes.data?.data || createRes.data)?.id;

      // Now create a response
      const responseRes = await request('POST', '/rfi_response', {
        rfi_id: testRfiId,
        response_text: 'Test response text',
        response_type: 'client_response'
      });

      if (responseRes.status === 201 || responseRes.status === 200) {
        // Check RFI status
        const rfiRes = await request('GET', `/rfi/${testRfiId}`);

        if (rfiRes.status === 200) {
          const rfiData = rfiRes.data?.data || rfiRes.data;
          const passed = rfiData?.status === 1;

          recordTest(
            '31.1: RFI Status After Response',
            passed,
            `ID: ${testRfiId}, status: ${rfiData?.status} (expected 1)`
          );

          log(`RFI After Response: ${JSON.stringify({
            id: rfiData?.id,
            status: rfiData?.status,
            response_count: rfiData?.response_count,
            auditor_status: rfiData?.auditor_status,
            client_status: rfiData?.client_status
          }, null, 2)}\n`);
        } else {
          recordTest('31.1: RFI Status After Response', false, `GET failed with status ${rfiRes.status}`);
        }
      } else {
        recordTest('31.1: RFI Status After Response', false, `Response creation failed: ${responseRes.status}`);
        log(`Response error: ${JSON.stringify(responseRes.data, null, 2)}\n`);
      }
    } else {
      recordTest('31.1: RFI Status After Response', false, `RFI creation failed: ${createRes.status}`);
    }
  } catch (error) {
    recordTest('31.1: RFI Status After Response', false, error.message);
  }

  // Summary
  log('\n========== TEST SUMMARY ==========\n');
  const passed = results.filter(r => r.includes('PASS')).length;
  const failed = results.filter(r => r.includes('FAIL')).length;
  const total = results.length;

  log(`Total Tests: ${total}`);
  log(`Passed: ${passed}`);
  log(`Failed: ${failed}`);
  log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = `/home/user/lexco/moonlanding/test-results-rfi-${timestamp}.txt`;
  fs.writeFileSync(outputFile, results.join('\n'));
  log(`Results saved to: ${outputFile}\n`);
}

setTimeout(async () => {
  try {
    await setup();
    await runTests();
    process.exit(0);
  } catch (error) {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}, 2000);
