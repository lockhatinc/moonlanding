'use server';

import { getBy, create } from '@/engine/crud';
import { createSession, hashPassword, verifyPassword } from '@/engine/auth';
import { redirect } from 'next/navigation';
import { specs } from '@/engine/spec';
import { migrate } from '@/engine/db';

// Ensure database is initialized
migrate(specs);

export async function loginAction(formData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    // Find user by email
    let user = getBy('user', 'email', email);

    // If no user exists and using demo credentials, create one
    if (!user && email === 'admin@example.com' && password === 'password') {
      user = create('user', {
        email: 'admin@example.com',
        name: 'Admin User',
        type: 'auditor',
        role: 'partner',
        status: 'active',
        password_hash: hashPassword('password'),
      });
    }

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    // Verify password (skip for demo if no hash exists)
    if (user.password_hash && !verifyPassword(password, user.password_hash)) {
      return { error: 'Invalid email or password' };
    }

    // Create session
    await createSession(user.id);
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An error occurred during login' };
  }

  redirect('/');
}
