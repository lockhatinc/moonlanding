'use client';

import { useState, useCallback } from 'react';

export const useSearchState = () => {
  const [query, setQuery] = useState('');
  const handleQueryChange = useCallback((value) => setQuery(value), []);
  return { query, setQuery, handleQueryChange };
};
