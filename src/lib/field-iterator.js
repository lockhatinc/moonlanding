// Field iterator utilities - consolidates repeated Object.entries(spec.fields) patterns
// Reduces duplication across engine.js, page-factory.js, form utils, and component rendering

export function forEachField(spec, callback, filter = () => true) {
  for (const [key, field] of Object.entries(spec.fields)) {
    if (filter(field)) callback(key, field);
  }
}

export function iterateCreateFields(spec, callback) {
  forEachField(spec, callback, f => f.type !== 'id');
}

export function iterateUpdateFields(spec, callback) {
  forEachField(spec, callback, f => !f.readOnly && f.type !== 'id');
}

export function iterateFormFields(spec, callback) {
  forEachField(spec, callback, f => !f.hidden && !f.readOnly && f.type !== 'id');
}

export function iterateListFields(spec, callback) {
  forEachField(spec, callback, f => f.list === true);
}

export function iterateDisplayFields(spec, callback) {
  forEachField(spec, callback, f => !f.hidden && f.type !== 'id');
}

export function iterateRefFields(spec, callback) {
  forEachField(spec, callback, f => f.type === 'ref' && f.ref);
}

export function getFieldsByFilter(spec, filter) {
  const fields = [];
  forEachField(spec, (key, field) => fields.push({ key, ...field }), filter);
  return fields;
}

export function getCreateFields(spec) {
  return getFieldsByFilter(spec, f => f.type !== 'id');
}

export function getUpdateFields(spec) {
  return getFieldsByFilter(spec, f => !f.readOnly && f.type !== 'id');
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

export function getRefFields(spec) {
  return getFieldsByFilter(spec, f => f.type === 'ref' && f.ref);
}
