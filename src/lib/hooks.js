'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLoadingError } from '@/lib/hooks/use-loading-error';

export const useFormState = (spec, initialData = {}) => {
  const [values, setValues] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { loading, setLoading } = useLoadingError(false);

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setError = useCallback((field, error) => {
    if (error) setErrors(prev => ({ ...prev, [field]: error }));
    else setErrors(prev => { const u = { ...prev }; delete u[field]; return u; });
  }, []);

  const touch = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  return {
    values, setValue, errors, setError, touched, touch, loading, setLoading,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError: (field) => touched[field] ? errors[field] : null,
    reset: () => { setValues(initialData); setErrors({}); setTouched({}); },
  };
};

export const useSelection = (defaultValue = null, isMultiple = true) => {
  const [selected, setSelected] = useState(defaultValue);

  return {
    selected,
    setSelected,
    toggle: (id) => {
      if (isMultiple) {
        setSelected(prev => {
          const set = new Set(prev || []);
          if (set.has(id)) set.delete(id);
          else set.add(id);
          return Array.from(set);
        });
      } else {
        setSelected(prev => prev === id ? null : id);
      }
    },
    isSelected: (id) => isMultiple ? selected?.includes(id) : selected === id,
  };
};

export const useLoadingState = () => {
  const { loading, setLoading, startLoading, stopLoading } = useLoadingError(false);
  return { loading, setLoading, startLoading, stopLoading };
};
