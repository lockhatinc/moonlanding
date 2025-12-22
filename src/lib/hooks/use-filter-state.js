import { useState, useCallback } from 'react';

export const useFilterState = () => {
  const [filters, setFilters] = useState({});

  const handleFilterChange = useCallback((filterKey, filterValue) => {
    setFilters(prev => {
      const updated = { ...prev, [filterKey]: filterValue };
      if (!filterValue) delete updated[filterKey];
      return updated;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters({}), []);

  return { filters, setFilters, handleFilterChange, resetFilters };
};
