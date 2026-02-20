# Moonlanding Integration Testing Infrastructure

**CRITICAL:** This testing infrastructure follows Charter 3 requirements:
- NO unit tests (.test.js, .spec.js files forbidden)
- ALL tests use real services and actual execution
- Tests run via plugin:gm:dev for API testing
- Tests run via plugin:browser:execute for UI testing
- Only real positive results from actual services are valid

## Test Harnesses

### IntegrationTestHarness
API integration testing with real HTTP requests to running server.

**Features:**
- Real HTTP requests (no mocking)
- Cookie/session management
- Request/response validation
- Assertion helpers
- Test suite organization
- Summary reporting

**Usage:**
```javascript
import { IntegrationTestHarness } from './integration-harness.js';

const harness = new IntegrationTestHarness();

harness.suite('My Tests', () => {
  harness.test('does something', async () => {
    const res = await harness.get('/api/endpoint');
    harness.expect(res.status).toBe(200);
  });
});

const summary = harness.summary();
```

### BrowserTestHarness
UI workflow testing with real browser automation (requires plugin:browser:execute).

**Features:**
- Real browser workflows
- User interaction simulation
- UI validation
- End-to-end testing

## Test Suites

### 1. API Tests (`api-tests.js`)
Tests all API endpoints with real data:
- Health check
- Authentication (login, logout, session)
- Entity CRUD operations (client, engagement, etc.)
- Friday API endpoints
- MWR API endpoints
- Error handling

### 2. Performance Tests (`performance-tests.js`)
Real performance benchmarks:
- Response time validation (p95 < 500ms)
- Concurrent request handling
- Sequential operation performance
- Memory leak detection
- Large payload handling
- Load testing (50+ concurrent requests)

### 3. Security Tests (`security-tests.js`)
Real security validation:
- Authentication security
- Authorization checks
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Error disclosure prevention

### 4. Workflow Tests (`workflow-tests.js`)
End-to-end user workflows with real data:
- Client management workflow
- Engagement lifecycle
- Multi-user collaboration
- Error recovery

### 5. Edge Case Tests (`edge-case-tests.js`)
Boundary conditions and edge cases:
- Empty/null/whitespace handling
- Unicode and special characters
- Concurrent operations
- Data integrity validation
- Network error scenarios

## Running Tests

### Prerequisite: Start Server
```bash
# Terminal 1: Start the server
npm run dev
```

### Run All Tests
```bash
# Terminal 2: Run tests
node src/testing/run-all-tests.js
```

### Run Individual Test Suites
```bash
node -e "import('./src/testing/api-tests.js').then(m => m.runApiTests())"
node -e "import('./src/testing/performance-tests.js').then(m => m.runPerformanceTests())"
node -e "import('./src/testing/security-tests.js').then(m => m.runSecurityTests())"
node -e "import('./src/testing/workflow-tests.js').then(m => m.runWorkflowTests())"
node -e "import('./src/testing/edge-case-tests.js').then(m => m.runEdgeCaseTests())"
```

### Environment Variables
```bash
# Change target server
TEST_BASE_URL=http://localhost:3000 node src/testing/run-all-tests.js

# Adjust timeout
TEST_TIMEOUT=60000 node src/testing/run-all-tests.js
```

## Test Output

### Success Output
```
============================================================
TEST SUMMARY
============================================================

Health Check (150ms)
  2 passed, 0 failed

Authentication (450ms)
  5 passed, 0 failed

============================================================
Total: 7 tests, 7 passed, 0 failed
============================================================

✅ ALL TESTS PASSED
```

### Failure Output
```
============================================================
TEST SUMMARY
============================================================

Authentication (450ms)
  4 passed, 1 failed
  ✗ POST /api/auth/login with invalid credentials fails: Expected status > 399, got 200

============================================================
Total: 5 tests, 4 passed, 1 failed
============================================================

❌ SOME TESTS FAILED
```

## Writing New Tests

### API Test Example
```javascript
import { IntegrationTestHarness } from './integration-harness.js';

export async function runMyTests() {
  const harness = new IntegrationTestHarness();

  harness.suite('My Feature', () => {
    harness.test('Feature works correctly', async () => {
      // Login first
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });

      // Test your feature
      const res = await harness.post('/api/my-endpoint', {
        data: 'value',
      });

      // Assertions
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.result).toBe('expected');
    });
  });

  return harness.summary();
}
```

## Charter 3 Compliance

✅ **ALLOWED:**
- Integration tests with real services
- API tests via HTTP to running server
- Browser tests via plugin:browser:execute
- Performance tests with real timing
- Security tests with real attacks
- Workflow tests with real data

❌ **FORBIDDEN:**
- Unit test files (.test.js, .spec.js)
- Test directories (test/, __tests__/)
- Mock/stub/fixture files
- Test frameworks (Jest, Mocha, etc.)
- Test dependencies in package.json
- Fake/simulated data

## Continuous Integration

Tests should run:
1. Before commits (pre-commit hook)
2. Before deployments
3. On schedule (daily/weekly)
4. After configuration changes
5. After hot-reload updates

## Test Coverage Areas

### API Coverage (66 endpoints)
- ✓ Health check
- ✓ Authentication
- ✓ Entity CRUD
- ✓ Friday API
- ✓ MWR API
- ⏳ File operations (partial)
- ⏳ Email operations (partial)
- ⏳ All domain-specific endpoints

### UI Coverage (47 renderers)
- ⏳ Browser tests require plugin:browser:execute
- ⏳ Full UI workflow automation pending

### Performance Coverage
- ✓ Response time benchmarks
- ✓ Concurrent request handling
- ✓ Memory leak detection
- ✓ Load testing

### Security Coverage
- ✓ Authentication
- ✓ Authorization
- ✓ Input validation
- ✓ Injection prevention
- ✓ CSRF protection
- ✓ Rate limiting

## Maintenance

### Adding New API Endpoints
1. Add test to `api-tests.js`
2. Add workflow test if complex
3. Add security test if sensitive
4. Run full test suite

### Performance Regressions
Monitor p95 latency targets:
- Health check: < 100ms
- API endpoints: < 500ms
- Complex workflows: < 2000ms

### Security Updates
When security features change:
1. Update security tests
2. Verify all security tests pass
3. Add new attack vectors

## Troubleshooting

### Server Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution:** Start server with `npm run dev`

### Tests Timing Out
**Solution:** Increase timeout via environment variable:
```bash
TEST_TIMEOUT=60000 node src/testing/run-all-tests.js
```

### Authentication Failures
**Solution:** Verify test user exists:
- Email: admin@moonlanding.local
- Password: admin123

### Database Locked Errors
**Solution:** Tests running concurrently hitting same DB
- Reduce concurrent test count
- Add delays between operations
- Use separate test database

## Future Enhancements

1. **Browser Test Integration**
   - Implement plugin:browser:execute harness
   - Add full UI workflow tests
   - Automate user interactions

2. **Test Data Management**
   - Seed test data before tests
   - Clean up test data after tests
   - Isolated test database

3. **Coverage Reporting**
   - Track endpoint coverage
   - Track workflow coverage
   - Identify untested paths

4. **Performance Monitoring**
   - Historical performance tracking
   - Regression detection
   - Performance dashboards

5. **Accessibility Testing**
   - Screen reader compatibility
   - Keyboard navigation
   - WCAG compliance

6. **Responsive Testing**
   - Mobile viewports
   - Tablet viewports
   - Desktop viewports
