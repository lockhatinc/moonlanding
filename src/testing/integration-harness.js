import http from 'http';
import { expect } from './assertions.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEFAULT_TIMEOUT = 30000;

export class IntegrationTestHarness {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.cookies = new Map();
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

  async request(method, path, options = {}) {
    const url = new URL(path, this.baseUrl);
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (this.cookies.size > 0) {
      opts.headers.Cookie = Array.from(this.cookies.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }

    if (options.body) {
      opts.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(options.body));
    }

    return new Promise((resolve, reject) => {
      const protocol = url.protocol === 'https:' ? require('https') : http;
      const req = protocol.request(url, opts, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const setCookie = res.headers['set-cookie'];
          if (setCookie) {
            setCookie.forEach(cookie => {
              const [nameValue] = cookie.split(';');
              const [name, value] = nameValue.split('=');
              this.cookies.set(name, value);
            });
          }

          let body;
          try {
            body = data ? JSON.parse(data) : null;
          } catch {
            body = data;
          }

          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
            raw: data,
          });
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async get(path, options = {}) {
    return this.request('GET', path, options);
  }

  async post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  async put(path, body, options = {}) {
    return this.request('PUT', path, { ...options, body });
  }

  async delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }

  async patch(path, body, options = {}) {
    return this.request('PATCH', path, { ...options, body });
  }

  expect(actual) {
    return expect(actual);
  }

  summary() {
    const total = this.results.reduce((acc, suite) => acc + suite.tests.length, 0);
    const passed = this.results.reduce(
      (acc, suite) => acc + suite.tests.filter(t => t.status === 'passed').length,
      0
    );
    const failed = total - passed;

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
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
    this.cookies.clear();
    this.results = [];
    this.currentSuite = null;
  }
}
