import { getDatabase, now } from './database-init';
import { getSpec } from '@/config';
import { iterateUpdateFields } from '@/lib/field-iterator';
import { coerceFieldValue } from '@/lib/field-registry';

export function update(entityName, id, data, user = null) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const fields = {};

  try {
    iterateUpdateFields(spec, (key, field) => {
      if (field.auto === 'update') {
        fields[key] = now();
      } else if (data[key] !== undefined) {
        const coercedValue = coerceFieldValue(data[key], field.type);
        fields[key] = coercedValue === undefined ? null : coercedValue;
      }
    });

    if (!Object.keys(fields).length) {
      return;
    }

    const setClause = Object.keys(fields)
      .map(k => `${k} = ?`)
      .join(', ');
    const sql = `UPDATE ${spec.name} SET ${setClause} WHERE id = ?`;

    const db = getDatabase();
    db.prepare(sql).run(...Object.values(fields), id);
  } catch (error) {
    console.error(`[DATABASE] Update error for ${entityName}:${id}:`, { error: error.message, data });
    throw error;
  }
}

export function updateFields(entityName, id, fieldUpdates, user = null) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const fields = {};

  try {
    for (const [key, value] of Object.entries(fieldUpdates)) {
      const field = spec.fields[key];
      if (!field) {
        console.warn(`[DATABASE] Unknown field: ${key} on ${entityName}`);
        continue;
      }

      if (field.auto === 'id' || field.auto === 'now' && key !== 'updated_at') {
        console.warn(`[DATABASE] Cannot update auto field: ${key}`);
        continue;
      }

      if (key === 'updated_at' || field.auto === 'update') {
        fields[key] = now();
      } else {
        const coercedValue = coerceFieldValue(value, field.type);
        fields[key] = coercedValue === undefined ? null : coercedValue;
      }
    }

    if (!Object.keys(fields).length) {
      return;
    }

    const setClause = Object.keys(fields)
      .map(k => `${k} = ?`)
      .join(', ');
    const sql = `UPDATE ${spec.name} SET ${setClause} WHERE id = ?`;

    const db = getDatabase();
    db.prepare(sql).run(...Object.values(fields), id);
  } catch (error) {
    console.error(`[DATABASE] UpdateFields error for ${entityName}:${id}:`, { error: error.message });
    throw error;
  }
}

export function updateMany(entityName, updates, user = null) {
  const results = [];
  const errors = [];

  for (let i = 0; i < updates.length; i++) {
    try {
      const { id, data } = updates[i];
      update(entityName, id, data, user);
      results.push({ id, success: true });
    } catch (error) {
      errors.push({ index: i, id: updates[i].id, error: error.message });
    }
  }

  return {
    updated: results,
    errors,
    successCount: results.length,
    errorCount: errors.length,
  };
}
