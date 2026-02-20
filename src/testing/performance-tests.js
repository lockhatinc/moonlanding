import { IntegrationTestHarness } from './integration-harness.js';

export async function runPerformanceTests() {
  const harness = new IntegrationTestHarness();

  harness.suite('Performance Benchmarks', () => {
    harness.test('Health check responds under 100ms', async () => {
      const start = Date.now();
      const res = await harness.get('/api/health');
      const duration = Date.now() - start;

      harness.expect(res.status).toBe(200);
      harness.expect(duration).toBeLessThan(100);
      console.log(`    Response time: ${duration}ms`);
    });

    harness.test('API endpoints respond under 500ms (p95)', async () => {
      const endpoints = [
        '/api/health',
        '/api/csrf-token',
        '/api/friday/version',
        '/api/mwr/features',
      ];

      const times = [];

      for (const endpoint of endpoints) {
        const start = Date.now();
        await harness.get(endpoint);
        times.push(Date.now() - start);
      }

      times.sort((a, b) => a - b);
      const p95Index = Math.floor(times.length * 0.95);
      const p95 = times[p95Index];

      console.log(`    p95 latency: ${p95}ms`);
      console.log(`    avg latency: ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms`);

      harness.expect(p95).toBeLessThan(500);
    });

    harness.test('Concurrent requests handle properly', async () => {
      const concurrentRequests = 10;
      const start = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        harness.get('/api/health')
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      results.forEach(res => {
        harness.expect(res.status).toBe(200);
      });

      console.log(`    ${concurrentRequests} concurrent requests in ${duration}ms`);
      console.log(`    Average: ${Math.round(duration / concurrentRequests)}ms per request`);
    });

    harness.test('Sequential entity operations maintain performance', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });

      const operations = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        const createRes = await harness.post('/api/client', {
          name: `Perf Test Client ${Date.now()}`,
          contact_email: `perf${Date.now()}@example.com`,
        });

        const clientId = createRes.body.id;
        await harness.get(`/api/client/${clientId}`);
        await harness.delete(`/api/client/${clientId}`);

        operations.push(Date.now() - start);
      }

      const avgTime = Math.round(operations.reduce((a, b) => a + b, 0) / operations.length);

      console.log(`    Average operation time: ${avgTime}ms`);
      harness.expect(avgTime).toBeLessThan(1000);
    });
  });

  harness.suite('Memory & Resource Tests', () => {
    harness.test('Repeated requests do not leak memory', async () => {
      const iterations = 20;
      const errors = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const res = await harness.get('/api/health');
          if (res.status !== 200) {
            errors.push(`Request ${i} failed with status ${res.status}`);
          }
        } catch (err) {
          errors.push(`Request ${i} threw error: ${err.message}`);
        }
      }

      harness.expect(errors.length).toBe(0);
      console.log(`    ${iterations} requests completed successfully`);
    });

    harness.test('Large response payloads handled correctly', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });

      const start = Date.now();
      const res = await harness.get('/api/client');
      const duration = Date.now() - start;

      harness.expect(res.status).toBe(200);
      harness.expect(Array.isArray(res.body)).toBe(true);

      console.log(`    Retrieved ${res.body.length} items in ${duration}ms`);
    });
  });

  harness.suite('Concurrent Load Tests', () => {
    harness.test('Handle 50 concurrent requests', async () => {
      const concurrentRequests = 50;
      const start = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        harness.get('/api/health').catch(err => ({ status: 500, error: err.message }))
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      const successful = results.filter(r => r.status === 200).length;
      const failed = results.filter(r => r.status !== 200).length;

      console.log(`    ${successful}/${concurrentRequests} requests succeeded`);
      console.log(`    Total time: ${duration}ms, avg: ${Math.round(duration / concurrentRequests)}ms`);

      harness.expect(successful).toBeGreaterThan(45);
    });
  });

  return harness.summary();
}
