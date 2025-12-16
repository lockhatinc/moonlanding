export function validateSortField(field, spec) {
  if (!field) return false;
  if (field === 'id') return true;

  const specField = spec.fields?.[field];
  if (!specField) return false;

  if (specField.computed) return false;
  if (specField.auto) return false;

  return true;
}

export function normalizeSortDirection(direction) {
  const dir = String(direction).toUpperCase();
  return dir === 'DESC' ? 'DESC' : 'ASC';
}

export function addSortToQuery(query, field, direction = 'ASC', spec) {
  if (!validateSortField(field, spec)) {
    console.warn(`[QueryBuilder] Invalid sort field: ${field}`);
    return query;
  }

  const dir = normalizeSortDirection(direction);

  return {
    ...query,
    sort: `${field} ${dir}`,
    sortField: field,
    sortDir: dir,
  };
}

export function createDefaultSort(spec) {
  const defaultSort = spec.list?.defaultSort;
  if (!defaultSort) {
    return { field: 'created_at', dir: 'DESC' };
  }

  return {
    field: defaultSort.field || 'created_at',
    dir: defaultSort.dir ? normalizeSortDirection(defaultSort.dir) : 'DESC',
  };
}
