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
  FIELD_TYPES,
  SQL_TYPES,
  STAGE_TRANSITIONS,
  PAGINATION,
  VALIDATION,
} from './constants';

export { getFormFields, getListFields, getDisplayFields, getEditableFields, getRequiredFields, getSearchFields, getFilterableFields, getRefFields, getField, getFieldType } from '@/lib/field-iterator';

export { PERMISSIONS, canUserAction, canUserPerformAction, checkPermission } from './permissions';
export { specs, getSpec, getNavItems, buildNavigation, getChildEntities, getParentEntity, getDefaultSort, getAvailableFilters, getPageSize, getEntityLabel, getInitialState, isEmbeddedEntity, isParentEntity, hasChildRelationships, isSoftDeleted, getOptions, getOptionLabel, getOptionColor, getNextEngagementStage } from './spec-helpers';
export { HTTP_RESPONSES, RESPONSE_MAPPERS } from './responses';
export { config, VALIDATORS, hasGoogleAuth, hasDriveConfig, hasEmailConfig, EMAIL_RESOLVERS } from './env';

export const API_ENDPOINTS = {
  entity: (name) => `/api/${name}`,
  entityId: (name, id) => `/api/${name}/${id}`,
  entityChild: (name, id, child) => `/api/${name}/${id}/${child}`,
};

export { default } from './env';
