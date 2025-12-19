'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  usePageState,
  useSortState,
  useSearchState,
  useLoadingState,
  useFilterState,
} from '@/lib/hooks';
import { buildUrl } from '@/lib/query-string-adapter';

const createUrlUpdater = (router) => (paramUpdates) => {
  const existingParams = new URLSearchParams(globalThis.location?.search || '');
  const params = {};
  for (const [key, value] of existingParams) {
    params[key] = value;
  }
  Object.assign(params, paramUpdates);
  router.push(buildUrl(globalThis.location?.pathname || '', params));
};

export const useBuilderState = (spec, mode = 'list') => {
  const router = useRouter();
  const pageState = usePageState(1);
  const sortState = useSortState(spec.list?.defaultSort?.field || 'created_at', 'asc');
  const searchState = useSearchState();
  const loadingState = useLoadingState();
  const filterState = useFilterState();
  const updateUrl = useMemo(() => createUrlUpdater(router), [router]);

  const pagination = useMemo(() => {
    const totalPages = Math.ceil((globalThis.__builderTotal || 0) / pageState.pageSize);
    return {
      page: pageState.page,
      pageSize: pageState.pageSize,
      total: globalThis.__builderTotal || 0,
      totalPages,
      hasMore: pageState.page < totalPages,
    };
  }, [pageState.page, pageState.pageSize]);

  const handlePageChange = useCallback((newPage) => {
    pageState.setPage(newPage);
    updateUrl({ page: String(newPage) });
  }, [pageState, updateUrl]);

  const handlePageSizeChange = useCallback((newPageSize) => {
    pageState.setPageSize(newPageSize);
    updateUrl({ pageSize: String(newPageSize), page: '1' });
  }, [pageState, updateUrl]);

  const handleSort = useCallback((colKey) => {
    sortState.handleSort(colKey);
  }, [sortState]);

  const handleQueryChange = useCallback((value) => {
    searchState.handleQueryChange(value);
    pageState.setPage(1);
  }, [searchState, pageState]);

  const handleFilterChange = useCallback((filterKey, filterValue) => {
    filterState.handleFilterChange(filterKey, filterValue);
    pageState.setPage(1);
  }, [filterState, pageState]);

  return {
    pagination: { ...pagination, page: pageState.page, pageSize: pageState.pageSize },
    sort: { field: sortState.field, dir: sortState.dir },
    search: { query: searchState.query },
    filters: filterState.filters,
    loading: loadingState.loading,
    setLoading: loadingState.setLoading,
    handlers: {
      pageChange: handlePageChange,
      pageSizeChange: handlePageSizeChange,
      sort: handleSort,
      queryChange: handleQueryChange,
      filterChange: handleFilterChange,
    },
  };
};

export const usePagination = (spec) => {
  const router = useRouter();
  const pageState = usePageState(1);
  const updateUrl = useMemo(() => createUrlUpdater(router), [router]);

  const handlePageChange = useCallback((newPage) => {
    pageState.setPage(newPage);
    updateUrl({ page: String(newPage) });
  }, [pageState, updateUrl]);

  const handlePageSizeChange = useCallback((newPageSize) => {
    pageState.setPageSize(newPageSize);
    updateUrl({ pageSize: String(newPageSize), page: '1' });
  }, [pageState, updateUrl]);

  return {
    page: pageState.page,
    pageSize: pageState.pageSize,
    total: pageState.total,
    totalPages: pageState.pagination.totalPages,
    hasMore: pageState.pagination.hasMore,
    setPage: pageState.setPage,
    setTotal: pageState.setTotal,
    handlers: {
      pageChange: handlePageChange,
      pageSizeChange: handlePageSizeChange,
    },
  };
};

export { useSortState as useSort } from '@/lib/hooks';
export { useSearchState as useSearch } from '@/lib/hooks';
export { useFilterState as useFilters } from '@/lib/hooks';
