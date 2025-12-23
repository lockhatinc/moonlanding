'use client';

import { useState, useMemo } from 'react';

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
