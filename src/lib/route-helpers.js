// Route Helpers - Consolidates common route patterns
import { getSpec, getNavItems } from '@/specs';
import { getUser, can, get, getChildren } from '@/engine';
import { redirect, notFound } from 'next/navigation';
import { loadOptions } from './form-utils';

/**
 * Validate entity access and return spec/user
 * @param {string} entityName - Entity name
 * @param {string} action - Required action permission
 * @param {Object} options - Additional options
 * @returns {{ user, spec }} - Validated user and spec
 */
export async function requireEntityAccess(entityName, action = 'view', options = {}) {
  const user = await getUser();
  if (!user) redirect('/login');

  let spec;
  try { spec = getSpec(entityName); } catch { notFound(); }

  // Check if entity is accessible via routes
  if (options.notEmbedded !== false && spec.embedded) notFound();
  if (options.allowParent !== true && spec.parent && action !== 'view') notFound();

  // Permission check
  if (!can(user, spec, action)) {
    redirect(options.redirectTo || (action === 'list' ? '/' : `/${entityName}`));
  }

  return { user, spec };
}

/**
 * Get entity data with validation
 */
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

/**
 * Prepare form page context
 */
export async function getFormContext(entityName, id = null, action = 'create') {
  const { user, spec } = await requireEntityAccess(entityName, action, {
    redirectTo: id ? `/${entityName}/${id}` : `/${entityName}`
  });

  const data = id ? get(entityName, id) : {};
  if (id && !data) notFound();

  const options = await loadOptions(spec);

  return { user, spec, data, options };
}

/**
 * Generate metadata for entity pages
 */
export function generateEntityMetadata(spec, data = null, prefix = '') {
  const title = data?.name || data?.email || spec?.label || 'Entity';
  return { title: prefix ? `${prefix} ${title}` : title };
}

/**
 * Common page wrapper props
 */
export function getPageProps(user, spec) {
  return {
    user,
    nav: getNavItems(),
    canCreate: can(user, spec, 'create'),
    canEdit: can(user, spec, 'edit'),
    canDelete: can(user, spec, 'delete'),
  };
}
