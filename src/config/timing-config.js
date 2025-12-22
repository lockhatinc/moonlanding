export const POLLING_CONFIG = {
  defaultIntervalMs: 3000,
  engagementPollMs: 5000,
  reviewPollMs: 3000,
  highlightPollMs: 2000,
  statusPollMs: 5000,
  minIntervalMs: 1000,
  maxIntervalMs: 60000,
  backoffMultiplier: 1.5,
};

export const RETRY_TIMING = {
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  maxRetries: 3,
  retryJitterMs: 500,
};

export const NOTIFICATION_TIMING = {
  defaultAutoCloseMs: 4000,
  successAutoCloseMs: 3000,
  warningAutoCloseMs: 5000,
  errorAutoCloseMs: 6000,
  infoAutoCloseMs: 4000,
  toastStackLimit: 5,
  animationDurationMs: 300,
};

export const CACHE_TTL = {
  defaultMs: 300000,
  shortMs: 60000,
  mediumMs: 300000,
  longMs: 3600000,
  specMs: 600000,
  entityMs: 300000,
  userMs: 600000,
  permissionMs: 300000,
};

export const DEBOUNCE_TIMING = {
  searchMs: 300,
  inputMs: 500,
  resizeMs: 250,
  scrollMs: 100,
  focusMs: 150,
};

export const THROTTLE_TIMING = {
  windowResizeMs: 250,
  scrollMs: 100,
  mouseMove: 50,
};

export const SESSION_TIMING = {
  sessionTimeoutMs: 3600000,
  warningBeforeTimeoutMs: 300000,
  refreshIntervalMs: 600000,
  tokenRefreshMs: 1800000,
};

export const ANIMATION_TIMING = {
  pageTransitionMs: 300,
  modalOpenMs: 200,
  tooltipDelayMs: 500,
  menuAnimationMs: 150,
};

export const API_TIMING = {
  requestTimeoutMs: 30000,
  uploadTimeoutMs: 120000,
  downloadTimeoutMs: 60000,
  healthCheckIntervalMs: 60000,
};

export const MAINTENANCE_TIMING = {
  dbCleanupIntervalMs: 86400000,
  logRotationIntervalMs: 604800000,
  cacheEvictionIntervalMs: 300000,
  tempFileCleanupMs: 3600000,
};
