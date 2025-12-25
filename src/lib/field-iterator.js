export function fieldQuery(spec, predicates, options = {}) {
  const preds = Array.isArray(predicates) ? predicates : [predicates];
  const results = [];
  for (const [key, field] of Object.entries(spec.fields)) {
    if (preds.every(pred => pred(field, key))) {
      results.push(options.keysOnly ? key : { key, ...field });
    }
  }
  return results;
}

export const is = {
  notId: f => f.type !== 'id',
  notHidden: f => !f.hidden,
  notReadOnly: f => !f.readOnly,
  required: f => f.required,
  searchable: f => f.search,
  listable: f => f.list === true,
  ref: f => f.type === 'ref' && f.ref,
  editable: f => !f.hidden && !f.readOnly && f.type !== 'id' && !f.auto && f.type !== 'auto_timestamp' && !f.auto_generate,
  displayable: f => !f.hidden && f.type !== 'id',
  ofType: type => f => f.type === type,
  hasProperty: prop => f => f[prop] !== undefined,
};

export function getFormFields(spec) {
  if (spec.system_entity) return [];
  return fieldQuery(spec, is.editable);
}

export function getListFields(spec) {
  return fieldQuery(spec, is.listable);
}

export function getDisplayFields(spec) {
  return fieldQuery(spec, is.displayable);
}

export function getEditableFields(spec) {
  return fieldQuery(spec, is.editable, { keysOnly: true });
}

export function getRequiredFields(spec) {
  return fieldQuery(spec, is.required, { keysOnly: true });
}

export function getSearchFields(spec) {
  return fieldQuery(spec, is.searchable, { keysOnly: true });
}

export function getFilterableFields(spec) {
  return (spec.list?.filters || [])
    .map(filterKey => spec.fields[filterKey])
    .filter(Boolean);
}

export function getRefFields(spec) {
  return fieldQuery(spec, is.ref);
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

export function iterateCreateFields(spec, callback) {
  forEachField(spec, callback, is.editable);
}

export function iterateUpdateFields(spec, callback) {
  forEachField(spec, callback, is.editable);
}
