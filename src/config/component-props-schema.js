export const COMPONENT_PROPS_SCHEMAS = {
  FormBuilder: {
    entity: { type: 'string', required: true, description: 'Entity type' },
    data: { type: 'object', required: false, description: 'Form data' },
    spec: { type: 'object', required: true, description: 'Entity spec' },
    onSubmit: { type: 'function', required: true, description: 'Submit handler' },
    loading: { type: 'boolean', required: false, default: false },
    errors: { type: 'object', required: false, default: {} },
  },
  ListBuilder: {
    entity: { type: 'string', required: true, description: 'Entity type' },
    spec: { type: 'object', required: true, description: 'Entity spec' },
    items: { type: 'array', required: true, description: 'List items' },
    onRowClick: { type: 'function', required: true, description: 'Row click handler' },
    loading: { type: 'boolean', required: false, default: false },
    groupBy: { type: 'string', required: false, description: 'Group column' },
    searchable: { type: 'boolean', required: false, default: true },
    sortable: { type: 'boolean', required: false, default: true },
    paginated: { type: 'boolean', required: false, default: true },
  },
  EntityDetail: {
    entity: { type: 'string', required: true, description: 'Entity type' },
    id: { type: 'string', required: true, description: 'Entity ID' },
    spec: { type: 'object', required: true, description: 'Entity spec' },
    data: { type: 'object', required: false, description: 'Entity data' },
    onEdit: { type: 'function', required: true, description: 'Edit handler' },
    onDelete: { type: 'function', required: true, description: 'Delete handler' },
    readonly: { type: 'boolean', required: false, default: false },
  },
  PDFViewer: {
    file: { type: 'object', required: true, description: 'PDF file object' },
    onHighlight: { type: 'function', required: false, description: 'Highlight handler' },
    scale: { type: 'number', required: false, default: 1 },
    controls: { type: 'boolean', required: false, default: true },
  },
  ChatPanel: {
    entityType: { type: 'string', required: true, description: 'Entity type' },
    entityId: { type: 'string', required: true, description: 'Entity ID' },
    messages: { type: 'array', required: false, default: [] },
    onSend: { type: 'function', required: true, description: 'Send message handler' },
    loading: { type: 'boolean', required: false, default: false },
  },
};

export const PROP_TYPES = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  array: 'array',
  object: 'object',
  function: 'function',
  node: 'node',
  element: 'element',
};

export function getComponentSchema(componentName) {
  return COMPONENT_PROPS_SCHEMAS[componentName] || null;
}

export function validateProps(componentName, props) {
  const schema = getComponentSchema(componentName);
  if (!schema) return { valid: true, errors: [] };

  const errors = [];

  Object.entries(schema).forEach(([propName, propSchema]) => {
    const value = props[propName];
    const { type, required, default: defaultValue } = propSchema;

    if (required && (value === undefined || value === null)) {
      errors.push(`Required prop missing: ${propName}`);
      return;
    }

    if (value !== undefined && value !== null && typeof value !== type) {
      errors.push(`Invalid type for ${propName}: expected ${type}, got ${typeof value}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getDefaultProps(componentName) {
  const schema = getComponentSchema(componentName);
  if (!schema) return {};

  const defaults = {};
  Object.entries(schema).forEach(([propName, propSchema]) => {
    if ('default' in propSchema) {
      defaults[propName] = propSchema.default;
    }
  });

  return defaults;
}

export class PropValidator {
  constructor() {
    this.schemas = COMPONENT_PROPS_SCHEMAS;
    this.errors = [];
  }

  register(componentName, schema) {
    this.schemas[componentName] = schema;
  }

  validate(componentName, props) {
    return validateProps(componentName, props);
  }

  getSchema(componentName) {
    return getComponentSchema(componentName);
  }

  getAllSchemas() {
    return Object.entries(this.schemas).map(([name, schema]) => ({ name, ...schema }));
  }
}

export const propValidator = new PropValidator();
