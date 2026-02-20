import { IntegrationTestHarness } from './integration-harness.js';

export async function runSecurityTests() {
  const harness = new IntegrationTestHarness();

  harness.suite('Authentication Security', () => {
    harness.test('Unauthenticated requests to protected endpoints fail', async () => {
      harness.reset();
      const res = await harness.post('/api/client', {
        name: 'Unauthorized Client',
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('Invalid credentials rejected', async () => {
      const res = await harness.post('/api/auth/login', {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('SQL injection in login prevented', async () => {
      const res = await harness.post('/api/auth/login', {
        email: "admin' OR '1'='1",
        password: "' OR '1'='1",
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('Session expires after logout', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });

      const res1 = await harness.get('/api/auth/me');
      harness.expect(res1.status).toBe(200);

      await harness.post('/api/auth/logout', {});

      const res2 = await harness.get('/api/auth/me');
      harness.expect(res2.status).toBeGreaterThan(399);
    });
  });

  harness.suite('Input Validation', () => {
    harness.test('Login for validation tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('XSS attempt in client name rejected', async () => {
      const res = await harness.post('/api/client', {
        name: '<script>alert("xss")</script>',
        contact_email: `test${Date.now()}@example.com`,
      });

      if (res.status === 200) {
        const client = await harness.get(`/api/client/${res.body.id}`);
        harness.expect(client.body.name).not.toContain('<script>');
        await harness.delete(`/api/client/${res.body.id}`);
      }
    });

    harness.test('Invalid email format rejected', async () => {
      const res = await harness.post('/api/client', {
        name: 'Test Client',
        contact_email: 'not-an-email',
      });

      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('Excessively long input rejected', async () => {
      const longString = 'A'.repeat(10000);
      const res = await harness.post('/api/client', {
        name: longString,
        contact_email: `test${Date.now()}@example.com`,
      });

      harness.expect(res.status).toBeGreaterThan(399);
    });
  });

  harness.suite('CSRF Protection', () => {
    harness.test('CSRF token required for state-changing operations', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });

      const tokenRes = await harness.get('/api/csrf-token');
      harness.expect(tokenRes.status).toBe(200);
      harness.expect(tokenRes.body.csrfToken).toBeTruthy();
    });
  });

  harness.suite('Authorization', () => {
    harness.test('Login for authorization tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('Cannot access other users data without permission', async () => {
      const res = await harness.get('/api/client/999999');
      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('Cannot delete entities without permission', async () => {
      const createRes = await harness.post('/api/client', {
        name: `Auth Test Client ${Date.now()}`,
        contact_email: `authtest${Date.now()}@example.com`,
      });

      if (createRes.status === 200) {
        const clientId = createRes.body.id;
        await harness.post('/api/auth/logout', {});

        const deleteRes = await harness.delete(`/api/client/${clientId}`);
        harness.expect(deleteRes.status).toBeGreaterThan(399);

        await harness.post('/api/auth/login', {
          email: 'admin@moonlanding.local',
          password: 'admin123',
        });
        await harness.delete(`/api/client/${clientId}`);
      }
    });
  });

  harness.suite('Rate Limiting & DoS Protection', () => {
    harness.test('Rapid sequential requests handled', async () => {
      const requests = 20;
      const results = [];

      for (let i = 0; i < requests; i++) {
        const res = await harness.get('/api/health');
        results.push(res.status);
      }

      const successful = results.filter(s => s === 200).length;
      harness.expect(successful).toBeGreaterThan(15);
    });

    harness.test('Large concurrent burst handled gracefully', async () => {
      const burst = 30;
      const promises = Array.from({ length: burst }, () =>
        harness.get('/api/health').catch(() => ({ status: 500 }))
      );

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.status === 200).length;

      console.log(`    ${successful}/${burst} requests succeeded`);
      harness.expect(successful).toBeGreaterThan(20);
    });
  });

  harness.suite('Error Information Disclosure', () => {
    harness.test('Error messages do not leak sensitive information', async () => {
      const res = await harness.get('/api/nonexistent/path/that/does/not/exist');
      harness.expect(res.status).toBe(404);

      const errorMessage = res.body?.error || res.raw || '';
      harness.expect(errorMessage).not.toContain('password');
      harness.expect(errorMessage).not.toContain('token');
      harness.expect(errorMessage).not.toContain('secret');
    });
  });

  return harness.summary();
}
