import { useState, useCallback } from 'react';

export function useModal(initialOpen = false, initialData = null) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState(initialData);

  const open = useCallback((newData = null) => {
    if (newData !== null && newData !== undefined) {
      setData(newData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    data,
    setData,
  };
}
