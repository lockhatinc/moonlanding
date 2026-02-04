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

export { HTTP_RESPONSES, RESPONSE_MAPPERS } from './responses';
export { config, VALIDATORS, hasGoogleAuth, hasDriveConfig, hasEmailConfig, EMAIL_RESOLVERS } from './env';
export { SESSION, TOKEN, AUTH_CONFIG } from './auth-config';
export { MODAL_SIZES, CONTAINER_HEIGHTS, SPACING, GRID_BREAKPOINTS, LAYOUT } from './ui-config';
export { ERROR_MESSAGES, SUCCESS_MESSAGES, LOG_PREFIXES } from './messages-config';
export { DATE_FORMATS, TIME_ZONES, RELATIVE_TIME_THRESHOLDS } from './format-config';
export { THEME, getStatusColor, getStageColor, getSeverityColor, getBadgeProps, getColorMapping } from './theme-config';
export { ENTITY_ICONS, STATUS_ICONS, ACTION_ICONS, NAVIGATION_ICONS, UI_ICONS, getEntityIcon, getStatusIcon, getActionIcon, getNavigationIcon, getUIIcon, Icons } from './icon-config';
export { SpecBuilder, spec } from './spec-builder';
export { FIELD_DISPLAY_RULES, LIST_DISPLAY_RULES, DISPLAY_LIMITS, TRUNCATION_INDICATORS } from './display-rules';
export { SQL_OPERATORS, QUERY_PATTERNS, DEFAULT_LIMITS, QUERY_DEFAULTS, FIELD_TYPES, SQL_KEYWORDS, QUERY_BUILDING, SORT_DIRECTIONS, AGGREGATE_FUNCTIONS } from './query-config';
export { COMPONENT_PATHS, COMPONENT_REGISTRY, getComponent, getComponentPath, getComponentFilePath, getComponentLoader, createComponentLoader, hasComponent, listComponents, listCategories } from './component-paths';
export { EMAIL_DEFAULTS, RECIPIENT_RESOLVERS, EMAIL_TEMPLATES, resolveRecipients, getEmailTemplate } from './email-config';
export { FORM_FIELD_DEFAULTS, FORM_VALIDATION_DISPLAY, FORM_ACCESSIBILITY, FORM_SKELETON } from './form-rendering-config';
export { TABLE_DEFAULTS, TABLE_COLUMN_DEFAULTS, TABLE_GROUP_DEFAULTS, TABLE_PAGINATION_DEFAULTS, TABLE_SEARCH_DEFAULTS, LIST_EMPTY_STATE, LIST_LOADING_STATE } from './table-rendering-config';
export { HTTP_STATUS_CODES, HTTP_STATUS_MESSAGES, ERROR_STATUS_CODES, HTTP_RETRY_CONFIG, HTTP_TIMEOUT_CONFIG } from './http-status-config';
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
