'use client';

import { useState, useCallback } from 'react';

export function useAsyncState(initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setSuccess = useCallback((newData) => {
    setData(newData);
    setError(null);
    setLoading(false);
  }, []);

  const setFailed = useCallback((err) => {
    setError(err?.message || String(err));
    setLoading(false);
  }, []);

  const start = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  return { data, setData, loading, error, setSuccess, setFailed, start };
}

export function useSelectionState(initialSelected = null, multiSelect = false) {
  const [selected, setSelected] = useState(initialSelected);
  const [expanded, setExpanded] = useState(new Set());

  const select = useCallback((id) => {
    if (multiSelect) {
      setSelected(prev => {
        if (!Array.isArray(prev)) prev = [];
        return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      });
    } else {
      setSelected(id);
    }
  }, [multiSelect]);

  const toggle = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const isSelected = useCallback((id) => {
    return multiSelect ? selected?.includes(id) : selected === id;
  }, [selected, multiSelect]);

  const isExpanded = useCallback((id) => expanded.has(id), [expanded]);

  const clear = useCallback(() => {
    setSelected(multiSelect ? [] : null);
    setExpanded(new Set());
  }, [multiSelect]);

  return { selected, setSelected, expanded, toggle, select, isSelected, isExpanded, clear };
}

export function useModalState(initialOpen = false, initialData = null) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState(initialData);

  const open = useCallback((modalData = null) => {
    if (modalData) setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return { isOpen, open, close, toggle, data, setData };
}

export function useFormState(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setField = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return { values, setValues, setField, errors, setErrors, setError, touched, setFieldTouched, reset, isValid };
}

export function usePaginationState(initialPage = 1, pageSize = 20, total = 0) {
  const [page, setPage] = useState(initialPage);

  const next = useCallback(() => {
    setPage(prev => {
      const maxPage = Math.ceil(total / pageSize);
      return prev < maxPage ? prev + 1 : prev;
    });
  }, [total, pageSize]);

  const prev = useCallback(() => {
    setPage(prev => (prev > 1 ? prev - 1 : prev));
  }, []);

  const goTo = useCallback((newPage) => {
    const maxPage = Math.ceil(total / pageSize);
    if (newPage >= 1 && newPage <= maxPage) setPage(newPage);
  }, [total, pageSize]);

  return { page, setPage, next, prev, goTo, pageSize };
}

export function useSortState(initialField = null, initialDir = 'asc') {
  const [field, setField] = useState(initialField);
  const [dir, setDir] = useState(initialDir);

  const setSortField = useCallback((newField) => {
    if (field === newField) {
      setDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setField(newField);
      setDir('asc');
    }
  }, [field]);

  return { field, dir, setSortField, setField, setDir };
}

export function useFilterState(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);

  const setFilter = useCallback((name, value) => {
    setFilters(prev => {
      if (value === null || value === '') {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasFilters = Object.keys(filters).length > 0;

  return { filters, setFilters, setFilter, clearFilters, hasFilters };
}

export function useSearchState(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  const hasQuery = query.trim().length > 0;

  return { query, setQuery, clear, hasQuery };
}
