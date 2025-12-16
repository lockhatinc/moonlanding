// UNIFIED FIELD ITERATOR - Single source for field filtering/selection
// Eliminates duplication from config/index.js, field-types.js, and field-iterator patterns
// All spec-based field selection happens here

function getFieldsByFilter(spec, filter) {
  const fields = [];
  for (const [key, field] of Object.entries(spec.fields)) {
    if (filter(field)) fields.push({ key, ...field });
  }
  return fields;
}

export function getFormFields(spec) {
  return getFieldsByFilter(spec, f => !f.hidden && !f.readOnly && f.type !== 'id');
}

export function getListFields(spec) {
  return getFieldsByFilter(spec, f => f.list === true);
}

export function getDisplayFields(spec) {
  return getFieldsByFilter(spec, f => !f.hidden && f.type !== 'id');
}

export function getEditableFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && !f.readOnly && f.type !== 'id')
    .map(([key]) => key);
}

export function getRequiredFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.required)
    .map(([key]) => key);
}

export function getSearchFields(spec) {
  return Object.entries(spec.fields)
    .filter(([_, f]) => f.search)
    .map(([key]) => key);
}

export function getFilterableFields(spec) {
  return (spec.list?.filters || [])
    .map(filterKey => spec.fields[filterKey])
    .filter(Boolean);
}

export function getRefFields(spec) {
  return getFieldsByFilter(spec, f => f.type === 'ref' && f.ref);
}

export function getField(spec, fieldKey) {
  return spec.fields[fieldKey];
}

export function getFieldType(spec, fieldKey) {
  return spec.fields[fieldKey]?.type;
}

// Legacy iterator functions (kept for compatibility)
export function forEachField(spec, callback, filter = () => true) {
  for (const [key, field] of Object.entries(spec.fields)) {
    if (filter(field)) callback(key, field);
  }
}
