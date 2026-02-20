// User deduplication - merge Friday + MWR users by email
import { uuid, toTs, now } from './transformers.js';

export function deduplicateUsers(fridayUsers, mwrUsers) {
  const byEmail = new Map(); // email -> merged user record
  const cloudIdToUuid = new Map(); // cloud_id -> uuid (for FK remapping)

  const norm = email => (email || '').trim().toLowerCase();

  function upsert(cloudId, email, data, source) {
    const key = norm(email);
    if (!key) return;
    if (!byEmail.has(key)) {
      const id = uuid();
      byEmail.set(key, { id, email: key, ...data, source });
      cloudIdToUuid.set(cloudId, id);
    } else {
      // Already exists - map cloud_id to existing uuid
      const existing = byEmail.get(key);
      cloudIdToUuid.set(cloudId, existing.id);
      // Merge non-null fields from later source
      for (const [k, v] of Object.entries(data)) {
        if (v !== null && v !== undefined && v !== '' && !existing[k]) {
          existing[k] = v;
        }
      }
    }
  }

  for (const { id, data: d } of fridayUsers) {
    upsert(id, d.email, {
      name: d.name || d.displayName || '',
      photo: d.photo || d.photoURL || null,
      role: d.role || 'user',
      status: (d.status || 'active').toLowerCase(),
      created_at: toTs(d.createdTime || d.created_at),
      updated_at: now(),
    }, 'friday');
  }

  for (const { id, data: d } of mwrUsers) {
    upsert(id, d.email, {
      name: d.name || '',
      photo: d.photo || null,
      role: d.role || 'user',
      status: (d.status || 'active').toLowerCase(),
      created_at: now(),
      updated_at: now(),
    }, 'mwr');
  }

  const users = Array.from(byEmail.values());
  console.log(`  Dedup: ${fridayUsers.length} Friday + ${mwrUsers.length} MWR = ${users.length} unique users`);
  return { users, cloudIdToUuid };
}
