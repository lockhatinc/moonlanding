// Route Helpers - Consolidates common route patterns
import { getSpec, getNavItems } from '@/specs';
import { get, getChildren } from '@/engine';
import { getUser } from '@/engine.server';
import { can } from '@/lib/permissions';
import { redirect, notFound } from 'next/navigation';
import { loadOptions } from './form-utils';

/**
 * Validate entity access and return spec/user
 */
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
 * Common page wrapper props
 */
export function getPageProps(user, spec) {
  return { user, nav: getNavItems(), canCreate: can(user, spec, 'create'), canEdit: can(user, spec, 'edit'), canDelete: can(user, spec, 'delete') };
}

// ========================================
// UNIFIED METADATA GENERATORS
// ========================================

/**
 * Generate metadata for list pages
 */
export function listMetadata(entity) {
  try { return { title: getSpec(entity).labelPlural }; } catch { return { title: 'Not Found' }; }
}

/**
 * Generate metadata for detail pages
 */
export function detailMetadata(entity, id) {
  try {
    const spec = getSpec(entity), data = get(entity, id);
    return { title: data?.name || data?.email || spec.label };
  } catch { return { title: 'Not Found' }; }
}

/**
 * Generate metadata for new pages
 */
export function newMetadata(entity) {
  try { return { title: `New ${getSpec(entity).label}` }; } catch { return { title: 'Not Found' }; }
}

/**
 * Generate metadata for edit pages
 */
export function editMetadata(entity, id) {
  try {
    const spec = getSpec(entity), data = get(entity, id);
    return { title: `Edit ${data?.name || spec.label}` };
  } catch { return { title: 'Not Found' }; }
}
