import { useState, useCallback } from 'react';
import { validateDataAgainstSchema, validateUpdateAgainstSchema, hasErrors } from './schema-compiler';

export function useFormValidation(schema) {
  const [errors, setErrors] = useState({});
  const [validating, setValidating] = useState(false);

  const validateField = useCallback(
    async (fieldName, value) => {
      if (!schema) return null;

      const fieldValidator = schema.fields[fieldName];
      if (!fieldValidator) return null;

      const { field, validator } = fieldValidator;

      let error = null;
      if (validator) {
        error = validator(value, field, schema.options);
      }

      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }));
      } else {
        setErrors(prev => {
          const updated = { ...prev };
          delete updated[fieldName];
          return updated;
        });
      }

      return error;
    },
    [schema]
  );

  const validateAll = useCallback(
    async (data) => {
      if (!schema) return {};

      setValidating(true);
      try {
        const newErrors = await validateDataAgainstSchema(schema, data);
        setErrors(newErrors);
        return newErrors;
      } finally {
        setValidating(false);
      }
    },
    [schema]
  );

  const validateUpdate = useCallback(
    async (id, data) => {
      if (!schema) return {};

      setValidating(true);
      try {
        const newErrors = await validateUpdateAgainstSchema(schema, id, data);
        setErrors(newErrors);
        return newErrors;
      } finally {
        setValidating(false);
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }, []);

  const setFieldError = useCallback((fieldName, error) => {
    if (error) {
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      clearFieldError(fieldName);
    }
  }, [clearFieldError]);

  return {
    errors,
    validating,
    validateField,
    validateAll,
    validateUpdate,
    clearErrors,
    clearFieldError,
    setFieldError,
    isValid: !hasErrors(errors),
    hasError: (fieldName) => fieldName in errors,
    getError: (fieldName) => errors[fieldName] || null,
  };
}
