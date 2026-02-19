import { getDatabase, genId, now } from '@/lib/database-core';
import bcrypt from 'bcrypt';

export async function seedUsers() {
  const db = getDatabase();
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existing.count > 0) return;

  const hash = await bcrypt.hash('admin123', 12);
  const id = genId();
  const timestamp = now();

  db.prepare(`INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, 'Admin', 'admin@moonlanding.local', hash, 'partner', 'active', timestamp, timestamp
  );

  console.log('[SeedUsers] Default admin user created (admin@moonlanding.local / admin123)');
}
