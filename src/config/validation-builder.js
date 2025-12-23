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

  phone(message = null) {
    this.rules.push({
      type: 'phone',
      message: message || `${this.fieldLabel} must be a valid phone number`,
    });
    return this;
  }

  url(message = null) {
    this.rules.push({
      type: 'url',
      message: message || `${this.fieldLabel} must be a valid URL`,
    });
    return this;
  }

  range(min, max, message = null) {
    this.rules.push({
      type: 'range',
      min,
      max,
      message: message || `${this.fieldLabel} must be between ${min} and ${max}`,
    });
    return this;
  }

  arrayLength(min, max = null, message = null) {
    this.rules.push({
      type: 'arrayLength',
      min,
      max,
      message: message || `${this.fieldLabel} must have between ${min} and ${max || 'any'} items`,
    });
    return this;
  }

  oneof(values, message = null) {
    this.rules.push({
      type: 'oneof',
      values,
      message: message || `${this.fieldLabel} must be one of: ${values.join(', ')}`,
    });
    return this;
  }

  conditional(predicate, message = null) {
    this.rules.push({
      type: 'conditional',
      predicate,
      message: message || `${this.fieldLabel} validation failed`,
    });
    return this;
  }

  async(validator, message = null) {
    this.rules.push({
      type: 'async',
      validator,
      message: message || `${this.fieldLabel} validation failed`,
    });
    return this;
  }

  transform(fn) {
    this.rules.push({
      type: 'transform',
      fn,
    });
    return this;
  }

  when(condition, validations) {
    this.rules.push({
      type: 'when',
      condition,
      validations,
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
