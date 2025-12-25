// Test backward transition date validation for engagement stages
// Tests that verify engagements cannot revert to info_gathering after commencement_date passes
// Uses HTTP API calls instead of direct database access

const http = require('http');

const BASE_URL = 'http://localhost:3002/api';
const TEST_CLIENT_ID = 'backward-transition-test-' + Date.now();

const tests = {
  pass: 0,
  fail: 0,
  results: []
};

function logTest(testNum, name, status, details, command = null, evidence = null) {
  const symbol = status === 'PASS' ? '✓' : '✗';
  const color = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';

  console.log(`${color}${symbol}${resetColor} Test ${testNum}: ${name}`);
  console.log(`Status: ${status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
  if (details) {
    console.log(`Details: ${details}`);
  }
  if (command) {
    console.log(`Command: ${command}`);
  }
  if (evidence) {
    console.log(`Evidence: ${evidence}`);
  }
  console.log('');

  if (status === 'PASS') {
    tests.pass++;
  } else {
    tests.fail++;
  }

  tests.results.push({ testNum, name, status, details, command, evidence });
}

function makeHttpRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'user_id=test-user; user_role=partner; user_email=test@example.com'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createEngagement(name, stage, commencementDate) {
  try {
    const response = await makeHttpRequest('POST', '/engagements', {
      name,
      client_id: TEST_CLIENT_ID,
      year: 2024,
      stage,
      status: 'active',
      commencement_date: commencementDate
    });

    if (response.status >= 200 && response.status < 300) {
      return response.body?.id || response.body;
    } else {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.body)}`);
    }
  } catch (error) {
    console.error('Error creating engagement:', error.message);
    throw error;
  }
}

