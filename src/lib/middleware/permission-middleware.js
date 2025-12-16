import { getSpec } from '@/config';
import { canUserAccess } from '@/lib/permissions';

export class AuthorizationError extends Error {
  constructor(entity, action) {
    super(`You don't have permission to ${action} ${entity}`);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = 'FORBIDDEN';
    this.entity = entity;
    this.action = action;
  }
}

export function createPermissionChecker(spec) {
  return function checkPermission(user) {
    return function (action) {
      return canUserAccess(user, spec, action);
    };
  };
}

export function createEntityPermissionMiddleware(entityName, action) {
  return async function checkEntityPermission(user) {
    const spec = getSpec(entityName);
    if (!spec) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    const allowed = canUserAccess(user, spec, action);
    if (!allowed) {
      throw new AuthorizationError(entityName, action);
    }

    return spec;
  };
}

export function createFieldLevelAccessMiddleware(spec, user) {
  const fields = {};

  for (const [fieldName, field] of Object.entries(spec.fields)) {
    if (!field.access) {
      fields[fieldName] = field;
      continue;
    }

    const canAccessField = canUserAccess(user, { ...spec, fieldAccess: field.access }, 'view');
    if (canAccessField) {
      fields[fieldName] = field;
    }
  }

  return { ...spec, fields };
}
