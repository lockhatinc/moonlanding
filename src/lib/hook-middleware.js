import { executeHook } from './hook-registry';

/**
 * Wraps an operation with before/after hooks
 * @param {string} hookName - Base hook name (e.g., 'create:engagement')
 * @param {object} context - Hook context data
 * @param {function} operation - Async function to execute between hooks
 * @returns {Promise<any>} Result from operation
 */
export async function withHooks(hookName, context, operation) {
  const beforeCtx = await executeHook(`${hookName}:before`, context);
  const mergedContext = { ...context, ...beforeCtx };

  const result = await operation(mergedContext);

  await executeHook(`${hookName}:after`, { ...context, result });
  return result;
}

/**
 * Wraps validation with a hook
 * @param {string} hookName - Base hook name (e.g., 'validate:engagement')
 * @param {object} data - Data being validated
 * @param {object} initialErrors - Initial validation errors
 * @returns {Promise<object>} Final errors object
 */
export async function withValidationHooks(hookName, data, initialErrors = {}) {
  const beforeCtx = await executeHook(hookName, { data, errors: initialErrors });
  return beforeCtx?.errors || initialErrors;
}

/**
 * Chains multiple hooks in sequence
 * @param {array} hookNames - Array of hook names to execute
 * @param {object} initialContext - Initial context
 * @returns {Promise<object>} Final context
 */
export async function chainHooks(hookNames, initialContext) {
  let context = initialContext;
  for (const hookName of hookNames) {
    const result = await executeHook(hookName, context);
    context = { ...context, ...result };
  }
  return context;
}
