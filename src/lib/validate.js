import { getSpec } from '@/config/spec-helpers';
import { get } from '@/lib/query-engine';

function sanitizeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validates a single field value against its field definition
 * @param {Object} fieldDef - Field definition from spec.fields
 * @param {any} value - Value to validate
 * @param {Object} options - Additional options { fieldName, entityName, existingValue }
 * @returns {Promise<string|null>} Error message or null if valid
 */
export const validateField = async (fieldDef, value, options = {}) => {
  const { fieldName, entityName, existingValue } = options;

  // Skip validation for auto-generated fields
  if (fieldDef.auto || fieldDef.auto_generate || fieldDef.readOnly) {
    return null;
  }

  // Required field check
  if (fieldDef.required && (value === null || value === undefined || value === '')) {
    return `Field '${fieldName}' is required`;
  }

  // Allow null/empty for non-required fields
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Type validation
  if (fieldDef.type === 'string' || fieldDef.type === 'text') {
    if (typeof value !== 'string') {
      return `Field '${fieldName}' must be a string`;
    }
  } else if (fieldDef.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      return `Field '${fieldName}' must be a number`;
    }
    // Min validation
    if (fieldDef.min !== undefined && value < fieldDef.min) {
      return `Field '${fieldName}' must be at least ${fieldDef.min}`;
    }
    // Max validation
    if (fieldDef.max !== undefined && value > fieldDef.max) {
      return `Field '${fieldName}' must be at most ${fieldDef.max}`;
    }
  } else if (fieldDef.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return `Field '${fieldName}' must be a boolean`;
    }
  } else if (fieldDef.type === 'timestamp') {
    const num = Number(value);
    if (isNaN(num)) {
      return `Field '${fieldName}' must be a valid timestamp`;
    }
  } else if (fieldDef.type === 'json') {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
      } catch {
        return `Field '${fieldName}' must be valid JSON`;
      }
    } else if (typeof value !== 'object') {
      return `Field '${fieldName}' must be an object or JSON string`;
    }
  }

  // Enum validation
  if (fieldDef.type === 'enum' && fieldDef.options) {
    let allowedValues = [];

    if (Array.isArray(fieldDef.options)) {
      allowedValues = fieldDef.options.map(opt =>
        typeof opt === 'object' ? opt.value : opt
      );
    } else if (typeof fieldDef.options === 'string') {
      // Options can be a reference like "workflow.stages[].name"
      // The spec generator should have already resolved this
      // Try to get from the spec's options property
      try {
        const spec = getSpec(entityName);
        const optionsList = spec.options && spec.options[fieldDef.options];
        if (optionsList) {
          allowedValues = optionsList.map(opt =>
            typeof opt === 'object' ? opt.value : opt
          );
        }
      } catch {
        // If we can't resolve, skip enum validation
      }
    }

    if (allowedValues.length > 0 && !allowedValues.includes(value)) {
      return `Invalid value for '${fieldName}'. Expected one of: ${allowedValues.join(', ')}`;
    }
  }

  // Foreign key validation
  if (fieldDef.type === 'ref' && fieldDef.ref) {
    // Skip if value equals existing value (no change)
    if (existingValue !== undefined && value === existingValue) {
      return null;
    }

    try {
      const refEntity = fieldDef.ref;
      const refTableName = refEntity === 'user' ? 'users' : refEntity;
      const referenced = get(refTableName, value);

      if (!referenced) {
        const refLabel = fieldDef.ref.charAt(0).toUpperCase() + fieldDef.ref.slice(1);
        return `${refLabel} with id '${value}' not found`;
      }
    } catch (error) {
      // If lookup fails, allow it (may be a permission issue)
      return null;
    }
  }

  return null;
};

/**
 * Validates data for CREATE operations
 * @param {string} entityName - Entity name
 * @param {Object} data - Data to validate
 * @returns {Promise<Object>} Error map { fieldName: "error message" }
 */
