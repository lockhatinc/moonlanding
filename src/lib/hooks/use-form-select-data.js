'use client';

import { useMemo } from 'react';

export function useFormSelectData(formFields, spec, options = {}) {
  const enumSelectData = useMemo(() => {
    const data = {};
    for (const field of formFields) {
      if (field.type === 'enum' && field.options) {
        const enumOptions = spec.options?.[field.options] || [];
        if (enumOptions.length === 0 && field.key === 'stage') {
          console.warn(`[useFormSelectData] No options found for ${field.key}, field.options="${field.options}", available keys:`, Object.keys(spec.options || {}));
        }
        data[field.options] = enumOptions.map(o => ({ value: String(o.value), label: o.label }));
      }
    }
    return data;
  }, [spec, formFields]);

  const refSelectData = useMemo(() => {
    const data = {};
    for (const field of formFields) {
      if (field.type === 'ref') {
        const refOptions = options[field.key] || [];
        data[field.key] = refOptions.map(o => ({ value: o.value, label: o.label }));
      }
    }
    return data;
  }, [options, formFields]);

  return { enumSelectData, refSelectData };
}
