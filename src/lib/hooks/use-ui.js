import { useState, useCallback, useEffect } from 'react';

export function useUI(feature = 'default') {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState({});

  const open = useCallback((initialState = {}) => {
    setIsOpen(true);
    setState(initialState);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setState({});
  }, []);

  const toggle = useCallback((initialState = {}) => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setState(initialState);
    }
  }, [isOpen]);

  const reset = useCallback(() => {
    setIsOpen(false);
    setState({});
  }, []);

  const setState_ = useCallback((newState) => {
    setState(prev => typeof newState === 'function' ? newState(prev) : { ...prev, ...newState });
  }, []);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    isOpen,
    state,
    open,
    close,
    toggle,
    reset,
    setState: setState_,
  };
}
