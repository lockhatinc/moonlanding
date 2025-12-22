'use client';

import { useState, useCallback } from 'react';

export const useTextInput = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);

  const onChange = useCallback((e) => setValue(e.target.value), []);
  const clear = useCallback(() => setValue(''), []);
  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return {
    value,
    setValue,
    onChange,
    clear,
    reset,
    props: { value, onChange },
  };
};
