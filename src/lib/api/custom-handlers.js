const customHandlers = {};

export function registerCustomHandler(entity, action, handler) {
  if (!customHandlers[entity]) {
    customHandlers[entity] = {};
  }
  customHandlers[entity][action] = handler;
}

export function registerEntityHandlers(entity, handlers) {
  for (const [action, handler] of Object.entries(handlers)) {
    registerCustomHandler(entity, action, handler);
  }
}

export function getCustomHandler(entity, action) {
  return customHandlers[entity]?.[action];
}

export function hasCustomHandler(entity, action) {
  return !!getCustomHandler(entity, action);
}

export async function executeCustomHandler(entity, action, data, user) {
  const handler = getCustomHandler(entity, action);
  if (!handler) {
    throw new Error(`No custom handler for ${entity}.${action}`);
  }

  return await handler(data, user);
}

export function getEntityActions(entity) {
  return Object.keys(customHandlers[entity] || {});
}

export function getAllCustomHandlers() {
  return { ...customHandlers };
}

export function clearHandlers(entity, action) {
  if (action) {
    delete customHandlers[entity]?.[action];
  } else if (entity) {
    delete customHandlers[entity];
  } else {
    Object.keys(customHandlers).forEach(key => delete customHandlers[key]);
  }
}

export function createBatchHandler(action, entityName) {
  return async (ids, data, user) => {
    const results = [];
    const errors = [];

    for (let i = 0; i < ids.length; i++) {
      try {
        const result = await executeCustomHandler(entityName, action, { id: ids[i], ...data }, user);
        results.push(result);
      } catch (error) {
        errors.push({ id: ids[i], error: error.message });
      }
    }

    return {
      successful: results,
      failed: errors,
      successCount: results.length,
      failureCount: errors.length,
    };
  };
}

export function createConditionalHandler(condition, handler) {
  return async (data, user) => {
    if (!condition(data, user)) {
      throw new Error('Condition not met for this operation');
    }

    return await handler(data, user);
  };
}

export function createValidatedHandler(validator, handler) {
  return async (data, user) => {
    const validationResult = await validator(data, user);
    if (!validationResult.valid) {
      const error = new Error(validationResult.message || 'Validation failed');
      error.code = 'VALIDATION_ERROR';
      error.errors = validationResult.errors;
      throw error;
    }

    return await handler(data, user);
  };
}

export function createTransactionalHandler(operations, onError) {
  return async (data, user) => {
    const { withTransaction } = await import('@/lib/database/transactions');

    return await withTransaction(async (tx) => {
      const results = [];

      for (const operation of operations) {
        const result = await operation(data, user, tx);
        results.push(result);
      }

      return results;
    }).catch(async (error) => {
      if (onError) {
        await onError(error, data, user);
      }
      throw error;
    });
  };
}

export function createPipelinedHandler(...handlers) {
  return async (data, user) => {
    let result = data;

    for (const handler of handlers) {
      result = await handler(result, user);
    }

    return result;
  };
}

export function createAuthenticatedHandler(handler, requiredRole) {
  return async (data, user) => {
    if (!user) {
      throw new Error('Authentication required');
    }

    if (requiredRole && user.role !== requiredRole) {
      throw new Error(`Required role: ${requiredRole}`);
    }

    return await handler(data, user);
  };
}
