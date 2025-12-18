

import { buildParams } from './fetch-utils';

export const routes = {
  

  list: (entity, params = {}) => {
    const query = buildParams(params).toString();
    return query ? `/${entity}?${query}` : `/${entity}`;
  },

  

  detail: (entity, id) => `/${entity}/${id}`,

  

  edit: (entity, id) => `/${entity}/${id}/edit`,

  

  create: (entity, params = {}) => {
    const query = buildParams(params).toString();
    return query ? `/${entity}/new?${query}` : `/${entity}/new`;
  },

  

  action: (entity, id, action) => `/${entity}/${id}/${action}`,
};

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

export const removeUrlParams = (keys = []) => {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const keysToRemove = Array.isArray(keys) ? keys : [keys];
  keysToRemove.forEach(key => params.delete(key));
  return `${typeof window !== 'undefined' ? window.location.pathname : ''}${params.toString() ? `?${params.toString()}` : ''}`;
};

export const getUrlParam = (key) => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
};

export const getUrlParams = () => {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};
