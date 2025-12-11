// Shared form utilities for entity forms
import { list } from '@/engine';

/**
 * Load options for all ref fields in a spec
 * @param {Object} spec - Entity specification
 * @returns {Object} Options keyed by field name
 */
export async function loadOptions(spec) {
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
