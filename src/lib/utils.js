import { list } from '@/engine';
import { getSpec } from '@/config/spec-helpers';

export { secondsToDate, dateToSeconds, formatDate, parseDate } from './date-utils';

export async function loadFormOptions(spec) {
  const options = {};
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.ref) {
      try {
        options[key] = list(field.ref).map(r => ({
          value: r.id,
          label: r.name || r.email || r.id
        }));
      } catch {
        options[key] = [];
      }
    }
  }
  return options;
}

export class SpecError extends Error {
  constructor(entity) {
    super(`Unknown entity: ${entity}`);
    this.code = 'UNKNOWN_ENTITY';
  }
}

export async function resolveSpec(entity) {
  try {
    return getSpec(entity);
  } catch (e) {
    throw new SpecError(entity);
  }
}
