const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function validatePageSize(pageSize) {
  const size = Math.min(Math.max(pageSize || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  return size;
}

export function calculateOffset(page, pageSize) {
  if (page < 1) page = 1;
  return (page - 1) * pageSize;
}

export function addPaginationToQuery(query, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const validatedPageSize = validatePageSize(pageSize);
  const offset = calculateOffset(page, validatedPageSize);

  return {
    ...query,
    limit: validatedPageSize,
    offset,
    page,
    pageSize: validatedPageSize,
  };
}

export function createPaginationMetadata(total, page, pageSize) {
  const validatedPageSize = validatePageSize(pageSize);
  const totalPages = Math.ceil(total / validatedPageSize);

  return {
    page,
    pageSize: validatedPageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
