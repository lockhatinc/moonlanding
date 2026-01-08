import { create, getBy, hashPassword, migrate, getDatabase } from './src/engine.js';
import { initializeSystemConfig } from './src/config/system-config-loader.js';
import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';

async function setupTestUsers() {
  console.log('[Setup] Initializing system config...');
  await initializeSystemConfig();
  migrate();
  
  const db = getDatabase();
  const adapter = new BetterSqlite3Adapter(db, { user: 'users', session: 'sessions' });
  const lucia = new Lucia(adapter, {
    sessionCookie: { expires: false, attributes: { secure: false } },
    getUserAttributes: (row) => ({ id: row.id, email: row.email, name: row.name, avatar: row.avatar, type: row.type, role: row.role }),
  });

  const testUsers = [
    { email: 'partner@test.com', name: 'Partner User', role: 'partner' },
    { email: 'manager@test.com', name: 'Manager User', role: 'manager' },
    { email: 'clerk@test.com', name: 'Clerk User', role: 'clerk' },
  ];

  const sessionMap = {};

  for (const userData of testUsers) {
    console.log(`[Setup] Creating user: ${userData.email} (${userData.role})`);
    
    let user = getBy('user', 'email', userData.email);
    
    if (!user) {
      const hashedPassword = await hashPassword('password123');
      user = create('user', {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password_hash: hashedPassword,
        status: 'active',
      });
      console.log(`[Setup] Created user ${userData.email} with ID: ${user.id}`);
    } else {
      console.log(`[Setup] User ${userData.email} already exists with ID: ${user.id}`);
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    sessionMap[userData.role] = sessionCookie.value;
    
    console.log(`[Setup] Created session for ${userData.role}: ${sessionCookie.value}`);
  }

  console.log('[Setup] Test sessions created:');
  Object.entries(sessionMap).forEach(([role, sessionId]) => {
    console.log(`  ${role}: ${sessionId}`);
  });

  console.log(`[Setup] Lucia session cookie name: ${lucia.sessionCookieName}`);
  
  return { sessionMap, lucia };
}

try {
  const result = await setupTestUsers();
  console.log('[Setup] SUCCESS - Test users and sessions ready');
} catch (err) {
  console.error('[Setup] ERROR:', err.message);
  process.exit(1);
}

