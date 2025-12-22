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

export {
  STANDARD_STATUS_OPTIONS,
  LIFECYCLE_STATUS_OPTIONS,
  SEVERITY_OPTIONS,
  PRIORITY_OPTIONS,
  RFI_CLIENT_STATUS_OPTIONS,
  RFI_AUDITOR_STATUS_OPTIONS,
  HIGHLIGHT_STATUS_OPTIONS,
  REVIEW_STATUS_OPTIONS,
  RFI_STATUS_OPTIONS,
  ENGAGEMENT_STAGE_OPTIONS,
} from './enum-options';

import { getFormFields, getListFields } from '@/lib/field-iterator';
export { fieldQuery, is, getFormFields, getListFields, getDisplayFields, getEditableFields, getRequiredFields, getSearchFields, getFilterableFields, getRefFields, getField, getFieldType, forEachField, iterateCreateFields, iterateUpdateFields } from '@/lib/field-iterator';

export const buildFormFields = getFormFields;
export const buildListColumns = getListFields;

export { checkPermission } from './permissions';
export { specs, getSpec, getNavItems, buildNavigation, getChildEntities, getParentEntity, getDefaultSort, getAvailableFilters, getPageSize, getEntityLabel, getInitialState, isEmbeddedEntity, isParentEntity, hasChildRelationships, isSoftDeleted, getOptions, getOptionLabel, getOptionColor, getNextEngagementStage } from './spec-helpers';
export { getSpecAsync, getAllSpecsAsync, getNavItemsAsync, buildNavigationAsync } from './spec-helpers-async';
export { loadSpec, loadAllSpecs, loadConfig, clearCache } from './config-loader';
export { HTTP_RESPONSES, RESPONSE_MAPPERS } from './responses';
export { config, VALIDATORS, hasGoogleAuth, hasDriveConfig, hasEmailConfig, EMAIL_RESOLVERS } from './env';
export { SESSION, TOKEN, CACHE, TIMEOUT, AUTH_CONFIG } from './auth-config';
export { CACHE_DEFAULTS, CACHE_RULES, CACHE_STRATEGIES, CACHE_CONFIG, getCacheRule, shouldInvalidateCache } from './cache-config';
export { MODAL_SIZES, CONTAINER_HEIGHTS, SPACING, GRID_BREAKPOINTS, LAYOUT } from './ui-config';
export { ERROR_MESSAGES, SUCCESS_MESSAGES, LOG_PREFIXES } from './messages-config';
export { DATE_FORMATS, TIME_ZONES, RELATIVE_TIME_THRESHOLDS } from './format-config';
export { VALIDATION_MESSAGES, VALIDATION_DEFAULTS } from './validation-config';
export { VALIDATION_RULES, createValidator, validationRuleGenerators } from './validation-rules';
export { THEME, getStatusColor, getStageColor, getSeverityColor, getBadgeProps, getColorMapping } from './theme-config';
export { ENTITY_ICONS, STATUS_ICONS, ACTION_ICONS, NAVIGATION_ICONS, UI_ICONS, getEntityIcon, getStatusIcon, getActionIcon, getNavigationIcon, getUIIcon, Icons } from './icon-config';
export { SpecBuilder, spec } from './spec-builder';
export { createSimpleEntity } from './spec-factory';
export { allSpecs } from './entities';
export { PERMISSION_DEFAULTS, getDefaultAccess, PARTNER_ONLY_ACCESS, PARTNER_MANAGER_ACCESS, ALL_STAFF_ACCESS, READ_ONLY_ACCESS } from './permission-defaults';
export { FIELD_DISPLAY_RULES, LIST_DISPLAY_RULES, DISPLAY_LIMITS, TRUNCATION_INDICATORS } from './display-rules';
export { SQL_OPERATORS, QUERY_PATTERNS, DEFAULT_LIMITS, QUERY_DEFAULTS, FIELD_TYPES, SQL_KEYWORDS, QUERY_BUILDING, SORT_DIRECTIONS, AGGREGATE_FUNCTIONS } from './query-config';
export { COMPONENT_PATHS, COMPONENT_REGISTRY, getComponent, getComponentPath, getComponentFilePath, getComponentLoader, createComponentLoader, hasComponent, listComponents, listCategories } from './component-paths';
export { EMAIL_DEFAULTS, RECIPIENT_RESOLVERS, EMAIL_TEMPLATES, resolveRecipients, getEmailTemplate } from './email-config';
export { getEmailTemplate as getEmailTemplateAsync, getAllEmailTemplates as getAllEmailTemplatesAsync } from './email-templates-async';

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
