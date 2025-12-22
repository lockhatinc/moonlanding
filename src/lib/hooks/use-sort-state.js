import { useState, useCallback } from 'react';

export const useSortState = (defaultField = 'created_at', defaultDir = 'ASC') => {
  const [field, setField] = useState(defaultField);
  const [dir, setDir] = useState(defaultDir);

  const handleSort = useCallback((newField) => {
    if (field === newField) {
      setDir(dir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setField(newField);
      setDir('ASC');
    }
  }, [field, dir]);

  return { field, dir, setField, setDir, handleSort };
};
