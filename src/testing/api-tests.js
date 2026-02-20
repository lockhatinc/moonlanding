import { IntegrationTestHarness } from './integration-harness.js';

export async function runApiTests() {
  const harness = new IntegrationTestHarness();

  await harness.suite('Health Check', async () => {
    harness.test('GET /api/health returns 200', async () => {
      const res = await harness.get('/api/health');
      harness.expect(res.status).toBe(200);
      harness.expect(res.body).toBeTruthy();
      harness.expect(res.body.status).toBe('ok');
    });
  });

  harness.suite('Authentication', () => {
    harness.test('GET /api/csrf-token returns CSRF token', async () => {
      const res = await harness.get('/api/csrf-token');
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.csrfToken).toBeTruthy();
    });

    harness.test('POST /api/auth/login with valid credentials', async () => {
      const res = await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.user).toBeTruthy();
      harness.expect(res.body.user.email).toBe('admin@moonlanding.local');
    });

    harness.test('GET /api/auth/me returns current user', async () => {
      const res = await harness.get('/api/auth/me');
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.user).toBeTruthy();
    });

    harness.test('POST /api/auth/logout clears session', async () => {
      const res = await harness.post('/api/auth/logout', {});
      harness.expect(res.status).toBe(200);
    });

    harness.test('POST /api/auth/login with invalid credentials fails', async () => {
      const res = await harness.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });
  });

  harness.suite('Entity API', () => {
    let testClientId;

    harness.test('Login for entity tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('POST /api/client creates new client', async () => {
      const res = await harness.post('/api/client', {
        name: `Test Client ${Date.now()}`,
        contact_email: `test${Date.now()}@example.com`,
        contact_phone: '555-0100',
      });
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.id).toBeTruthy();
      testClientId = res.body.id;
    });

    harness.test('GET /api/client lists clients', async () => {
      const res = await harness.get('/api/client');
      harness.expect(res.status).toBe(200);
      harness.expect(Array.isArray(res.body)).toBe(true);
      harness.expect(res.body.length).toBeGreaterThan(0);
    });

    harness.test('GET /api/client/:id retrieves specific client', async () => {
      const res = await harness.get(`/api/client/${testClientId}`);
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.id).toBe(testClientId);
    });

    harness.test('PUT /api/client/:id updates client', async () => {
      const res = await harness.put(`/api/client/${testClientId}`, {
        name: `Updated Test Client ${Date.now()}`,
      });
      harness.expect(res.status).toBe(200);
    });

    harness.test('DELETE /api/client/:id removes client', async () => {
      const res = await harness.delete(`/api/client/${testClientId}`);
      harness.expect(res.status).toBe(200);
    });
  });

  harness.suite('Friday API', () => {
    harness.test('Login for Friday tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('GET /api/friday/features returns feature flags', async () => {
      const res = await harness.get('/api/friday/features');
      harness.expect(res.status).toBe(200);
      harness.expect(res.body).toBeTruthy();
    });

    harness.test('GET /api/friday/version returns version info', async () => {
      const res = await harness.get('/api/friday/version');
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.version).toBeTruthy();
    });
  });

  harness.suite('MWR API', () => {
    harness.test('Login for MWR tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('GET /api/mwr/features returns feature flags', async () => {
      const res = await harness.get('/api/mwr/features');
      harness.expect(res.status).toBe(200);
      harness.expect(res.body).toBeTruthy();
    });

    harness.test('GET /api/mwr/template lists templates', async () => {
      const res = await harness.get('/api/mwr/template');
      harness.expect(res.status).toBe(200);
      harness.expect(Array.isArray(res.body)).toBe(true);
    });
  });

  harness.suite('Error Handling', () => {
    harness.test('GET /api/nonexistent returns 404', async () => {
      const res = await harness.get('/api/nonexistent');
      harness.expect(res.status).toBe(404);
    });

    harness.test('POST /api/client without auth fails', async () => {
      harness.reset();
      const res = await harness.post('/api/client', {
        name: 'Unauthorized Client',
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });
  });

  return harness.summary();
}
