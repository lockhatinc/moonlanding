import { loadSpec, loadAllSpecs } from './config-loader.js';
import { STAGE_TRANSITIONS } from './constants.js';

export async function getSpecAsync(name) {
  const spec = await loadSpec(name);
  if (!spec) throw new Error(`Unknown entity: ${name}`);
  return spec;
}

export async function getAllSpecsAsync() {
  return loadAllSpecs();
}

export async function getNavItemsAsync() {
  const specs = await loadAllSpecs();
  return Object.values(specs)
    .filter(s => !s.embedded && !s.parent)
    .map(s => ({
      name: s.name,
      label: s.labelPlural || s.label,
      icon: s.icon,
      href: `/${s.name}`,
    }));
}

export async function buildNavigationAsync() {
  const specs = await loadAllSpecs();
  return Object.values(specs)
    .filter(s => !s.embedded && !s.parent)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
    .map(s => ({
      name: s.name,
      label: s.labelPlural || s.label,
      icon: s.icon,
      href: `/${s.name}`,
      badge: s.badge,
    }));
}

export function getChildEntities(spec) {
  if (!spec.children) return [];
  return Object.entries(spec.children).map(([key, child]) => ({
    key,
    entity: child.entity,
    label: child.label,
    fk: child.fk,
    filter: child.filter,
    component: child.component,
  }));
}

export function getParentEntity(spec) {
  return spec.parent || null;
}

export function getDefaultSort(spec) {
  return spec.list?.defaultSort || { field: 'created_at', dir: 'desc' };
}

export function getAvailableFilters(spec) {
  return spec.list?.filters || [];
}

export async function getPageSize(spec) {
  try {
    const { getConfigEngine } = await import('@/lib/config-generator-engine');
    const engine = await getConfigEngine();
    return spec.list?.pageSize || engine.getConfig().system.pagination.default_page_size;
  } catch (error) {
    console.warn('[spec-helpers-async] Failed to load config, using default page size 50');
    return spec.list?.pageSize || 50;
  }
}

export function getEntityLabel(spec, plural = false) {
  return plural ? (spec.labelPlural || spec.label) : spec.label;
}

export function getInitialState(spec) {
  const state = {};
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'id') continue;
    if (field.default !== undefined) {
      state[key] = field.default;
    } else if (field.type === 'bool') {
      state[key] = false;
    } else if (field.type === 'int' || field.type === 'decimal') {
      state[key] = 0;
    } else if (field.type === 'json') {
      state[key] = [];
    }
  }
  return state;
}

export function getFormFields(spec) {
  const fields = [];
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'id') continue;
    fields.push({ key, ...field });
  }
  return fields;
}

export function getDisplayFields(spec) {
  return Object.entries(spec.fields)
    .filter(([, f]) => !f.hidden)
    .map(([k, f]) => ({ key: k, ...f }));
}

export function getListColumns(spec) {
  return (spec.list?.columns || [])
    .map(key => {
      const field = spec.fields[key];
      return field ? { key, ...field } : null;
    })
    .filter(Boolean);
}