async function getEngagement(id) {
  try {
    const response = await makeHttpRequest('GET', `/engagements/${id}`);
    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.body)}`);
    }
  } catch (error) {
    console.error('Error getting engagement:', error.message);
    throw error;
  }
}

async function updateEngagementStage(id, newStage) {
  try {
    const response = await makeHttpRequest('PATCH', `/engagements/${id}`, {
      stage: newStage
    });
    return {
      status: response.status,
      body: response.body
    };
  } catch (error) {
    console.error('Error updating engagement:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('==========================================');
  console.log('TEST GROUP: BACKWARD TRANSITION DATE');
  console.log('Validation for engagement stages');
  console.log('==========================================');
  console.log('');

  // TEST 15: Verify cannot manually move back to info_gathering after commencement_date
  console.log('Test 15: Verify cannot manually move back to info_gathering after commencement_date');
  console.log('---');

  try {
    const pastDate = Math.floor(Date.now() / 1000) - (2 * 86400); // 2 days ago
    console.log(`Creating engagement with commencement_date 2 days ago (${pastDate})`);
    const engId1 = await createEngagement('Test Engagement 15', 'commencement', pastDate);
    console.log(`Created engagement ${engId1}`);

    const before = await getEngagement(engId1);
    console.log(`Before update - Stage: ${before.stage}, Commencement Date: ${before.commencement_date}`);

    console.log('Attempting transition to info_gathering...');
    const updateResponse = await updateEngagementStage(engId1, 'info_gathering');

    const apiCall = `PATCH /api/engagements/${engId1}`;
    const payload = JSON.stringify({ stage: 'info_gathering' });

    if (updateResponse.status === 400 || updateResponse.status === 403) {
      const errorMsg = updateResponse.body?.error || updateResponse.body?.message || 'Validation error';
      logTest(15, 'Cannot manually move back to info_gathering after commencement_date', 'PASS',
        'Backward transition correctly rejected when commencement_date is in the past',
        `${apiCall} - Payload: ${payload}`,
        `Response: ${updateResponse.status} - ${errorMsg}`
      );
    } else if (updateResponse.status === 200) {
      logTest(15, 'Cannot manually move back to info_gathering after commencement_date', 'FAIL',
        'Backward transition was allowed but should have been blocked',
        `${apiCall} - Payload: ${payload}`,
        `Response: ${updateResponse.status} - Transition succeeded`
      );
    } else {
      logTest(15, 'Cannot manually move back to info_gathering after commencement_date', 'FAIL',
        `Unexpected response status: ${updateResponse.status}`,
        `${apiCall} - Payload: ${payload}`,
        `Response: ${updateResponse.status} - ${JSON.stringify(updateResponse.body)}`
      );
    }

  } catch (error) {
    logTest(15, 'Cannot manually move back to info_gathering after commencement_date', 'FAIL',
      `Exception during test: ${error.message}`,
      'API call',
      `Error: ${error.message}`
    );
  }

  console.log('');

  // TEST 17a: Verify cannot move backward once dates pass (team_execution → commencement → info_gathering)
  console.log('Test 17a: Verify cannot move backward once dates pass (team_execution → commencement → info_gathering)');
  console.log('---');

  try {
    const pastDate = Math.floor(Date.now() / 1000) - 604800; // 1 week ago
    console.log(`Creating engagement with commencement_date 1 week ago (${pastDate})`);
    const engId2 = await createEngagement('Test Engagement 17a', 'team_execution', pastDate);
    console.log(`Created engagement ${engId2} in team_execution stage`);

    const before = await getEngagement(engId2);
    console.log(`Before update - Stage: ${before.stage}, Commencement Date: ${before.commencement_date}`);

    // First transition to commencement (should succeed - backward but not to info_gathering)
    console.log('Attempting transition to commencement (backward but not to info_gathering)...');
    const updateResponse1 = await updateEngagementStage(engId2, 'commencement');

    const apiCall1 = `PATCH /api/engagements/${engId2}`;
    const payload1 = JSON.stringify({ stage: 'commencement' });

    if (updateResponse1.status === 200) {
      console.log(`Transition to commencement succeeded (status: ${updateResponse1.status})`);

      // Now try to go back to info_gathering (should fail)
      console.log('\nAttempting second transition to info_gathering (should fail)...');
      const updateResponse2 = await updateEngagementStage(engId2, 'info_gathering');

      const apiCall2 = `PATCH /api/engagements/${engId2}`;
      const payload2 = JSON.stringify({ stage: 'info_gathering' });

      if (updateResponse2.status === 400 || updateResponse2.status === 403) {
        const errorMsg = updateResponse2.body?.error || updateResponse2.body?.message || 'Validation error';
        logTest(17, 'Verify cannot move backward once dates pass', 'PASS',
          'Backward transition to info_gathering correctly blocked when commencement_date passed',
          `${apiCall2} - Payload: ${payload2}`,
          `Response: ${updateResponse2.status} - ${errorMsg}`
        );
      } else if (updateResponse2.status === 200) {
        logTest(17, 'Verify cannot move backward once dates pass', 'FAIL',
          'Backward transition to info_gathering was allowed but should have been blocked',
          `${apiCall2} - Payload: ${payload2}`,
          `Response: ${updateResponse2.status} - Transition succeeded`
        );
      } else {
        logTest(17, 'Verify cannot move backward once dates pass', 'FAIL',
          `Unexpected response status: ${updateResponse2.status}`,
          `${apiCall2} - Payload: ${payload2}`,
          `Response: ${updateResponse2.status} - ${JSON.stringify(updateResponse2.body)}`
        );
      }
    } else {
      logTest(17, 'Verify cannot move backward once dates pass', 'FAIL',
        `Failed to transition to commencement: ${updateResponse1.status}`,
        `${apiCall1} - Payload: ${payload1}`,
        `Response: ${updateResponse1.status} - ${JSON.stringify(updateResponse1.body)}`
      );
    }

  } catch (error) {
    logTest(17, 'Verify cannot move backward once dates pass', 'FAIL',
      `Exception during test: ${error.message}`,
      'API call',
      `Error: ${error.message}`
    );
  }

  console.log('');

  // TEST 18: Verify CAN move backward to info_gathering if commencement_date is in the future
  console.log('Test 18: Verify CAN move backward to info_gathering if commencement_date is in the future');
  console.log('---');

  try {
    const futureDate = Math.floor(Date.now() / 1000) + (5 * 86400); // 5 days in the future
    console.log(`Creating engagement with commencement_date 5 days in the future (${futureDate})`);
    const engId4 = await createEngagement('Test Engagement 18', 'team_execution', futureDate);
    console.log(`Created engagement ${engId4} in team_execution stage`);

    const before = await getEngagement(engId4);
    console.log(`Before update - Stage: ${before.stage}, Commencement Date: ${before.commencement_date}`);

    console.log('Attempting transition to info_gathering (should succeed - date in future)...');
    const updateResponse = await updateEngagementStage(engId4, 'info_gathering');

    const apiCall = `PATCH /api/engagements/${engId4}`;
    const payload = JSON.stringify({ stage: 'info_gathering' });

    if (updateResponse.status === 200) {
      logTest(18, 'CAN move backward to info_gathering if commencement_date is in the future', 'PASS',
        'Backward transition allowed because commencement_date is in the future',
        `${apiCall} - Payload: ${payload}`,
        `Response: ${updateResponse.status} - Transition succeeded`
      );
    } else if (updateResponse.status === 400 || updateResponse.status === 403) {
      const errorMsg = updateResponse.body?.error || updateResponse.body?.message || 'Validation error';
      logTest(18, 'CAN move backward to info_gathering if commencement_date is in the future', 'FAIL',
        `Backward transition was blocked but should have been allowed: ${errorMsg}`,
        `${apiCall} - Payload: ${payload}`,
        `Response: ${updateResponse.status} - ${errorMsg}`
      );
    } else {
      logTest(18, 'CAN move backward to info_gathering if commencement_date is in the future', 'FAIL',
        `Unexpected response status: ${updateResponse.status}`,
        `${apiCall} - Payload: ${payload}`,
        `Response: ${updateResponse.status} - ${JSON.stringify(updateResponse.body)}`
      );
    }

  } catch (error) {
    logTest(18, 'CAN move backward to info_gathering if commencement_date is in the future', 'FAIL',
      `Exception during test: ${error.message}`,
      'API call',
      `Error: ${error.message}`
    );
  }

  console.log('');
  console.log('==========================================');
  console.log(`SUMMARY: ${tests.pass}/${tests.pass + tests.fail} PASSING`);
  console.log('==========================================');
  console.log('');

  // Detailed results
  console.log('DETAILED TEST RESULTS:');
  console.log('==========================================');
  tests.results.forEach(result => {
    console.log(`\nTest ${result.testNum}: ${result.name}`);
    console.log(`Status: ${result.status}`);
    if (result.details) console.log(`Details: ${result.details}`);
    if (result.command) console.log(`Command: ${result.command}`);
    if (result.evidence) console.log(`Evidence: ${result.evidence}`);
  });

  process.exit(tests.fail > 0 ? 1 : 0);
}

// Wait for server to be ready, then run tests
console.log('Waiting for server to be ready...');
setTimeout(runTests, 2000);
