import { getDatabase, now } from './database-init';
import { getSpec } from '@/config';

export function remove(entityName, id) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  try {
    const db = getDatabase();

    if (spec.fields.status) {
      const hasUpdatedAt = spec.fields.updated_at;
      if (hasUpdatedAt) {
        db.prepare(`UPDATE ${spec.name} SET status = 'deleted', updated_at = ? WHERE id = ?`).run(now(), id);
      } else {
        db.prepare(`UPDATE ${spec.name} SET status = 'deleted' WHERE id = ?`).run(id);
      }
    } else {
      db.prepare(`DELETE FROM ${spec.name} WHERE id = ?`).run(id);
    }
  } catch (error) {
    console.error(`[DATABASE] Remove error for ${entityName}:${id}:`, { error: error.message });
    throw error;
  }
}

export function softDelete(entityName, id) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  if (!spec.fields.status) {
    throw new Error(`${entityName} does not support soft delete (no status field)`);
  }

  try {
    const db = getDatabase();
    const hasUpdatedAt = spec.fields.updated_at;

    if (hasUpdatedAt) {
      db.prepare(`UPDATE ${spec.name} SET status = 'deleted', updated_at = ? WHERE id = ?`).run(now(), id);
    } else {
      db.prepare(`UPDATE ${spec.name} SET status = 'deleted' WHERE id = ?`).run(id);
    }
  } catch (error) {
    console.error(`[DATABASE] SoftDelete error for ${entityName}:${id}:`, { error: error.message });
    throw error;
  }
}

export function hardDelete(entityName, id) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  try {
    const db = getDatabase();
    db.prepare(`DELETE FROM ${spec.name} WHERE id = ?`).run(id);
  } catch (error) {
    console.error(`[DATABASE] HardDelete error for ${entityName}:${id}:`, { error: error.message });
    throw error;
  }
}

export function restore(entityName, id) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  if (!spec.fields.status) {
    throw new Error(`${entityName} does not support restore (no status field)`);
  }

  try {
    const db = getDatabase();
    const hasUpdatedAt = spec.fields.updated_at;

    if (hasUpdatedAt) {
      db.prepare(`UPDATE ${spec.name} SET status = 'active', updated_at = ? WHERE id = ?`).run(now(), id);
    } else {
      db.prepare(`UPDATE ${spec.name} SET status = 'active' WHERE id = ?`).run(id);
    }
  } catch (error) {
    console.error(`[DATABASE] Restore error for ${entityName}:${id}:`, { error: error.message });
    throw error;
  }
}

export function deleteMany(entityName, ids) {
  const results = [];
  const errors = [];

  for (let i = 0; i < ids.length; i++) {
    try {
      remove(entityName, ids[i]);
      results.push({ id: ids[i], success: true });
    } catch (error) {
      errors.push({ index: i, id: ids[i], error: error.message });
    }
  }

  return {
    deleted: results,
    errors,
    successCount: results.length,
    errorCount: errors.length,
  };
}
