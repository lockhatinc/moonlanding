export {
  ROLES,
  USER_TYPES,
  RFI_STATUS,
  RFI_CLIENT_STATUS,
  RFI_AUDITOR_STATUS,
  ENGAGEMENT_STATUS,
  ENGAGEMENT_STAGE,
  REVIEW_STATUS,
  HIGHLIGHT_STATUS,
  REPEAT_INTERVALS,
  HTTP,
  ERRORS,
  COLORS,
  BADGE_COLORS_MANTINE,
  DISPLAY,
  SQL_TYPES,
  STAGE_TRANSITIONS,
  VALIDATION,
} from './constants';

import { getFormFields, getListFields } from '@/lib/field-iterator';
export { fieldQuery, is, getFormFields, getListFields, getDisplayFields, getEditableFields, getRequiredFields, getSearchFields, getFilterableFields, getRefFields, getField, getFieldType, forEachField, iterateCreateFields, iterateUpdateFields } from '@/lib/field-iterator';

export const buildFormFields = getFormFields;
export const buildListColumns = getListFields;

export { config, VALIDATORS, hasGoogleAuth, hasDriveConfig, hasEmailConfig } from './env';
export { SESSION, TOKEN, AUTH_CONFIG } from './auth-config';
export { MODAL_SIZES, CONTAINER_HEIGHTS, SPACING, GRID_BREAKPOINTS, LAYOUT } from './ui-config';
export { THEME, getStatusColor, getStageColor, getSeverityColor, getBadgeProps, getColorMapping } from './theme-config';
export { ENTITY_ICONS, STATUS_ICONS, ACTION_ICONS, NAVIGATION_ICONS, UI_ICONS, getEntityIcon, getStatusIcon, getActionIcon, getNavigationIcon, getUIIcon, Icons } from './icon-config';
export { SpecBuilder, spec } from './spec-builder';
export { COMPONENT_PATHS, COMPONENT_REGISTRY, getComponent, getComponentPath, getComponentFilePath, getComponentLoader, createComponentLoader, hasComponent, listComponents, listCategories } from './component-paths';
export { EMAIL_DEFAULTS, EMAIL_TEMPLATES, getEmailTemplate, EMAIL_RESOLVERS as RECIPIENT_RESOLVERS, resolveRecipientsForTemplate as resolveRecipients } from '@/engine/notification-engine';
export { DATABASE_LIMITS, MEMORY_LIMITS, QUERY_LIMITS, VALIDATION_LIMITS, FILE_LIMITS, API_LIMITS, SEARCH_LIMITS } from './system-limits-config';
export { POLLING_CONFIG, RETRY_TIMING, NOTIFICATION_TIMING, CACHE_TTL, DEBOUNCE_TIMING, THROTTLE_TIMING, SESSION_TIMING, ANIMATION_TIMING, API_TIMING, MAINTENANCE_TIMING } from './timing-config';
export { TimelineEngine, timelineEngine } from '@/lib/timeline-engine';

export const API_ENDPOINTS = {
  entity: (name) => `/api/${name}`,
  entityId: (name, id) => `/api/${name}/${id}`,
  entityChild: (name, id, child) => `/api/${name}/${id}/${child}`,

  list: (entity, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return qs ? `/api/${entity}?${qs}` : `/api/${entity}`;
  },

  get: (entity, id) => `/api/${entity}/${id}`,

  create: (entity) => `/api/${entity}`,

  update: (entity, id) => `/api/${entity}/${id}`,

  delete: (entity, id) => `/api/${entity}/${id}`,

  search: (entity, query, filters = {}) => {
    const params = new URLSearchParams({ q: query, ...filters });
    return `/api/${entity}?${params}`;
  },

  paginate: (entity, page, pageSize, filters = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...filters });
    return `/api/${entity}?${params}`;
  },

  searchPaginated: (entity, query, page, pageSize, filters = {}) => {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      pageSize: String(pageSize),
      ...filters
    });
    return `/api/${entity}?${params}`;
  },

  children: (entity, id, childType, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    const base = `/api/${entity}/${id}/${childType}`;
    return qs ? `${base}?${qs}` : base;
  },

  chat: (entityType, entityId) => `/api/chat?entity_type=${entityType}&entity_id=${entityId}`,

  chatSend: () => `/api/chat`,

  bulkDelete: (entity, ids) => `/api/${entity}?action=bulkDelete&ids=${ids.join(',')}`,

  bulkUpdate: (entity) => `/api/${entity}?action=bulkUpdate`,

  action: (entity, actionName, params = {}) => {
    const query = new URLSearchParams({ action: actionName, ...params });
    return `/api/${entity}?${query}`;
  },
};

export { default } from './env';
