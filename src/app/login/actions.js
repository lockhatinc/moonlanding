'use server';

import { getBy, create, hashPassword, verifyPassword, migrate } from '@/engine';
import { createSession } from '@/engine.server';
import { specs } from '@/config/spec-helpers';
import { initializeSystemConfig } from '@/config/system-config-loader';
// Fallback: import { } from '@/config/spec-helpers';
import { redirect } from 'next/navigation';

let _initialized = false;

export async function loginAction(formData) {
  // Ensure system config is initialized before any database operations
  if (!_initialized) {
    _initialized = true;
    try {
      await initializeSystemConfig();
      migrate();
    } catch (e) {
      console.error('[LoginAction] Failed to initialize:', e.message);
      return { error: 'System initialization failed' };
    }
  }

  const email = formData.get('email'), password = formData.get('password');
  if (!email || !password) return { error: 'Email and password are required' };

  try {
    let user = getBy('user', 'email', email);
    if (!user) return { error: 'Invalid email or password' };
    if (user.password_hash && !(await verifyPassword(password, user.password_hash))) return { error: 'Invalid email or password' };
    await createSession(user.id);
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An error occurred during login' };
  }
  redirect('/');
}
