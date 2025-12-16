import { VALIDATION } from '@/config/constants';

const validators = {
  email: {
    validate: (value) => {
      if (!value) return null;
      if (!VALIDATION.EMAIL_REGEX.test(value)) return 'Invalid email format';
      return null;
    },
  },

  text: {
    validate: (value, field) => {
      if (field.required && !value) return `${field.label} is required`;
      if (field.minLength && value?.length < field.minLength) {
        return `Minimum ${field.minLength} characters`;
      }
      if (field.maxLength && value?.length > field.maxLength) {
        return `Maximum ${field.maxLength} characters`;
      }
      return null;
    },
  },

  int: {
    validate: (value, field) => {
      if (field.required && (value === undefined || value === null || value === '')) {
        return `${field.label} is required`;
      }
      if (value !== undefined && value !== null && value !== '' && (isNaN(value) || !Number.isInteger(Number(value)))) {
        return 'Must be a whole number';
      }
      if (field.min !== undefined && Number(value) < field.min) {
        return `Minimum ${field.min}`;
      }
      if (field.max !== undefined && Number(value) > field.max) {
        return `Maximum ${field.max}`;
      }
      return null;
    },
  },

  decimal: {
    validate: (value, field) => {
      if (field.required && (value === undefined || value === null || value === '')) {
        return `${field.label} is required`;
      }
      if (value !== undefined && value !== null && value !== '' && isNaN(value)) {
        return 'Must be a valid number';
      }
      if (field.min !== undefined && Number(value) < field.min) {
        return `Minimum ${field.min}`;
      }
      if (field.max !== undefined && Number(value) > field.max) {
        return `Maximum ${field.max}`;
      }
      return null;
    },
  },

  date: {
    validate: (value, field) => {
      if (field.required && !value) return `${field.label} is required`;
      if (value && isNaN(new Date(value).getTime())) return 'Invalid date';
      return null;
    },
  },

  timestamp: {
    validate: (value, field) => {
      if (field.required && !value) return `${field.label} is required`;
      if (value && isNaN(new Date(value).getTime())) return 'Invalid date/time';
      return null;
    },
  },

  bool: {
    validate: (value, field) => {
      if (field.required && value === undefined) return `${field.label} is required`;
      return null;
    },
  },

  enum: {
    validate: (value, field, optionsMap) => {
      if (field.required && !value) return `${field.label} is required`;
      if (value && field.options && optionsMap) {
        const options = optionsMap[field.options] || [];
        if (!options.find(o => String(o.value) === String(value))) {
          return `Invalid ${field.label}`;
        }
      }
      return null;
    },
  },

  ref: {
    validate: (value, field) => {
      if (field.required && !value) return `${field.label} is required`;
      return null;
    },
  },

  json: {
    validate: (value, field) => {
      if (field.required && !value) return `${field.label} is required`;
      if (value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch {
          return 'Invalid JSON format';
        }
      }
      return null;
    },
  },

  textarea: {
    validate: (value, field) => {
      if (field.required && !value) return `${field.label} is required`;
      if (field.minLength && value?.length < field.minLength) {
        return `Minimum ${field.minLength} characters`;
      }
      if (field.maxLength && value?.length > field.maxLength) {
        return `Maximum ${field.maxLength} characters`;
      }
      return null;
    },
  },

  image: {
    validate: (value, field) => {
      if (field.required && !value) return `${field.label} is required`;
      return null;
    },
  },

  id: {
    validate: () => null,
  },
};

export function registerValidator(type, validator) {
  validators[type] = validator;
}

export function getValidator(type) {
  return validators[type];
}

export function getAllValidators() {
  return { ...validators };
}