export const validateEntity = async (entityName, data) => {
  const spec = getSpec(entityName);
  const errors = {};

  for (const [fieldName, fieldDef] of Object.entries(spec.fields)) {
    // Skip id fields on create (will be auto-generated)
    if (fieldDef.type === 'id') {
      continue;
    }

    const value = data[fieldName];
    const error = await validateField(fieldDef, value, {
      fieldName,
      entityName
    });

    if (error) {
      errors[fieldName] = error;
    }

    // Unique validation for creates only
    if (fieldDef.unique && value !== null && value !== undefined && value !== '') {
      try {
        const tableName = entityName === 'user' ? 'users' : entityName;
        const existing = get(tableName, undefined, { [fieldName]: value });
        if (existing) {
          errors[fieldName] = `Field '${fieldName}' must be unique`;
        }
      } catch {
        // Ignore lookup errors
      }
    }
  }

  return errors;
};

/**
 * Validates data for UPDATE operations
 * @param {string} entityName - Entity name
 * @param {string} id - Record ID being updated
 * @param {Object} data - Data to validate (partial update)
 * @returns {Promise<Object>} Error map { fieldName: "error message" }
 */
export const validateUpdate = async (entityName, id, data) => {
  const spec = getSpec(entityName);
  const errors = {};

  // Get existing record to compare
  let existing = null;
  try {
    existing = get(entityName, id);
  } catch {
    // If we can't fetch existing, proceed with validation anyway
  }

  for (const [fieldName, fieldDef] of Object.entries(spec.fields)) {
    // Skip if field not being updated
    if (!(fieldName in data)) {
      continue;
    }

    // Skip id fields
    if (fieldDef.type === 'id') {
      continue;
    }

    const value = data[fieldName];
    const existingValue = existing ? existing[fieldName] : undefined;

    const error = await validateField(fieldDef, value, {
      fieldName,
      entityName,
      existingValue
    });

    if (error) {
      errors[fieldName] = error;
    }

    // Unique validation for updates
    if (fieldDef.unique && value !== null && value !== undefined && value !== '') {
      // Skip if value hasn't changed
      if (value !== existingValue) {
        try {
          const tableName = entityName === 'user' ? 'users' : entityName;
          // Check if another record (not this one) has the same unique value
          const duplicates = get(tableName, undefined, { [fieldName]: value });
          if (duplicates && duplicates.id !== id) {
            errors[fieldName] = `Field '${fieldName}' must be unique`;
          }
        } catch {
          // Ignore lookup errors
        }
      }
    }
  }

  return errors;
};

export const hasErrors = (errors) => {
  return Object.keys(errors || {}).length > 0;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DISPOSABLE_DOMAINS = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email', 'yopmail.com'];

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return { valid: false, reason: 'Email is required' };
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, reason: 'Invalid email format' };
  const domain = trimmed.split('@')[1];
  if (!domain || domain.length < 3) return { valid: false, reason: 'Invalid email domain' };
  if (!domain.includes('.')) return { valid: false, reason: 'Invalid email domain' };
  if (DISPOSABLE_DOMAINS.includes(domain)) return { valid: false, reason: 'Disposable email addresses are not allowed' };
  return { valid: true, email: trimmed, domain };
}

/**
 * Sanitizes all string/text fields in data object
 * @param {Object} data - Data object to sanitize
 * @param {Object} spec - Entity spec
 * @returns {Object} Sanitized data
 */
export const sanitizeData = (data, spec) => {
  const sanitized = { ...data };

  for (const [fieldName, value] of Object.entries(sanitized)) {
    const fieldDef = spec.fields?.[fieldName];

    if (fieldDef && (fieldDef.type === 'string' || fieldDef.type === 'text') && typeof value === 'string') {
      sanitized[fieldName] = sanitizeHtml(value);
    }
  }

  return sanitized;
};
