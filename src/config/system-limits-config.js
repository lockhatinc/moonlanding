export const DATABASE_LIMITS = {
  maxBatchSize: 1000,
  maxQueryResults: 10000,
  maxConnectionPoolSize: 10,
  transactionTimeoutMs: 30000,
  queryTimeoutMs: 5000,
  bulkInsertBatchSize: 100,
  maxTextFieldLength: 65536,
  maxJsonFieldSize: 1048576,
};

export const MEMORY_LIMITS = {
  maxCacheSize: 52428800,
  maxRequestBodySize: 52428800,
  maxFileUploadSize: 104857600,
  gcIntervalMs: 300000,
};

export const QUERY_LIMITS = {
  maxPageSize: 100,
  defaultPageSize: 20,
  minPageSize: 1,
  maxSearchResults: 1000,
  maxSortFields: 3,
  maxFilterConditions: 10,
};

export const VALIDATION_LIMITS = {
  maxFieldNameLength: 255,
  maxLabelLength: 255,
  maxErrorMessageLength: 500,
  maxValidationRules: 20,
  maxEnumValues: 500,
};

export const FILE_LIMITS = {
  maxFileNameLength: 255,
  maxFilesPerUpload: 10,
  maxImageDimensions: { width: 4096, height: 4096 },
  maxPdfPages: 500,
  maxThumbnailDimensions: { width: 200, height: 200 },
};

export const API_LIMITS = {
  maxRequestsPerSecond: 100,
  maxRequestsPerMinute: 6000,
  maxConcurrentRequests: 50,
  maxResponseSize: 52428800,
};

export const SEARCH_LIMITS = {
  maxQueryLength: 255,
  minQueryLength: 1,
  maxResults: 1000,
  highlightFragmentSize: 150,
  maxHighlights: 100,
};
