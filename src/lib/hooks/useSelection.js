import { useState, useCallback } from 'react';

export function useSelection(initialSelected = null, multiSelect = false) {
  const [selected, setSelected] = useState(initialSelected);

  const select = useCallback((item) => {
    if (multiSelect) {
      setSelected(prev => {
        if (!Array.isArray(prev)) return [item];
        return prev.includes(item) ? prev : [...prev, item];
      });
    } else {
      setSelected(item);
    }
  }, [multiSelect]);

  const toggle = useCallback((item) => {
    if (multiSelect) {
      setSelected(prev => {
        if (!Array.isArray(prev)) return [item];
        return prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item];
      });
    } else {
      setSelected(prev => prev === item ? null : item);
    }
  }, [multiSelect]);

  const clear = useCallback(() => {
    setSelected(multiSelect ? [] : null);
  }, [multiSelect]);

  const isSelected = useCallback((item) => {
    if (multiSelect) {
      return Array.isArray(selected) && selected.includes(item);
    }
    return selected === item;
  }, [selected, multiSelect]);

  return {
    selected,
    select,
    toggle,
    clear,
    isSelected,
  };
}
