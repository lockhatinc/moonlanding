import { getValidator } from './validator-registry';
import { executeHook } from '../hook-registry';

const compiledSchemas = {};

export async function compileSchema(spec) {
  if (compiledSchemas[spec.name]) {
    return compiledSchemas[spec.name];
  }

  const fieldValidators = {};

  for (const [fieldName, field] of Object.entries(spec.fields)) {
    if (fieldName === 'id' || field.auto) continue;

    const validator = getValidator(field.type);
    fieldValidators[fieldName] = {
      field,
      validator: validator?.validate,
    };
  }

  const schema = {
    name: spec.name,
    fields: fieldValidators,
    options: spec.options || {},
    hooks: spec.hooks || {},
  };

  compiledSchemas[spec.name] = schema;
  return schema;
}

export function getCachedSchema(entityName) {
  return compiledSchemas[entityName];
}

export function clearSchemaCache(entityName) {
  if (entityName) {
    delete compiledSchemas[entityName];
  } else {
    Object.keys(compiledSchemas).forEach(key => delete compiledSchemas[key]);
  }
}

export async function validateFieldAgainstSchema(schema, fieldName, value) {
  const fieldValidator = schema.fields[fieldName];
  if (!fieldValidator) return null;

  const { field, validator } = fieldValidator;

  let error = null;
  if (validator) {
    error = validator(value, field, schema.options);
  }

  if (!error) {
    const hookResult = await executeHook(`validate:${schema.name}:${fieldName}`, {
      value,
      field,
      error,
    });
    error = hookResult?.error || null;
  }

  return error;
}

export async function validateDataAgainstSchema(schema, data) {
  const errors = {};

  for (const [fieldName, fieldValidator] of Object.entries(schema.fields)) {
    const value = data[fieldName];
    const error = await validateFieldAgainstSchema(schema, fieldName, value);
    if (error) {
      errors[fieldName] = error;
    }
  }

  const hookResult = await executeHook(`validate:${schema.name}`, {
    data,
    errors,
  });

  return hookResult?.errors || errors;
}

export async function validateUpdateAgainstSchema(schema, id, data) {
  let errors = await validateDataAgainstSchema(schema, data);

  const hookResult = await executeHook(`validateUpdate:${schema.name}`, {
    id,
    data,
    errors,
  });

  return hookResult?.errors || errors;
}

export function getSchemaField(schema, fieldName) {
  const fieldValidator = schema.fields[fieldName];
  return fieldValidator?.field;
}

export function getSchemaFieldNames(schema) {
  return Object.keys(schema.fields);
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
