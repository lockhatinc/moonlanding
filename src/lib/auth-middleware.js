import { getUser } from '@/engine.server';
import { getSpec } from '@/config';
import { can } from '@/lib/permissions';
import { UnauthorizedError, PermissionError } from '@/lib/error-handler';
import { redirect, notFound } from 'next/navigation';

const actionMap = { list: 'list', get: 'view', view: 'view', create: 'create', update: 'edit', edit: 'edit', delete: 'delete' };

export const requireAuth = async () => {
  const user = await getUser();
  if (!user) throw new UnauthorizedError('Authentication required');
  return user;
};

export const requirePermission = (user, spec, action) => {
  const mapped = actionMap[action] || action;
  if (!can(user, spec, mapped)) throw new PermissionError(`Cannot ${action} ${spec.name}`);
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
  if (!user) redirect('/login');
  let spec;
  try { spec = getSpec(entityName); } catch { notFound(); }
  if (options.notEmbedded !== false && spec.embedded) notFound();
  if (options.allowParent !== true && spec.parent && action !== 'view') notFound();
  if (!can(user, spec, actionMap[action] || action)) {
    redirect(options.redirectTo || (action === 'list' ? '/' : `/${entityName}`));
  }
  return { user, spec };
};
