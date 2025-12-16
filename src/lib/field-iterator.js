

function getFieldsByFilter(spec, filter) {
  const fields = [];
  for (const [key, field] of Object.entries(spec.fields)) {
    if (filter(field)) fields.push({ key, ...field });
  }
  return fields;
}

function getFieldKeysByFilter(spec, filter) {
  const keys = [];
  for (const [key, field] of Object.entries(spec.fields)) {
    if (filter(field)) keys.push(key);
  }
  return keys;
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
  return getFieldKeysByFilter(spec, f => !f.hidden && !f.readOnly && f.type !== 'id');
}

export function getRequiredFields(spec) {
  return getFieldKeysByFilter(spec, f => f.required);
}

export function getSearchFields(spec) {
  return getFieldKeysByFilter(spec, f => f.search);
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

export function forEachField(spec, callback, filter = () => true) {
  for (const [key, field] of Object.entries(spec.fields)) {
    if (filter(field)) callback(key, field);
  }
}
