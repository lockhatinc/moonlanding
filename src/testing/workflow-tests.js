import { IntegrationTestHarness } from './integration-harness.js';

export async function runWorkflowTests() {
  const harness = new IntegrationTestHarness();

  harness.suite('Client Management Workflow', () => {
    let clientId;

    harness.test('User logs in', async () => {
      const res = await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.user).toBeTruthy();
    });

    harness.test('User creates new client', async () => {
      const res = await harness.post('/api/client', {
        name: `Workflow Client ${Date.now()}`,
        contact_email: `workflow${Date.now()}@example.com`,
        contact_phone: '555-0199',
      });
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.id).toBeTruthy();
      clientId = res.body.id;
    });

    harness.test('User views client list', async () => {
      const res = await harness.get('/api/client');
      harness.expect(res.status).toBe(200);
      harness.expect(Array.isArray(res.body)).toBe(true);

      const createdClient = res.body.find(c => c.id === clientId);
      harness.expect(createdClient).toBeTruthy();
    });

    harness.test('User views client details', async () => {
      const res = await harness.get(`/api/client/${clientId}`);
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.id).toBe(clientId);
    });

    harness.test('User updates client information', async () => {
      const res = await harness.put(`/api/client/${clientId}`, {
        name: `Updated Workflow Client ${Date.now()}`,
        contact_phone: '555-0299',
      });
      harness.expect(res.status).toBe(200);
    });

    harness.test('User verifies update', async () => {
      const res = await harness.get(`/api/client/${clientId}`);
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.contact_phone).toBe('555-0299');
    });

    harness.test('User deletes client', async () => {
      const res = await harness.delete(`/api/client/${clientId}`);
      harness.expect(res.status).toBe(200);
    });

    harness.test('Deleted client no longer appears in list', async () => {
      const res = await harness.get('/api/client');
      harness.expect(res.status).toBe(200);

      const deletedClient = res.body.find(c => c.id === clientId);
      harness.expect(deletedClient).toBeFalsy();
    });
  });

  harness.suite('Engagement Lifecycle Workflow', () => {
    let clientId;
    let engagementId;

    harness.test('Setup: Create client for engagement', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });

      const res = await harness.post('/api/client', {
        name: `Engagement Test Client ${Date.now()}`,
        contact_email: `engtest${Date.now()}@example.com`,
      });
      harness.expect(res.status).toBe(200);
      clientId = res.body.id;
    });

    harness.test('Create new engagement', async () => {
      const res = await harness.post('/api/engagement', {
        client_id: clientId,
        name: `Test Engagement ${Date.now()}`,
        type: 'audit',
        status: 'planning',
      });
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.id).toBeTruthy();
      engagementId = res.body.id;
    });

    harness.test('View engagement details', async () => {
      const res = await harness.get(`/api/engagement/${engagementId}`);
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.id).toBe(engagementId);
      harness.expect(res.body.client_id).toBe(clientId);
    });

    harness.test('Update engagement status', async () => {
      const res = await harness.put(`/api/engagement/${engagementId}`, {
        status: 'in_progress',
      });
      harness.expect(res.status).toBe(200);
    });

    harness.test('Cleanup: Delete engagement and client', async () => {
      await harness.delete(`/api/engagement/${engagementId}`);
      await harness.delete(`/api/client/${clientId}`);
    });
  });

  harness.suite('Multi-User Collaboration Workflow', () => {
    let clientId;

    harness.test('Admin creates shared client', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });

      const res = await harness.post('/api/client', {
        name: `Shared Client ${Date.now()}`,
        contact_email: `shared${Date.now()}@example.com`,
      });
      harness.expect(res.status).toBe(200);
      clientId = res.body.id;
    });

    harness.test('Admin views client', async () => {
      const res = await harness.get(`/api/client/${clientId}`);
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.id).toBe(clientId);
    });

    harness.test('Cleanup: Delete shared client', async () => {
      await harness.delete(`/api/client/${clientId}`);
    });
  });

  harness.suite('Error Recovery Workflow', () => {
    harness.test('User logs in', async () => {
      await harness.post('/api/auth/login', {
        email: 'admin@moonlanding.local',
        password: 'admin123',
      });
    });

    harness.test('Attempt invalid operation', async () => {
      const res = await harness.post('/api/client', {
        name: '',
        contact_email: 'invalid',
      });
      harness.expect(res.status).toBeGreaterThan(399);
    });

    harness.test('Retry with valid data succeeds', async () => {
      const res = await harness.post('/api/client', {
        name: `Recovery Client ${Date.now()}`,
        contact_email: `recovery${Date.now()}@example.com`,
      });
      harness.expect(res.status).toBe(200);

      if (res.body.id) {
        await harness.delete(`/api/client/${res.body.id}`);
      }
    });

    harness.test('Session persists after error', async () => {
      const res = await harness.get('/api/auth/me');
      harness.expect(res.status).toBe(200);
      harness.expect(res.body.user).toBeTruthy();
    });
  });

  return harness.summary();
}
