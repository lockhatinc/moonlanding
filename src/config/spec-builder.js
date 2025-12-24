import { ROLES } from './constants.js';
import { PERMISSION_DEFAULTS } from './permission-defaults.js';
import { validateSpec } from './validation-helpers.js';

export class SpecBuilder {
  constructor(name) {
    this.spec = {
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      labelPlural: name + 's',
      fields: {
        id: { type: 'id', label: 'ID' },
        created_at: { type: 'timestamp', auto: 'now', hidden: true, label: 'Created' },
        updated_at: { type: 'timestamp', auto: 'update', hidden: true, label: 'Updated' },
      },
      options: {},
      access: { ...PERMISSION_DEFAULTS },
    };
  }

  label(label, plural = null) {
    this.spec.label = label;
    this.spec.labelPlural = plural || label + 's';
    return this;
  }

  icon(icon) {
    this.spec.icon = icon;
    return this;
  }

  order(order) {
    this.spec.order = order;
    return this;
  }

  embedded() {
    this.spec.embedded = true;
    return this;
  }

  parent(parentName) {
    this.spec.parent = parentName;
    return this;
  }

  field(name, type, config = {}) {
    this.spec.fields[name] = {
      type,
      label: config.label || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      ...config,
    };
    return this;
  }

  fields(fieldsObj) {
    for (const [name, config] of Object.entries(fieldsObj)) {
      const type = config.type || 'text';
      const { type: _, ...rest } = config;
      this.field(name, type, rest);
    }
    return this;
  }

  status(values = {}) {
    const statusValues = {
      pending: 'Pending',
      active: 'Active',
      completed: 'Completed',
      archived: 'Archived',
      ...values,
    };
    this.spec.fields.status = {
      type: 'enum',
      options: 'status',
      required: true,
      list: true,
      default: 'pending',
    };
    this.options('status', statusValues);
    this.spec.softDelete = { archive: true };
    return this;
  }

  options(key, values) {
    if (typeof values === 'object' && !Array.isArray(values)) {
      const options = Object.entries(values).map(([value, label]) => ({
        value,
        label: typeof label === 'string' ? label : label.label,
        color: typeof label === 'object' ? label.color : 'gray',
      }));
      this.spec.options[key] = options;
    } else if (Array.isArray(values)) {
      this.spec.options[key] = values;
    }
    return this;
  }

  children(childConfig) {
    this.spec.children = childConfig;
    return this;
  }

  computedField(name, sql) {
    if (!this.spec.computed) this.spec.computed = {};
    this.spec.computed[name] = { sql };
    return this;
  }

  list(config = {}) {
    this.spec.list = {
      defaultSort: { field: 'created_at', dir: 'desc' },
      pageSize: PAGINATION.defaultPageSize,
      pageSizeOptions: PAGINATION.pageSizeOptions,
      searchFields: [],
      filters: [],
      ...config,
    };
    return this;
  }

  form(config = {}) {
    this.spec.form = config;
    return this;
  }

  access(actions) {
    for (const [action, roles] of Object.entries(actions)) {
      this.spec.access[action] = Array.isArray(roles) ? roles : [roles];
    }
    return this;
  }

  middleware(hooks) {
    if (!this.spec.middleware) this.spec.middleware = {};
    Object.assign(this.spec.middleware, hooks);
    return this;
  }

  hooks(hooks) {
    if (!this.spec.hooks) this.spec.hooks = {};
    Object.assign(this.spec.hooks, hooks);
    return this;
  }

  plugin(name, config) {
    if (!this.spec.plugins) this.spec.plugins = {};
    this.spec.plugins[name] = config;
    return this;
  }

  transitions(rules = {}) {
    this.spec.transitions = rules;
    return this;
  }

  fieldPermissions(permissions = {}) {
    this.spec.fieldPermissions = permissions;
    return this;
  }

  rowAccess(config = {}) {
    this.spec.rowAccess = config;
    return this;
  }

  validate(rules = {}) {
    this.spec.validations = rules;
    return this;
  }

  onLifecycle(events = {}) {
    this.spec.lifecycle = events;
    return this;
  }

  formSections(sections = {}) {
    this.spec.formSections = sections;
    return this;
  }

  components(components = {}) {
    this.spec.components = components;
    return this;
  }

  permissions(config = {}) {
    this.spec.permissions = config;
    return this;
  }

  stages(config = {}) {
    this.spec.stages = config;
    return this;
  }

  businessRules(rules = {}) {
    this.spec.businessRules = rules;
    return this;
  }

  stateMachine(config) {
    this.spec.stateMachine = config;

    this.spec.fields.state = {
      type: 'enum',
      options: 'state',
      required: true,
      list: true,
      default: Object.keys(config.states)[0],
      label: 'State',
    };

    const stateOptions = Object.entries(config.states).reduce((acc, [key, stateConfig]) => {
      acc[key] = {
        label: stateConfig.label,
        color: stateConfig.color || 'gray',
      };
      return acc;
    }, {});
    this.options('state', stateOptions);

    return this;
  }

  build() {
    validateSpec(this.spec);
    return this.spec;
  }
}

export function spec(name) {
  return new SpecBuilder(name);
}
