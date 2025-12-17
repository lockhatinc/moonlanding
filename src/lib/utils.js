import { list, getSpec } from '@/engine';

const SECONDS_TO_MS = 1000;

export function secondsToDate(seconds) {
  return seconds ? new Date(seconds * SECONDS_TO_MS) : null;
}

export function dateToSeconds(date) {
  return date ? Math.floor(date.getTime() / SECONDS_TO_MS) : null;
}

export function formatDate(value, format = 'locale') {
  if (!value) return null;
  const date = typeof value === 'number' ? secondsToDate(value) : new Date(value);
  if (isNaN(date.getTime())) return null;
  switch (format) {
    case 'iso': return date.toISOString().split('T')[0];
    case 'datetime': return date.toLocaleString();
    case 'time': return date.toLocaleTimeString();
    default: return date.toLocaleDateString();
  }
}

export function parseDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return dateToSeconds(date);
}

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
