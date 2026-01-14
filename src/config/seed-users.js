import { create, getBy, hashPassword } from '@/engine';

/**
 * Seeds the database with default users
 * This is called during system initialization if needed
 */
export async function seedUsers() {
  try {
    // Check if admin user already exists
    const existingAdmin = getBy('user', 'email', 'admin@example.com');
    if (existingAdmin) {
      console.log('[Seed Users] Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword('password');
    const adminUser = create('user', {
      email: 'admin@example.com',
      name: 'Admin User',
      password_hash: hashedPassword,
      role: 'partner',
      status: 'active',
    });

    console.log('[Seed Users] Admin user created:', adminUser.id);

    // Create a team user
    const existingTeamUser = getBy('user', 'email', 'team@example.com');
    if (!existingTeamUser) {
      const teamUserPassword = await hashPassword('password');
      const teamUser = create('user', {
        email: 'team@example.com',
        name: 'Team User',
        password_hash: teamUserPassword,
        role: 'manager',
        status: 'active',
      });
      console.log('[Seed Users] Team user created:', teamUser.id);
    }

    // Create a clerk user
    const existingClerkUser = getBy('user', 'email', 'clerk@example.com');
    if (!existingClerkUser) {
      const clerkUserPassword = await hashPassword('password');
      const clerkUser = create('user', {
        email: 'clerk@example.com',
        name: 'Clerk User',
        password_hash: clerkUserPassword,
        role: 'clerk',
        status: 'active',
      });
      console.log('[Seed Users] Clerk user created:', clerkUser.id);
    }
  } catch (error) {
    console.error('[Seed Users] Error:', error.message);
    // Don't throw - seeding failure should not crash the system
  }
}
