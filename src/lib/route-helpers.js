
import { getSpec, getNavItems } from '@/config';
import { get, getChildren } from '@/engine';
import { getUser } from '@/engine.server';
import { can } from '@/lib/permissions';
import { redirect, notFound } from 'next/navigation';
import { loadOptions } from './form-utils';

export async function requireEntityAccess(entityName, action = 'view', options = {}) {
  const user = await getUser();
  if (!user) redirect('/login');

  let spec;
  try { spec = getSpec(entityName); } catch { notFound(); }

  if (options.notEmbedded !== false && spec.embedded) notFound();
  if (options.allowParent !== true && spec.parent && action !== 'view') notFound();

  if (!can(user, spec, action)) {
    redirect(options.redirectTo || (action === 'list' ? '/' : `/${entityName}`));
  }

  return { user, spec };
}

export async function getEntityData(entityName, id, options = {}) {
  const { user, spec } = await requireEntityAccess(entityName, 'view', options);
  const data = get(entityName, id);
  if (!data) notFound();

  const children = {};
  if (spec.children) {
    for (const [key, childDef] of Object.entries(spec.children)) {
      children[key] = getChildren(entityName, id, childDef);
    }
  }

  return { user, spec, data, children };
}

export async function getFormContext(entityName, id = null, action = 'create') {
  const { user, spec } = await requireEntityAccess(entityName, action, {
    redirectTo: id ? `/${entityName}/${id}` : `/${entityName}`
  });

  const data = id ? get(entityName, id) : {};
  if (id && !data) notFound();

  const options = await loadOptions(spec);
  return { user, spec, data, options };
}

export function getPageProps(user, spec) {
  return { user, nav: getNavItems(), canCreate: can(user, spec, 'create'), canEdit: can(user, spec, 'edit'), canDelete: can(user, spec, 'delete') };
}

export function listMetadata(entity) {
  try { return { title: getSpec(entity).labelPlural }; } catch { return { title: 'Not Found' }; }
}

export function detailMetadata(entity, id) {
  try {
    const spec = getSpec(entity), data = get(entity, id);
    return { title: data?.name || data?.email || spec.label };
  } catch { return { title: 'Not Found' }; }
}

export function newMetadata(entity) {
  try { return { title: `New ${getSpec(entity).label}` }; } catch { return { title: 'Not Found' }; }
}

export function editMetadata(entity, id) {
  try {
    const spec = getSpec(entity), data = get(entity, id);
    return { title: `Edit ${data?.name || spec.label}` };
  } catch { return { title: 'Not Found' }; }
}
