export class BrowserTestHarness {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.timeout = options.timeout || 30000;
    this.results = [];
    this.currentSuite = null;
  }

  async suite(name, fn) {
    this.currentSuite = { name, tests: [], startTime: Date.now() };
    await fn();
    const duration = Date.now() - this.currentSuite.startTime;
    this.results.push({ ...this.currentSuite, duration });
    this.currentSuite = null;
  }

  async test(name, fn) {
    const testStartTime = Date.now();
    let status = 'passed';
    let error = null;

    try {
      await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Test timeout after ${this.timeout}ms`)), this.timeout)
        )
      ]);
    } catch (err) {
      status = 'failed';
      error = err.message;
      console.error(`  ✗ ${name}: ${err.message}`);
    }

    const duration = Date.now() - testStartTime;
    const testResult = { name, status, error, duration };

    if (this.currentSuite) {
      this.currentSuite.tests.push(testResult);
    }

    if (status === 'passed') {
      console.log(`  ✓ ${name} (${duration}ms)`);
    }

    return status === 'passed';
  }

  generateBrowserScript(workflow) {
    return `
      (async () => {
        const results = { steps: [], success: true, error: null };

        try {
          ${workflow}
        } catch (err) {
          results.success = false;
          results.error = err.message;
          results.stack = err.stack;
        }

        return results;
      })();
    `;
  }

  async runWorkflow(workflow) {
    throw new Error('Browser execution requires plugin:browser:execute - not yet implemented in this harness');
  }

  expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toEqual(expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
        }
      },
      toBeFalsy() {
        if (actual) {
          throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
        }
      },
      toContain(item) {
        if (!actual.includes(item)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
        }
      },
    };
  }

  summary() {
    const total = this.results.reduce((acc, suite) => acc + suite.tests.length, 0);
    const passed = this.results.reduce(
      (acc, suite) => acc + suite.tests.filter(t => t.status === 'passed').length,
      0
    );
    const failed = total - passed;

    console.log('\n' + '='.repeat(60));
    console.log('BROWSER TEST SUMMARY');
    console.log('='.repeat(60));

    this.results.forEach(suite => {
      const suitePassed = suite.tests.filter(t => t.status === 'passed').length;
      const suiteFailed = suite.tests.length - suitePassed;
      console.log(`\n${suite.name} (${suite.duration}ms)`);
      console.log(`  ${suitePassed} passed, ${suiteFailed} failed`);

      suite.tests.filter(t => t.status === 'failed').forEach(test => {
        console.log(`  ✗ ${test.name}: ${test.error}`);
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${total} tests, ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60) + '\n');

    return { total, passed, failed, success: failed === 0 };
  }

  reset() {
    this.results = [];
    this.currentSuite = null;
  }
}
