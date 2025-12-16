import { useState, useCallback, useMemo } from 'react';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function usePagination(totalItems = 0, pageSize = DEFAULT_PAGE_SIZE, initialPage = 1) {
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [currentPageSize, setCurrentPageSize] = useState(Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE));

  const pagination = useMemo(() => {
    const totalPages = Math.ceil(totalItems / currentPageSize);
    const safePage = Math.min(Math.max(page, 1), Math.max(totalPages, 1));

    return {
      page: safePage,
      pageSize: currentPageSize,
      total: totalItems,
      totalPages,
      hasMore: safePage < totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
      offset: (safePage - 1) * currentPageSize,
    };
  }, [page, currentPageSize, totalItems]);

  const next = useCallback(() => {
    setPage(prev => {
      const totalPages = Math.ceil(totalItems / currentPageSize);
      return Math.min(prev + 1, totalPages);
    });
  }, [totalItems, currentPageSize]);

  const prev = useCallback(() => {
    setPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goTo = useCallback((pageNum) => {
    const totalPages = Math.ceil(totalItems / currentPageSize);
    setPage(Math.min(Math.max(pageNum, 1), Math.max(totalPages, 1)));
  }, [totalItems, currentPageSize]);

  const setTotal = useCallback((total) => {
    setPage(1);
  }, []);

  const changePageSize = useCallback((newSize) => {
    const validSize = Math.min(Math.max(newSize, 1), MAX_PAGE_SIZE);
    setCurrentPageSize(validSize);
    setPage(1);
  }, []);

  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    totalPages: pagination.totalPages,
    hasMore: pagination.hasMore,
    hasNext: pagination.hasNext,
    hasPrev: pagination.hasPrev,
    offset: pagination.offset,
    next,
    prev,
    goTo,
    setTotal,
    changePageSize,
  };
}
