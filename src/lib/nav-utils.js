/**
 * Navigation utilities for consistent route and URL handling
 */

import { buildParams } from './fetch-utils';

/**
 * Build routes for entities
 */
export const routes = {
  /**
   * Entity list view
   * @param {string} entity - Entity name (e.g., 'engagement')
   * @param {object} params - Query parameters
   * @returns {string} List route
   */
  list: (entity, params = {}) => {
    const query = buildParams(params).toString();
    return query ? `/${entity}?${query}` : `/${entity}`;
  },

  /**
   * Entity detail view
   * @param {string} entity - Entity name
   * @param {string} id - Entity ID
   * @returns {string} Detail route
   */
  detail: (entity, id) => `/${entity}/${id}`,

  /**
   * Entity edit view
   * @param {string} entity - Entity name
   * @param {string} id - Entity ID
   * @returns {string} Edit route
   */
  edit: (entity, id) => `/${entity}/${id}/edit`,

  /**
   * Entity create view
   * @param {string} entity - Entity name
   * @param {object} params - Query parameters for prefilling
   * @returns {string} Create route
   */
  create: (entity, params = {}) => {
    const query = buildParams(params).toString();
    return query ? `/${entity}/new?${query}` : `/${entity}/new`;
  },

  /**
   * Custom entity action route
   * @param {string} entity - Entity name
   * @param {string} id - Entity ID
   * @param {string} action - Action name
   * @returns {string} Action route
   */
  action: (entity, id, action) => `/${entity}/${id}/${action}`,
};

/**
 * Update URL search parameters while keeping existing ones
 * @param {object} newParams - New parameters to set/update
 * @returns {string} Updated URL
 */
export const updateUrlParams = (newParams = {}) => {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  Object.entries(newParams).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  return `${typeof window !== 'undefined' ? window.location.pathname : ''}${params.toString() ? `?${params.toString()}` : ''}`;
};

/**
 * Remove URL search parameters
 * @param {string|array} keys - Parameter key(s) to remove
 * @returns {string} Updated URL
 */
export const removeUrlParams = (keys = []) => {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const keysToRemove = Array.isArray(keys) ? keys : [keys];
  keysToRemove.forEach(key => params.delete(key));
  return `${typeof window !== 'undefined' ? window.location.pathname : ''}${params.toString() ? `?${params.toString()}` : ''}`;
};

/**
 * Get URL parameter value
 * @param {string} key - Parameter key
 * @returns {string|null} Parameter value
 */
export const getUrlParam = (key) => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
};

/**
 * Get all URL parameters as object
 * @returns {object} All parameters
 */
export const getUrlParams = () => {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};
