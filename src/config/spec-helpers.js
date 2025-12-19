import { STAGE_TRANSITIONS } from './constants';
import { PAGINATION } from './pagination-constants';
import { allSpecs } from './entities';

export const specs = { ...allSpecs };

export function getSpec(name) {
  const spec = specs[name];
  if (!spec) throw new Error(`Unknown entity: ${name}`);
  return spec;
}

export function getNavItems() {
  return Object.values(specs)
    .filter(s => !s.embedded && !s.parent)
    .map(s => ({
      name: s.name,
      label: s.labelPlural || s.label,
      icon: s.icon,
      href: `/${s.name}`,
    }));
}

export function buildNavigation() {
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

export function getPageSize(spec) {
  return spec.list?.pageSize || PAGINATION.defaultPageSize;
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
    } else {
      state[key] = '';
    }
  }
  return state;
}

export function isEmbeddedEntity(spec) {
  return spec.embedded === true;
}

export function isParentEntity(spec) {
  return !spec.embedded && !spec.parent;
}

export function hasChildRelationships(spec) {
  return !!spec.children && Object.keys(spec.children).length > 0;
}

export function isSoftDeleted(spec) {
  return spec.fields.status && spec.softDelete?.archive;
}

export function getOptions(spec, optionKey) {
  return spec.options?.[optionKey] || [];
}

export function getOptionLabel(spec, optionKey, value) {
  const option = getOptions(spec, optionKey).find(o => o.value === value);
  return option?.label || String(value);
}

export function getOptionColor(spec, optionKey, value) {
  const option = getOptions(spec, optionKey).find(o => o.value === value);
  return option?.color || 'gray';
}

export function getNextEngagementStage(currentStage) {
  return STAGE_TRANSITIONS[currentStage] || null;
}
