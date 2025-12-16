import { compileSchema, validateDataAgainstSchema, validateUpdateAgainstSchema, hasErrors } from '@/lib/schema';

export class ValidationError extends Error {
  constructor(errors, message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
    this.errors = errors;
  }
}

export async function createValidationMiddleware(spec, throwOnError = true) {
  return async function validateInputData(data) {
    const schema = await compileSchema(spec);
    const errors = await validateDataAgainstSchema(schema, data);

    if (hasErrors(errors) && throwOnError) {
      throw new ValidationError(errors);
    }

    return {
      isValid: !hasErrors(errors),
      errors,
    };
  };
}

export async function createUpdateValidationMiddleware(spec, id, throwOnError = true) {
  return async function validateUpdateData(data) {
    const schema = await compileSchema(spec);
    const errors = await validateUpdateAgainstSchema(schema, id, data);

    if (hasErrors(errors) && throwOnError) {
      throw new ValidationError(errors);
    }

    return {
      isValid: !hasErrors(errors),
      errors,
    };
  };
}

export async function validateInput(spec, data, throwOnError = true) {
  const middleware = await createValidationMiddleware(spec, throwOnError);
  return middleware(data);
}

export async function validateUpdate(spec, id, data, throwOnError = true) {
  const middleware = await createUpdateValidationMiddleware(spec, id, throwOnError);
  return middleware(data);
}
