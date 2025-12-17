import { getSpec } from '@/config';

class DataAccessLayer {
  constructor(isServer = false) {
    this.isServer = isServer;
    this.cache = new Map();
    this.cacheEnabled = false;
  }

  enableCache() {
    this.cacheEnabled = true;
  }

  disableCache() {
    this.cacheEnabled = false;
    this.cache.clear();
  }

  getCacheKey(entity, id = null, options = {}) {
    if (id) return `${entity}:${id}`;
    const sortKey = options.sort ? `${options.sort.field}:${options.sort.dir}` : '';
    const queryKey = options.query || '';
    return `${entity}:list:${queryKey}:${sortKey}`;
  }

  getFromCache(entity, id = null, options = {}) {
    if (!this.cacheEnabled) return null;
    const key = this.getCacheKey(entity, id, options);
    return this.cache.get(key);
  }

  setCache(entity, data, id = null, options = {}) {
    if (!this.cacheEnabled) return;
    const key = this.getCacheKey(entity, id, options);
    this.cache.set(key, data);
  }

  clearEntityCache(entity) {
    if (!this.cacheEnabled) return;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${entity}:`)) {
        this.cache.delete(key);
      }
    }
  }

  async list(entity, where = {}, options = {}) {
    if (this.isServer) {
      return this._listServer(entity, where, options);
    }
    return this._listClient(entity, where, options);
  }

  async listWithPagination(entity, where = {}, page = 1, pageSize = 20, options = {}) {
    if (this.isServer) {
      return this._listWithPaginationServer(entity, where, page, pageSize, options);
    }
    return this._listWithPaginationClient(entity, where, page, pageSize, options);
  }

  async get(entity, id, options = {}) {
    const cached = this.getFromCache(entity, id, options);
    if (cached) return cached;

    let result;
    if (this.isServer) {
      result = await this._getServer(entity, id, options);
    } else {
      result = await this._getClient(entity, id, options);
    }

    if (result) this.setCache(entity, result, id, options);
    return result;
  }

  async getBy(entity, field, value, options = {}) {
    if (this.isServer) {
      return this._getByServer(entity, field, value, options);
    }
    return this._getByClient(entity, field, value, options);
  }

  async create(entity, data, options = {}) {
    let result;
    if (this.isServer) {
      result = await this._createServer(entity, data, options);
    } else {
      result = await this._createClient(entity, data, options);
    }

    if (result) {
      this.clearEntityCache(entity);
    }
    return result;
  }

  async update(entity, id, data, options = {}) {
    let result;
    if (this.isServer) {
      result = await this._updateServer(entity, id, data, options);
    } else {
      result = await this._updateClient(entity, id, data, options);
    }

    if (result) {
      this.cache.delete(this.getCacheKey(entity, id));
      this.clearEntityCache(entity);
    }
    return result;
  }

  async delete(entity, id, options = {}) {
    if (this.isServer) {
      return this._deleteServer(entity, id, options);
    }
    return this._deleteClient(entity, id, options);

    if (success) {
      this.cache.delete(this.getCacheKey(entity, id));
      this.clearEntityCache(entity);
    }
  }

  async search(entity, query, where = {}, options = {}) {
    if (this.isServer) {
      return this._searchServer(entity, query, where, options);
    }
    return this._searchClient(entity, query, where, options);
  }

  async _listServer(entity, where = {}, options = {}) {
    try {
      const { list } = await import('@/lib/query-engine');
      return list(entity, where, options);
    } catch (e) {
      console.error(`[DataLayer] List error for ${entity}:`, e);
      throw e;
    }
  }

  async _listClient(entity, where = {}, options = {}) {
    try {
      const query = new URLSearchParams();
      Object.entries(where).forEach(([k, v]) => query.append(k, v));
      if (options.limit) query.append('limit', options.limit);
      if (options.offset) query.append('offset', options.offset);
      if (options.sort) {
        query.append('sort', options.sort.field);
        query.append('sortDir', options.sort.dir);
      }

      const response = await fetch(`/api/${entity}?${query.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'success') throw new Error(json.message);
      return json.data.items || [];
    } catch (e) {
      console.error(`[DataLayer] List error for ${entity}:`, e);
      throw e;
    }
  }

  async _listWithPaginationServer(entity, where = {}, page = 1, pageSize = 20, options = {}) {
    try {
      const { listWithPagination } = await import('@/lib/query-engine');
      return listWithPagination(entity, where, page, pageSize);
    } catch (e) {
      console.error(`[DataLayer] ListWithPagination error for ${entity}:`, e);
      throw e;
    }
  }

  async _listWithPaginationClient(entity, where = {}, page = 1, pageSize = 20, options = {}) {
    try {
      const query = new URLSearchParams();
      query.append('page', page);
      query.append('pageSize', pageSize);
      Object.entries(where).forEach(([k, v]) => query.append(k, v));

      const response = await fetch(`/api/${entity}?${query.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'success') throw new Error(json.message);
      return {
        items: json.data.items || [],
        pagination: json.data.pagination,
      };
    } catch (e) {
      console.error(`[DataLayer] ListWithPagination error for ${entity}:`, e);
      throw e;
    }
  }

  async _getServer(entity, id, options = {}) {
    try {
      const { get } = await import('@/lib/query-engine');
      return get(entity, id);
    } catch (e) {
      console.error(`[DataLayer] Get error for ${entity}:${id}:`, e);
      throw e;
    }
  }

  async _getClient(entity, id, options = {}) {
    try {
      const response = await fetch(`/api/${entity}/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'success') throw new Error(json.message);
      return json.data;
    } catch (e) {
      console.error(`[DataLayer] Get error for ${entity}:${id}:`, e);
      throw e;
    }
  }

  async _getByServer(entity, field, value, options = {}) {
    try {
      const { getBy } = await import('@/lib/query-engine');
      return getBy(entity, field, value);
    } catch (e) {
      console.error(`[DataLayer] GetBy error for ${entity}.${field}=${value}:`, e);
      throw e;
    }
  }

  async _getByClient(entity, field, value, options = {}) {
    try {
      const query = new URLSearchParams();
      query.append(field, value);
      const response = await fetch(`/api/${entity}?${query.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'success') throw new Error(json.message);
      return json.data.items?.[0] || null;
    } catch (e) {
      console.error(`[DataLayer] GetBy error for ${entity}.${field}=${value}:`, e);
      throw e;
    }
  }

  async _createServer(entity, data, options = {}) {
    try {
      const { create } = await import('@/lib/query-engine');
      const { getUser } = await import('@/engine.server');
      const user = await getUser();
      return create(entity, data, user);
    } catch (e) {
      console.error(`[DataLayer] Create error for ${entity}:`, e);
      throw e;
    }
  }

  async _createClient(entity, data, options = {}) {
    try {
      const response = await fetch(`/api/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'success') throw new Error(json.message);
      return json.data;
    } catch (e) {
      console.error(`[DataLayer] Create error for ${entity}:`, e);
      throw e;
    }
  }

  async _updateServer(entity, id, data, options = {}) {
    try {
      const { update } = await import('@/lib/query-engine');
      const { getUser } = await import('@/engine.server');
      const user = await getUser();
      update(entity, id, data, user);
      const { get } = await import('@/lib/query-engine');
      return get(entity, id);
    } catch (e) {
      console.error(`[DataLayer] Update error for ${entity}:${id}:`, e);
      throw e;
    }
  }

  async _updateClient(entity, id, data, options = {}) {
    try {
      const response = await fetch(`/api/${entity}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'success') throw new Error(json.message);
      return json.data;
    } catch (e) {
      console.error(`[DataLayer] Update error for ${entity}:${id}:`, e);
      throw e;
    }
  }

  async _deleteServer(entity, id, options = {}) {
    try {
      const { remove } = await import('@/lib/query-engine');
      remove(entity, id);
      return { success: true };
    } catch (e) {
      console.error(`[DataLayer] Delete error for ${entity}:${id}:`, e);
      throw e;
    }
  }

  async _deleteClient(entity, id, options = {}) {
    try {
      const response = await fetch(`/api/${entity}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'success') throw new Error(json.message);
      return json.data;
    } catch (e) {
      console.error(`[DataLayer] Delete error for ${entity}:${id}:`, e);
      throw e;
    }
  }

  async _searchServer(entity, query, where = {}, options = {}) {
    try {
      const { search } = await import('@/lib/query-engine');
      return search(entity, query, where);
    } catch (e) {
      console.error(`[DataLayer] Search error for ${entity}:`, e);
      throw e;
    }
  }

  async _searchClient(entity, query, where = {}, options = {}) {
    try {
      const q = new URLSearchParams();
      q.append('q', query);
      Object.entries(where).forEach(([k, v]) => q.append(k, v));

      const response = await fetch(`/api/${entity}?${q.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'success') throw new Error(json.message);
      return json.data.items || [];
    } catch (e) {
      console.error(`[DataLayer] Search error for ${entity}:`, e);
      throw e;
    }
  }
}

export const createDataLayer = (isServer = false) => new DataAccessLayer(isServer);

export const serverDataLayer = new DataAccessLayer(true);
export const clientDataLayer = new DataAccessLayer(false);
