import { PAGINATION } from '@/config/pagination-constants';
import { API_ENDPOINTS } from '@/config';
import { fetchApiCall, buildQueryParams } from './http-adapter';

export async function listClient(entity, where = {}, options = {}) {
  const params = buildQueryParams(where, options);
  return fetchApiCall('GET', API_ENDPOINTS.list(entity, params), null, {
    responseTransform: (data) => data.items || [],
    logContext: `List error for ${entity}`,
  });
}

export async function listWithPaginationClient(entity, where = {}, page = 1, pageSize = PAGINATION.defaultPageSize) {
  const params = buildQueryParams(where, { page, pageSize });
  return fetchApiCall('GET', API_ENDPOINTS.paginate(entity, page, pageSize, where), null, {
    responseTransform: (data) => ({
      items: data.items || [],
      pagination: data.pagination,
    }),
    logContext: `ListWithPagination error for ${entity}`,
  });
}

export async function getClient(entity, id) {
  return fetchApiCall('GET', API_ENDPOINTS.get(entity, id), null, {
    logContext: `Get error for ${entity}:${id}`,
  });
}

export async function getByClient(entity, field, value) {
  const params = { [field]: value };
  return fetchApiCall('GET', API_ENDPOINTS.list(entity, params), null, {
    responseTransform: (data) => data.items?.[0] || null,
    logContext: `GetBy error for ${entity}.${field}=${value}`,
  });
}

export async function createClient(entity, data) {
  return fetchApiCall('POST', API_ENDPOINTS.create(entity), data, {
    logContext: `Create error for ${entity}`,
  });
}

export async function updateClient(entity, id, data) {
  return fetchApiCall('PUT', API_ENDPOINTS.update(entity, id), data, {
    logContext: `Update error for ${entity}:${id}`,
  });
}

export async function deleteClient(entity, id) {
  return fetchApiCall('DELETE', API_ENDPOINTS.delete(entity, id), null, {
    logContext: `Delete error for ${entity}:${id}`,
  });
}

export async function searchClient(entity, query, where = {}) {
  return fetchApiCall('GET', API_ENDPOINTS.search(entity, query, where), null, {
    responseTransform: (data) => data.items || [],
    logContext: `Search error for ${entity}`,
  });
}
