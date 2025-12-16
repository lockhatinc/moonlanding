import { useState, useCallback } from 'react';

export function useSort(initialField = null, initialDir = 'ASC') {
  const [field, setField] = useState(initialField);
  const [dir, setDir] = useState(initialDir?.toUpperCase() || 'ASC');

  const setSortField = useCallback((newField, newDir = 'ASC') => {
    setField(newField);
    setDir(newDir?.toUpperCase() || 'ASC');
  }, []);

  const toggleDirection = useCallback(() => {
    setDir(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
  }, []);

  const clear = useCallback(() => {
    setField(null);
    setDir('ASC');
  }, []);

  const isAsc = dir === 'ASC';
  const isDesc = dir === 'DESC';

  return {
    field,
    dir,
    setSortField,
    toggleDirection,
    clear,
    isAsc,
    isDesc,
  };
}
