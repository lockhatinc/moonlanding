import { runApiTests } from './api-tests.js';
import { runPerformanceTests } from './performance-tests.js';
import { runSecurityTests } from './security-tests.js';
import { runWorkflowTests } from './workflow-tests.js';
import { runEdgeCaseTests } from './edge-case-tests.js';

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('MOONLANDING INTEGRATION TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Target: ${process.env.TEST_BASE_URL || 'http://localhost:3000'}`);
  console.log('='.repeat(80) + '\n');

  const results = {};
  const startTime = Date.now();

  try {
    console.log('\n📋 Running API Tests...\n');
    results.api = await runApiTests();

    console.log('\n⚡ Running Performance Tests...\n');
    results.performance = await runPerformanceTests();

    console.log('\n🔒 Running Security Tests...\n');
    results.security = await runSecurityTests();

    console.log('\n🔄 Running Workflow Tests...\n');
    results.workflow = await runWorkflowTests();

    console.log('\n🎯 Running Edge Case Tests...\n');
    results.edgeCase = await runEdgeCaseTests();
  } catch (err) {
    console.error('\n❌ Fatal error during test execution:', err);
    process.exit(1);
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n' + '='.repeat(80));
  console.log('OVERALL TEST SUMMARY');
  console.log('='.repeat(80));

  const categories = Object.keys(results);
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  categories.forEach(category => {
    const result = results[category];
    totalTests += result.total;
    totalPassed += result.passed;
    totalFailed += result.failed;

    const status = result.success ? '✓' : '✗';
    console.log(`${status} ${category.toUpperCase()}: ${result.passed}/${result.total} passed`);
  });

  console.log('='.repeat(80));
  console.log(`Total: ${totalTests} tests, ${totalPassed} passed, ${totalFailed} failed`);
  console.log(`Duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`Completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  const allPassed = totalFailed === 0;

  if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED\n');
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
