export class ValidationBuilder {
  constructor(fieldName, fieldLabel = null) {
    this.fieldName = fieldName;
    this.fieldLabel = fieldLabel || fieldName;
    this.rules = [];
  }

  required(message = null) {
    this.rules.push({
      type: 'required',
      message: message || `${this.fieldLabel} is required`,
    });
    return this;
  }

  minLength(min, message = null) {
    this.rules.push({
      type: 'minLength',
      value: min,
      message: message || `${this.fieldLabel} must be at least ${min} characters`,
    });
    return this;
  }

  maxLength(max, message = null) {
    this.rules.push({
      type: 'maxLength',
      value: max,
      message: message || `${this.fieldLabel} must be no more than ${max} characters`,
    });
    return this;
  }

  minValue(min, message = null) {
    this.rules.push({
      type: 'min',
      value: min,
      message: message || `${this.fieldLabel} must be at least ${min}`,
    });
    return this;
  }

  maxValue(max, message = null) {
    this.rules.push({
      type: 'max',
      value: max,
      message: message || `${this.fieldLabel} must be no more than ${max}`,
    });
    return this;
  }

  email(message = null) {
    this.rules.push({
      type: 'email',
      message: message || `${this.fieldLabel} must be a valid email`,
    });
    return this;
  }

  pattern(regex, message = null) {
    this.rules.push({
      type: 'pattern',
      value: regex,
      message: message || `${this.fieldLabel} format is invalid`,
    });
    return this;
  }

  custom(validator, message = null) {
    this.rules.push({
      type: 'custom',
      validator,
      message: message || `${this.fieldLabel} validation failed`,
    });
    return this;
  }

  unique(message = null) {
    this.rules.push({
      type: 'unique',
      message: message || `${this.fieldLabel} must be unique`,
    });
    return this;
  }

  matches(otherField, message = null) {
    this.rules.push({
      type: 'matches',
      value: otherField,
      message: message || `${this.fieldLabel} must match ${otherField}`,
    });
    return this;
  }

  build() {
    return {
      fieldName: this.fieldName,
      fieldLabel: this.fieldLabel,
      rules: this.rules,
    };
  }
}

export function field(name, label) {
  return new ValidationBuilder(name, label);
}

export function schema(...fields) {
  return fields.reduce((acc, f) => {
    const built = f.build();
    acc[built.fieldName] = built.rules;
    return acc;
  }, {});
}

export class SchemaValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(data) {
    const errors = {};
    for (const [fieldName, rules] of Object.entries(this.schema)) {
      const value = data[fieldName];
      for (const rule of rules) {
        const error = this.validateRule(rule, value, fieldName, data);
        if (error) {
          if (!errors[fieldName]) errors[fieldName] = [];
          errors[fieldName].push(error);
        }
      }
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  validateRule(rule, value, fieldName, data) {
    switch (rule.type) {
      case 'required':
        if (!value && value !== 0 && value !== false) return rule.message;
        break;
      case 'minLength':
        if (value && String(value).length < rule.value) return rule.message;
        break;
      case 'maxLength':
        if (value && String(value).length > rule.value) return rule.message;
        break;
      case 'min':
        if (value != null && Number(value) < rule.value) return rule.message;
        break;
      case 'max':
        if (value != null && Number(value) > rule.value) return rule.message;
        break;
      case 'email':
        if (value && !String(value).match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return rule.message;
        break;
      case 'pattern':
        if (value && !rule.value.test(String(value))) return rule.message;
        break;
      case 'custom':
        if (!rule.validator(value, data)) return rule.message;
        break;
      case 'matches':
        if (value !== data[rule.value]) return rule.message;
        break;
    }
    return null;
  }
}

export function createSchemaValidator(schema) {
  return new SchemaValidator(schema);
}
