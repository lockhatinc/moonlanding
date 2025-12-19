export function generateValidationRules(spec) {
  const rules = {};

  for (const [fieldName, field] of Object.entries(spec.fields)) {
    if (fieldName === 'id') continue;

    const fieldRules = [];

    if (field.required) {
      const label = field.label || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      fieldRules.push({
        type: 'required',
        message: `${label} is required`,
      });
    }

    if (field.minLength !== undefined) {
      fieldRules.push({
        type: 'minLength',
        value: field.minLength,
        message: `Must be at least ${field.minLength} characters`,
      });
    }

    if (field.maxLength !== undefined) {
      fieldRules.push({
        type: 'maxLength',
        value: field.maxLength,
        message: `Must not exceed ${field.maxLength} characters`,
      });
    }

    if (field.min !== undefined || field.max !== undefined) {
      const min = field.min;
      const max = field.max;
      if (min !== undefined && max !== undefined) {
        fieldRules.push({
          type: 'range',
          min,
          max,
          message: `Must be between ${min} and ${max}`,
        });
      } else if (min !== undefined) {
        fieldRules.push({
          type: 'min',
          value: min,
          message: `Must be at least ${min}`,
        });
      } else if (max !== undefined) {
        fieldRules.push({
          type: 'max',
          value: max,
          message: `Must be at most ${max}`,
        });
      }
    }

    if (field.pattern !== undefined) {
      fieldRules.push({
        type: 'pattern',
        value: field.pattern,
        message: field.patternMessage || 'Invalid format',
      });
    }

    if (field.type === 'email') {
      fieldRules.push({
        type: 'email',
        message: 'Invalid email address',
      });
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
