import { SQL_TYPES } from './constants.js';

export function validateSpec(spec) {
  if (!spec.fields.id) throw new Error(`Spec ${spec.name} must have id field`);
  for (const [, field] of Object.entries(spec.fields)) {
    if (!SQL_TYPES[field.type]) throw new Error(`Unknown field type: ${field.type}`);
  }
}
