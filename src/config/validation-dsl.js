export { ValidationBuilder, field, schema } from './validation-builder';

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
      case 'range':
        if (value != null && (Number(value) < rule.min || Number(value) > rule.max)) return rule.message;
        break;
      case 'email':
        if (value && !String(value).match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return rule.message;
        break;
      case 'phone':
        if (value && !String(value).match(/^[\d\s\-\+\(\)]+$/)) return rule.message;
        break;
      case 'url':
        if (value) {
          try {
            new URL(value);
          } catch {
            return rule.message;
          }
        }
        break;
      case 'pattern':
        if (value && !rule.value.test(String(value))) return rule.message;
        break;
      case 'oneof':
        if (value && !rule.values.includes(value)) return rule.message;
        break;
      case 'arrayLength':
        if (Array.isArray(value)) {
          if (value.length < rule.min) return rule.message;
          if (rule.max && value.length > rule.max) return rule.message;
        }
        break;
      case 'conditional':
        if (!rule.predicate(value, data)) return rule.message;
        break;
      case 'custom':
        if (!rule.validator(value, data)) return rule.message;
        break;
      case 'matches':
        if (value !== data[rule.value]) return rule.message;
        break;
      case 'when':
        if (rule.condition(data)) {
          for (const validation of rule.validations) {
            const error = this.validateRule(validation, value, fieldName, data);
            if (error) return error;
          }
        }
        break;
      case 'transform':
      case 'async':
        break;
    }
    return null;
  }
}

export function createSchemaValidator(schema) {
  return new SchemaValidator(schema);
}
