export function buildWhereClause(conditions, spec, includeDeleted = false) {
  const clauses = [];
  const params = {};
  let paramCount = 0;

  if (!includeDeleted && spec.softDelete) {
    clauses.push(`${spec.name}.status != 'deleted'`);
  }

  if (conditions) {
    for (const [field, value] of Object.entries(conditions)) {
      if (value === null || value === undefined) continue;

      const specField = spec.fields?.[field];
      if (!specField) continue;

      const paramName = `p${paramCount}`;
      paramCount++;

      if (Array.isArray(value)) {
        const placeholders = value.map((_, i) => `$p${paramCount + i}`).join(',');
        clauses.push(`${spec.name}.${field} IN (${placeholders})`);
        value.forEach((v, i) => {
          params[`p${paramCount + i}`] = v;
        });
        paramCount += value.length;
      } else if (typeof value === 'object' && value.op) {
        if (value.op === 'LIKE' || value.op === 'ILIKE') {
          clauses.push(`${spec.name}.${field} ${value.op} $${paramName}`);
          params[paramName] = `%${value.value}%`;
        } else {
          clauses.push(`${spec.name}.${field} ${value.op} $${paramName}`);
          params[paramName] = value.value;
        }
      } else {
        clauses.push(`${spec.name}.${field} = $${paramName}`);
        params[paramName] = value;
      }
    }
  }

  return {
    where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

export function addSearchCondition(query, searchQuery, searchFields, spec) {
  if (!searchQuery || !searchFields || searchFields.length === 0) {
    return query;
  }

  const conditions = searchFields.map(field => `${spec.name}.${field} LIKE $search`).join(' OR ');

  return {
    ...query,
    searchCondition: `(${conditions})`,
    searchQuery: `%${searchQuery}%`,
  };
}

export function addTimestampFilters(query, startDate, endDate, spec, field = 'created_at') {
  const conditions = {};

  if (startDate) {
    conditions[field] = { op: '>=', value: Math.floor(startDate.getTime() / 1000) };
  }

  if (endDate) {
    conditions[field] = { op: '<=', value: Math.floor(endDate.getTime() / 1000) };
  }

  return {
    ...query,
    timestampFilters: conditions,
  };
}

export function mergeWhereConditions(condition1, condition2) {
  if (!condition1) return condition2;
  if (!condition2) return condition1;

  return {
    where: `${condition1.where} AND ${condition2.where}`,
    params: { ...condition1.params, ...condition2.params },
  };
}
