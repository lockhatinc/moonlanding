import { getDatabase, create, getBy, hashPassword } from './src/engine.js';
import { initializeSystemConfig } from './src/config/system-config-loader.js';

async function seedTestUser() {
  try {
    // Initialize system config
    console.log('[Seed] Initializing system config...');
    await initializeSystemConfig();

    // Get database
    console.log('[Seed] Getting database...');
    const db = getDatabase();

    // Check if user already exists
    console.log('[Seed] Checking for existing test user...');
    const existing = getBy('user', 'email', 'admin@example.com');

    if (existing) {
      console.log('✓ Test user already exists: ' + existing.id);
      console.log('  Email: ' + existing.email);
      console.log('  Role: ' + existing.role);
      process.exit(0);
    }

    // Hash the password
    console.log('[Seed] Hashing password...');
    const passwordHash = await hashPassword('password');

    // Create test user
    console.log('[Seed] Creating test user...');
    const user = create('user', {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'partner',
      status: 'active',
      password_hash: passwordHash
    });

    console.log('✓ Test user created successfully');
    console.log('  ID: ' + user.id);
    console.log('  Email: ' + user.email);
    console.log('  Role: ' + user.role);

    process.exit(0);
  } catch (error) {
    console.error('✗ Seed error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedTestUser();
