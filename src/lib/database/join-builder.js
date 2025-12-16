import { getSpec } from '@/config';

export function buildRefJoins(spec, fieldsToInclude) {
  const joins = [];
  const addedJoins = new Set();

  for (const fieldName of fieldsToInclude) {
    const field = spec.fields?.[fieldName];
    if (!field || field.type !== 'ref') continue;

    const refEntity = field.ref;
    if (addedJoins.has(refEntity)) continue;

    const refSpec = getSpec(refEntity);
    if (!refSpec) continue;

    let joinCondition = `${spec.name}.${fieldName} = ${refEntity}.id`;

    if (field.display) {
      const displayField = refSpec.fields?.[field.display];
      if (displayField) {
        joins.push(
          `LEFT JOIN ${refEntity} ON ${joinCondition}`,
          `-- display as: ${refEntity}.${field.display}`
        );
      }
    } else {
      joins.push(`LEFT JOIN ${refEntity} ON ${joinCondition}`);
    }

    addedJoins.add(refEntity);
  }

  return joins;
}

export function buildComputedFieldJoins(spec, fieldsToInclude) {
  const joins = [];

  for (const fieldName of fieldsToInclude) {
    const field = spec.fields?.[fieldName];
    if (!field || !spec.computed?.[fieldName]) continue;

    const computed = spec.computed[fieldName];

    if (computed.join) {
      joins.push(computed.join);
    }
  }

  return joins;
}

export function buildChildJoins(spec, includeChildren = false) {
  if (!includeChildren || !spec.children) {
    return [];
  }

  const joins = [];

  for (const [childEntity, childConfig] of Object.entries(spec.children)) {
    const childSpec = getSpec(childEntity);
    if (!childSpec) continue;

    const foreignKey = childConfig.foreignKey || `${spec.name}_id`;
    joins.push(
      `LEFT JOIN ${childEntity} ON ${childEntity}.${foreignKey} = ${spec.name}.id`
    );
  }

  return joins;
}

export function addJoinsToQuery(query, joins) {
  if (!joins || joins.length === 0) {
    return query;
  }

  return {
    ...query,
    joins: query.joins ? [...query.joins, ...joins] : joins,
  };
}
