import { useState, useCallback } from 'react';

export function useFilter(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => {
      if (value === undefined || value === null || value === '') {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const addFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    setFilters({});
  }, []);

  const hasFilters = Object.keys(filters).length > 0;

  const hasFilter = useCallback((key) => {
    return key in filters;
  }, [filters]);

  const getFilter = useCallback((key) => {
    return filters[key];
  }, [filters]);

  return {
    filters,
    setFilter,
    addFilter,
    removeFilter,
    clear,
    hasFilters,
    hasFilter,
    getFilter,
  };
}
