import { useState, useCallback } from 'react';

export function useSearch(initialQuery = '', minChars = 0) {
  const [query, setQuery] = useState(initialQuery);

  const updateQuery = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  const hasQuery = query.length > 0;
  const isValid = query.length >= minChars;

  return {
    query,
    setQuery: updateQuery,
    clear,
    hasQuery,
    isValid,
  };
}
