'use client';

import { useState, useCallback, useMemo } from 'react';

export const useTableState = (spec, pageSize = 20) => {
  const [page, setPage] = useState(1);
  const [pageSize2, setPageSize2] = useState(pageSize);
  const [sortField, setSortField] = useState(spec.list?.defaultSort?.field || 'created_at');
  const [sortDir, setSortDir] = useState(spec.list?.defaultSort?.dir || 'ASC');
  const [filters, setFilters] = useState({});
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const pagination = useMemo(() => ({
    page, pageSize: pageSize2, total,
    totalPages: Math.ceil(total / pageSize2),
    hasMore: page < Math.ceil(total / pageSize2),
  }), [page, pageSize2, total]);

  return {
    data, setData, loading, setLoading, total, setTotal,
    page, setPage, pageSize: pageSize2, setPageSize: setPageSize2,
    sortField, sortDir, setSortField: (f) => { setSortField(f); setPage(1); },
    filters, setFilters: (f) => { setFilters(f); setPage(1); },
    query, setQuery: (q) => { setQuery(q); setPage(1); },
    pagination,
  };
};

export const useFormState = (spec, initialData = {}) => {
  const [values, setValues] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setError = useCallback((field, error) => {
    if (error) setErrors(prev => ({ ...prev, [field]: error }));
    else setErrors(prev => { const u = { ...prev }; delete u[field]; return u; });
  }, []);

  const touch = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  return {
    values, setValue, errors, setError, touched, touch, loading, setLoading,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError: (field) => touched[field] ? errors[field] : null,
    reset: () => { setValues(initialData); setErrors({}); setTouched({}); },
  };
};

export const useAsync = (fn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    try { const result = await fn(); setData(result); setError(null); return result; }
    catch (e) { setError(e); throw e; }
    finally { setLoading(false); }
  }, deps);

  return { data, loading, error, execute };
};

export const useSearch = () => {
  const [query, setQuery] = useState('');
  return { query, setQuery };
};

export const useSort = (defaultField = 'created_at') => {
  const [field, setField] = useState(defaultField);
  const [dir, setDir] = useState('ASC');

  return {
    field,
    dir,
    setSortField: (newField) => {
      setField(newField);
      setDir(dir === 'ASC' ? 'DESC' : 'ASC');
    },
  };
};

export const useSelection = (defaultValue = null, isMultiple = true) => {
  const [selected, setSelected] = useState(defaultValue);

  return {
    selected,
    setSelected,
    toggle: (id) => {
      if (isMultiple) {
        setSelected(prev => {
          const set = new Set(prev || []);
          if (set.has(id)) set.delete(id);
          else set.add(id);
          return Array.from(set);
        });
      } else {
        setSelected(prev => prev === id ? null : id);
      }
    },
    isSelected: (id) => isMultiple ? selected?.includes(id) : selected === id,
  };
};

export const usePageState = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const pagination = useMemo(() => ({
    totalPages: Math.ceil(total / pageSize),
    hasMore: page < Math.ceil(total / pageSize),
  }), [page, pageSize, total]);

  return { page, setPage, pageSize, setPageSize, total, setTotal, pagination };
};

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

export const useSearchState = () => {
  const [query, setQuery] = useState('');
  const handleQueryChange = useCallback((value) => setQuery(value), []);
  return { query, setQuery, handleQueryChange };
};

export const useLoadingState = () => {
  const [loading, setLoading] = useState(false);
  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  return { loading, setLoading, startLoading, stopLoading };
};

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
