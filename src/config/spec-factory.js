import { spec } from './spec-builder.js';

export function createSimpleEntity(name, fieldDefs, options = {}) {
  const {
    label = null,
    labelPlural = null,
    icon = null,
    order = null,
    parent = null,
    embedded = false,
    auditFields = false,
    timestamps = false,
    status = null,
    searchFields = [],
    defaultSort = { field: 'created_at', dir: 'desc' },
    access = null,
    customOptions = {},
  } = options;

  let builder = spec(name);

  if (label) builder = builder.label(label, labelPlural);
  if (icon) builder = builder.icon(icon);
  if (order) builder = builder.order(order);
  if (parent) builder = builder.parent(parent);
  if (embedded) builder = builder.embedded();

  if (auditFields) {
    builder = builder
      .field('created_at', 'int', { auto: 'now', hidden: true })
      .field('updated_at', 'int', { auto: 'update', hidden: true })
      .field('created_by', 'ref', { ref: 'user', display: 'user.name', auto: 'user', hidden: true });
  } else if (timestamps) {
    builder = builder
      .field('created_at', 'int', { auto: 'now', hidden: true })
      .field('updated_at', 'int', { auto: 'update', hidden: true });
  }

  builder = builder.fields(fieldDefs);

  if (status === 'standard') {
    builder = builder
      .field('status', 'enum', { options: 'status', required: true, list: true, default: 'pending' })
      .options('status', {
        pending: { label: 'Pending', color: 'yellow' },
        active: { label: 'Active', color: 'blue' },
        completed: { label: 'Completed', color: 'green' },
        archived: { label: 'Archived', color: 'gray' },
      });
  } else if (status && typeof status === 'object') {
    const { field = 'status', optionsKey = 'status', values, defaultValue = null } = status;
    builder = builder
      .field(field, 'enum', { options: optionsKey, required: true, list: true, default: defaultValue })
      .options(optionsKey, values);
  }

  for (const [key, values] of Object.entries(customOptions)) {
    builder = builder.options(key, values);
  }

  if (searchFields.length > 0 || defaultSort) {
    builder = builder.list({ searchFields, defaultSort });
  }

  if (access) {
    builder = builder.access(access);
  }

  return builder.build();
}
