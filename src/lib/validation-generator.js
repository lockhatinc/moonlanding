import { validationRuleGenerators } from '@/config/validation-rules';

export function generateValidationRules(spec) {
  const rules = {};

  for (const [fieldName, field] of Object.entries(spec.fields)) {
    if (fieldName === 'id') continue;

    const fieldRules = [];

    if (field.required) {
      fieldRules.push(validationRuleGenerators.required(field, fieldName));
    }

    if (field.minLength !== undefined) {
      fieldRules.push(validationRuleGenerators.minLength(field));
    }

    if (field.maxLength !== undefined) {
      fieldRules.push(validationRuleGenerators.maxLength(field));
    }

    if (field.min !== undefined || field.max !== undefined) {
      const min = field.min;
      const max = field.max;
      if (min !== undefined && max !== undefined) {
        fieldRules.push(validationRuleGenerators.range(field));
      } else if (min !== undefined) {
        fieldRules.push(validationRuleGenerators.min(field));
      } else if (max !== undefined) {
        fieldRules.push(validationRuleGenerators.max(field));
      }
    }

    if (field.pattern !== undefined) {
      fieldRules.push(validationRuleGenerators.pattern(field));
    }

    if (field.type === 'email') {
      fieldRules.push(validationRuleGenerators.email());
    }

    if (fieldRules.length > 0) {
      rules[fieldName] = fieldRules;
    }
  }

  if (spec.validations) {
    for (const [fieldName, customRules] of Object.entries(spec.validations)) {
      if (rules[fieldName]) {
        const existingTypes = new Set(rules[fieldName].map(r => r.type));
        const newRules = customRules.filter(r => !existingTypes.has(r.type));
        rules[fieldName] = [...rules[fieldName], ...newRules];
      } else {
        rules[fieldName] = customRules;
      }
    }
  }

  return rules;
}

export function getValidationRules(spec) {
  if (!spec._cachedValidationRules) {
    spec._cachedValidationRules = generateValidationRules(spec);
  }
  return spec._cachedValidationRules;
}
