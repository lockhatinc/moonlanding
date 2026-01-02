import { getUser } from '@/engine.server';
import { getSpec } from '@/config/spec-helpers';
import { can } from '@/lib/permissions';
import { UnauthorizedError, PermissionError, NotFoundError } from '@/lib/error-handler';

const actionMap = { list: 'list', get: 'view', view: 'view', create: 'create', update: 'edit', edit: 'edit', delete: 'delete' };

export const requireAuth = async () => {
  const user = await getUser();
  if (!user) throw UnauthorizedError('Authentication required');
  return user;
};

export const requirePermission = (user, spec, action) => {
  const mapped = actionMap[action] || action;
  if (!can(user, spec, mapped)) throw PermissionError(`Cannot ${action} ${spec.name}`);
};

export const withAuth = (handler, action = 'view') => async (request, context) => {
  const user = await requireAuth();
  const entity = context.params?.entity || context.entity;
  const spec = entity ? getSpec(entity) : null;
  if (spec) requirePermission(user, spec, action);
  return handler(request, { ...context, user, spec });
};

export const withPageAuth = async (entityName, action = 'view', options = {}) => {
  const user = await getUser();
  if (!user) throw UnauthorizedError('Not authenticated');
  let spec;
  try { spec = getSpec(entityName); } catch { throw NotFoundError(`Entity ${entityName} not found`); }
  if (options.notEmbedded !== false && spec.embedded) throw NotFoundError('Entity is embedded');
  if (!can(user, spec, actionMap[action] || action)) {
    throw PermissionError(`Cannot ${action} ${entityName}`);
  }
  return { user, spec };
};
