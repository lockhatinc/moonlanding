import { executeHook } from './hook-registry';

export async function withHooks(hookName, context, operation) {
  const beforeCtx = await executeHook(`${hookName}:before`, context);
  const mergedContext = { ...context, ...beforeCtx };

  const result = await operation(mergedContext);

  await executeHook(`${hookName}:after`, { ...context, result });
  return result;
}

export async function withValidationHooks(hookName, data, initialErrors = {}) {
  const beforeCtx = await executeHook(hookName, { data, errors: initialErrors });
  return beforeCtx?.errors || initialErrors;
}

export async function chainHooks(hookNames, initialContext) {
  let context = initialContext;
  for (const hookName of hookNames) {
    const result = await executeHook(hookName, context);
    context = { ...context, ...result };
  }
  return context;
}
