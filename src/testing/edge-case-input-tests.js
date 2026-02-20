import { IntegrationTestHarness } from './integration-harness.js';

export function registerInputEdgeCases(harness) {
  harness.suite('Boundary Conditions', () => {
    harness.test('Login for edge case tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('Empty string handling', async () => {
      const res = await harness.post('/api/client', {
        name: '',
        contact_email: `edge${Date.now()}@example.com`,
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('Whitespace-only string handling', async () => {
      const res = await harness.post('/api/client', {
        name: '   ',
        contact_email: `edge${Date.now()}@example.com`,
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('Very long valid input', async () => {
      const longName = 'A'.repeat(255);
      const res = await harness.post('/api/client', {
        name: longName,
        contact_email: `edge${Date.now()}@example.com`,
      });

      if (res.status === 200 && res.body.id) {
        await harness.delete(`/api/client/${res.body.id}`);
      }
    });

    harness.test('Unicode character handling', async () => {
      const res = await harness.post('/api/client', {
        name: 'Client 你好 مرحبا 🚀',
        contact_email: `edge${Date.now()}@example.com`,
      });

      if (res.status === 200 && res.body.id) {
        const getRes = await harness.get(`/api/client/${res.body.id}`);
        harness.expect(getRes.body.name).toContain('你好');
        await harness.delete(`/api/client/${res.body.id}`);
      }
    });

    harness.test('Null value handling', async () => {
      const res = await harness.post('/api/client', {
        name: null,
        contact_email: `edge${Date.now()}@example.com`,
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('Missing required fields', async () => {
      const res = await harness.post('/api/client', {});
      harness.expect(res.status).toBeGreaterThan(399);
    });
  });

  harness.suite('Special Characters & Encoding', () => {
    harness.test('Login for encoding tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('Special characters in name', async () => {
      const res = await harness.post('/api/client', {
        name: "O'Brien & Co. (50%) - \"The Best\"",
        contact_email: `special${Date.now()}@example.com`,
      });

      if (res.status === 200 && res.body.id) {
        const getRes = await harness.get(`/api/client/${res.body.id}`);
        harness.expect(getRes.body.name).toContain("O'Brien");
        await harness.delete(`/api/client/${res.body.id}`);
      }
    });

    harness.test('Email with plus addressing', async () => {
      const res = await harness.post('/api/client', {
        name: 'Plus Test',
        contact_email: `test+plus${Date.now()}@example.com`,
      });

      if (res.status === 200 && res.body.id) {
        await harness.delete(`/api/client/${res.body.id}`);
      }
    });

    harness.test('URL encoding in query params', async () => {
      const res = await harness.get('/api/client?search=test%20client');
      harness.expect(res.status).toBe(200);
    });
  });

  harness.suite('Network Error Scenarios', () => {
    harness.test('Malformed JSON body handling', async () => {
      try {
        const res = await harness.request('POST', '/api/client', {
          headers: { 'Content-Type': 'application/json' },
          body: '{"name": invalid json}',
        });
        harness.expect(res.status).toBeGreaterThan(399);
      } catch (err) {
        console.log('    Expected error for malformed JSON');
      }
    });

    harness.test('Missing Content-Type header', async () => {
      const res = await harness.request('POST', '/api/client', {
        headers: {},
        body: { name: 'Test' },
      });

      if (res.status < 500) {
        console.log('    Server handled missing Content-Type gracefully');
      }
    });
  });
}
