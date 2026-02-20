import { IntegrationTestHarness } from './integration-harness.js';

export function registerRuntimeEdgeCases(harness) {
  harness.suite('Concurrent Operations', () => {
    harness.test('Login for concurrent tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('Simultaneous creates do not conflict', async () => {
      const creates = Array.from({ length: 5 }, (_, i) =>
        harness.post('/api/client', {
          name: `Concurrent Client ${i} ${Date.now()}`,
          contact_email: `concurrent${i}-${Date.now()}@example.com`,
        })
      );

      const results = await Promise.all(creates);
      const successful = results.filter(r => r.status === 200);

      harness.expect(successful.length).toBe(5);

      const ids = successful.map(r => r.body.id);
      const uniqueIds = new Set(ids);
      harness.expect(uniqueIds.size).toBe(5);

      await Promise.all(ids.map(id => harness.delete(`/api/client/${id}`)));
    });

    harness.test('Concurrent updates to same entity', async () => {
      const createRes = await harness.post('/api/client', {
        name: 'Update Test',
        contact_email: `updatetest${Date.now()}@example.com`,
      });

      const clientId = createRes.body.id;

      const updates = Array.from({ length: 3 }, (_, i) =>
        harness.put(`/api/client/${clientId}`, {
          name: `Updated ${i}`,
        })
      );

      const results = await Promise.all(updates);
      const successful = results.filter(r => r.status === 200);

      harness.expect(successful.length).toBeGreaterThan(0);

      await harness.delete(`/api/client/${clientId}`);
    });
  });

  harness.suite('Data Integrity', () => {
    harness.test('Login for integrity tests', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('Created entity immediately retrievable', async () => {
      const createRes = await harness.post('/api/client', {
        name: `Immediate Test ${Date.now()}`,
        contact_email: `immediate${Date.now()}@example.com`,
      });

      harness.expect(createRes.status).toBe(200);
      const clientId = createRes.body.id;

      const getRes = await harness.get(`/api/client/${clientId}`);
      harness.expect(getRes.status).toBe(200);
      harness.expect(getRes.body.id).toBe(clientId);

      await harness.delete(`/api/client/${clientId}`);
    });

    harness.test('Updated fields persist correctly', async () => {
      const createRes = await harness.post('/api/client', {
        name: 'Original Name',
        contact_email: `persist${Date.now()}@example.com`,
        contact_phone: '555-0100',
      });

      const clientId = createRes.body.id;
      const newName = `Updated ${Date.now()}`;

      await harness.put(`/api/client/${clientId}`, {
        name: newName,
      });

      const getRes = await harness.get(`/api/client/${clientId}`);
      harness.expect(getRes.body.name).toBe(newName);
      harness.expect(getRes.body.contact_phone).toBe('555-0100');

      await harness.delete(`/api/client/${clientId}`);
    });

    harness.test('Deleted entity truly removed', async () => {
      const createRes = await harness.post('/api/client', {
        name: 'Delete Test',
        contact_email: `deletetest${Date.now()}@example.com`,
      });

      const clientId = createRes.body.id;

      await harness.delete(`/api/client/${clientId}`);

      const getRes = await harness.get(`/api/client/${clientId}`);
      harness.expect(getRes.status).toBeGreaterThan(399);
    });
  });
}
