#!/usr/bin/env node

import { create, hashPassword, migrate, getBy } from '../src/engine.js';

async function createTestUser() {
  // Run migrations
  migrate();

  // Check if user exists
  const existingUser = getBy('user', 'email', 'admin@example.com');
  if (existingUser) {
    console.log('User already exists:', existingUser);
    process.exit(0);
  }

  // Hash password
  const passwordHash = await hashPassword('password');

  // Create user
  const user = create('user', {
    email: 'admin@example.com',
    name: 'Admin User',
    password_hash: passwordHash,
    role: 'partner',
    status: 'active'
  });

  console.log('Test user created successfully:');
  console.log('- ID:', user.id);
  console.log('- Email: admin@example.com');
  console.log('- Name: Admin User');
  console.log('- Role: partner');
  console.log('- Status: active');
  console.log('- Password: password');
}

createTestUser().catch(err => {
  console.error('Error creating test user:', err);
  process.exit(1);
});
