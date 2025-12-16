
import { logger } from './logger';

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

export function withDbErrorHandling(dbOperation, operation, entity) {
  return withErrorHandling(dbOperation, { context: operation, entity });
}
