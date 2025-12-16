import { useState, useCallback } from 'react';
import { validateFieldAgainstSchema } from './schema-compiler';

export function useFieldValidation(schema, fieldName) {
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);

  const validate = useCallback(
    async (value) => {
      if (!schema) return null;

      setValidating(true);
      try {
        const fieldError = await validateFieldAgainstSchema(schema, fieldName, value);
        setError(fieldError);
        return fieldError;
      } finally {
        setValidating(false);
      }
    },
    [schema, fieldName]
  );

  const clear = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    validate,
    clear,
    validating,
  };
}
