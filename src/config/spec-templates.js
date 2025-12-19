export const withAuditFields = (builder) => {
  return builder
    .field('created_at', 'int', { auto: 'now', hidden: true })
    .field('updated_at', 'int', { auto: 'update', hidden: true })
    .field('created_by', 'ref', { ref: 'user', display: 'user.name', auto: 'user', hidden: true });
};

export const withTimestamps = (builder) => {
  return builder
    .field('created_at', 'int', { auto: 'now', hidden: true })
    .field('updated_at', 'int', { auto: 'update', hidden: true });
};

export const withStandardChildren = (builder, config) => {
  return builder.children(config);
};

export const withComputedCreator = (builder, entityName = null) => {
  const entity = entityName || builder.spec.name;
  return builder.computedField(
    'created_by_display',
    `(SELECT name FROM user WHERE user.id = ${entity}.created_by LIMIT 1)`
  );
};

export const withComputedAssignee = (builder, entityName = null) => {
  const entity = entityName || builder.spec.name;
  return builder.computedField(
    'assigned_to_display',
    `(SELECT name FROM user WHERE user.id = ${entity}.assigned_to LIMIT 1)`
  );
};

export const withComputedResolver = (builder, entityName = null) => {
  const entity = entityName || builder.spec.name;
  return builder.computedField(
    'resolved_by_display',
    `(SELECT name FROM user WHERE user.id = ${entity}.resolved_by LIMIT 1)`
  );
};

export const withComputedReviewer = (builder, entityName = null) => {
  const entity = entityName || builder.spec.name;
  return builder.computedField(
    'reviewer_display',
    `(SELECT name FROM user WHERE user.id = ${entity}.reviewer_id LIMIT 1)`
  );
};

export const withStandardList = (builder, config = {}) => {
  return builder.list({
    defaultSort: { field: 'created_at', dir: 'desc' },
    searchFields: config.searchFields || [],
    ...config,
  });
};

export const withStatusTransitions = (builder, transitions) => {
  return builder.transitions(transitions);
};

export const withRequiredValidation = (builder, fields) => {
  const rules = {};
  for (const field of fields) {
    rules[field] = [
      { type: 'required', message: `${field.replace(/_/g, ' ')} is required` },
    ];
  }
  return builder.validate(rules);
};
