import { getDatabase, genId, now } from './database-init';
import { getSpec } from '@/config';
import { iterateCreateFields } from '@/lib/field-iterator';
import { coerceFieldValue } from '@/lib/field-registry';

export function create(entityName, data, user = null) {
  const spec = getSpec(entityName);
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const id = data.id || genId();
  const fields = { id };

  try {
    iterateCreateFields(spec, (key, field) => {
      if (field.auto === 'now') {
        fields[key] = now();
      } else if (field.auto === 'user' && user) {
        fields[key] = user.id;
      } else if (data[key] !== undefined && data[key] !== '') {
        const coercedValue = coerceFieldValue(data[key], field.type);
        if (coercedValue !== undefined) {
          fields[key] = coercedValue;
        }
      } else if (field.default !== undefined) {
        fields[key] = coerceFieldValue(field.default, field.type);
      }
    });

    const keys = Object.keys(fields);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${spec.name} (${keys.join(', ')}) VALUES (${placeholders})`;

    const db = getDatabase();
    db.prepare(sql).run(...Object.values(fields));

    return { id, ...fields };
  } catch (error) {
    console.error(`[DATABASE] Create error for ${entityName}:`, { error: error.message, data });
    throw error;
  }
}

export function createMany(entityName, dataArray, user = null) {
  const results = [];
  const errors = [];

  for (let i = 0; i < dataArray.length; i++) {
    try {
      const result = create(entityName, dataArray[i], user);
      results.push(result);
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }

  return {
    created: results,
    errors,
    successCount: results.length,
    errorCount: errors.length,
  };
}
