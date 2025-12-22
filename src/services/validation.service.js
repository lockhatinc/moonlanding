import { VALIDATION_RULES } from '@/config/validation-rules';
import { getValidationRules } from '@/lib/validation-generator';
import { executeHook } from '@/lib/hook-engine';
import { validators } from '@/lib/validator-helpers';

class ValidationService {
  async validateField(spec, fieldName, value) {
    const field = spec.fields[fieldName];
    if (!field) return null;

    const validator = VALIDATION_RULES[field.type];
    let error = validator ? validator(value, field, spec.options) : null;

    if (!error) {
      const validationRules = getValidationRules(spec);
      const rules = validationRules[fieldName];
      if (rules) {
        for (const rule of rules) {
          error = this.applyValidationRule(rule, value);
          if (error) break;
        }
      }
    }

    if (!error) {
      const hook = await executeHook(`validate:${spec.name}:${fieldName}`, { value, field, error });
      error = hook?.error || null;
    }

    return error;
  }

  applyValidationRule(rule, value) {
    switch (rule.type) {
      case 'required':
        return validators.required(value, rule.message);
      case 'minLength':
        return validators.minLength(value, rule.value, rule.message);
      case 'maxLength':
        return validators.maxLength(value, rule.value, rule.message);
      case 'min':
        return validators.min(value, rule.value, rule.message);
      case 'max':
        return validators.max(value, rule.value, rule.message);
      case 'range':
        return validators.range(value, rule.min, rule.max, rule.message);
      case 'pattern':
        return validators.pattern(value, rule.value, rule.message);
      case 'email':
        return validators.email(value, rule.message);
      case 'custom':
        return null;
      default:
        return null;
    }
  }

  async validateEntity(spec, data) {
    const errors = {};
    for (const [fieldName, field] of Object.entries(spec.fields)) {
      if (fieldName === 'id') continue;
      const error = await this.validateField(spec, fieldName, data[fieldName]);
      if (error) errors[fieldName] = error;
    }
    const hook = await executeHook(`validate:${spec.name}`, { data, errors });
    return hook?.errors || errors;
  }

  async validateUpdate(spec, id, data) {
    const errors = await this.validateEntity(spec, data);
    await executeHook(`validateUpdate:${spec.name}`, { id, data, errors });
    return errors;
  }

  hasErrors(errors) {
    return Object.keys(errors).length > 0;
  }
}

export const validationService = new ValidationService();
