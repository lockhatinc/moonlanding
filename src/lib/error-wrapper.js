// Error Handling Wrapper Factory - Consolidates repeated try-catch patterns
import { logger } from './logger';

/**
 * Wrap async function with standardized error handling
 * @param {Function} handler - async function to wrap
 * @param {Object} options - configuration
 * @param {string} options.context - Error context for logging (e.g., 'create', 'update')
 * @param {string} options.entity - Entity name for logging
 * @param {boolean} options.rethrow - Whether to rethrow error (default: true)
 * @param {Function} options.onError - Optional callback before throwing
 * @returns {Function} Wrapped async function
 */
export function withErrorHandling(handler, { context = 'operation', entity = null, rethrow = true, onError = null } = {}) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (e) {
      logger.apiError(context, entity, e);
      if (onError) onError(e);
      if (rethrow) throw e;
    }
  };
}

/**
 * Wrap sync function with standardized error handling
 * @param {Function} handler - sync function to wrap
 * @param {Object} options - configuration (same as withErrorHandling)
 * @returns {Function} Wrapped function
 */
export function withErrorHandlingSync(handler, { context = 'operation', entity = null, rethrow = true, onError = null } = {}) {
  return (...args) => {
    try {
      return handler(...args);
    } catch (e) {
      logger.apiError(context, entity, e);
      if (onError) onError(e);
      if (rethrow) throw e;
    }
  };
}

/**
 * Higher-order wrapper for database operations
 * @param {Function} dbOperation - function that performs db operation
 * @param {string} operation - operation type (get, list, create, update, delete)
 * @param {string} entity - entity name
 * @returns {Function} Wrapped db operation
 */
export function withDbErrorHandling(dbOperation, operation, entity) {
  return withErrorHandling(dbOperation, { context: operation, entity });
}
