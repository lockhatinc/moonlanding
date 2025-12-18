import { DataCache } from './data-cache';
import * as serverOps from './data-ops-server';
import * as clientOps from './data-ops-client';

class DataAccessLayer {
  constructor(isServer = false) {
    this.isServer = isServer;
    this.cache = new DataCache();
  }

  enableCache() {
    this.cache.enable();
  }

  disableCache() {
    this.cache.disable();
  }

  async list(entity, where = {}, options = {}) {
    return this.isServer
      ? serverOps.listServer(entity, where, options)
      : clientOps.listClient(entity, where, options);
  }

  async listWithPagination(entity, where = {}, page = 1, pageSize = 20) {
    return this.isServer
      ? serverOps.listWithPaginationServer(entity, where, page, pageSize)
      : clientOps.listWithPaginationClient(entity, where, page, pageSize);
  }

  async get(entity, id, options = {}) {
    const cached = this.cache.get(entity, id, options);
    if (cached) return cached;

    const result = this.isServer
      ? await serverOps.getServer(entity, id)
      : await clientOps.getClient(entity, id);

    if (result) this.cache.set(entity, result, id, options);
    return result;
  }

  async getBy(entity, field, value, options = {}) {
    return this.isServer
      ? serverOps.getByServer(entity, field, value)
      : clientOps.getByClient(entity, field, value);
  }

  async create(entity, data, options = {}) {
    const result = this.isServer
      ? await serverOps.createServer(entity, data)
      : await clientOps.createClient(entity, data);

    if (result) this.cache.clear(entity);
    return result;
  }

  async update(entity, id, data, options = {}) {
    const result = this.isServer
      ? await serverOps.updateServer(entity, id, data)
      : await clientOps.updateClient(entity, id, data);

    if (result) this.cache.clear(entity);
    return result;
  }

  async delete(entity, id, options = {}) {
    const result = this.isServer
      ? await serverOps.deleteServer(entity, id)
      : await clientOps.deleteClient(entity, id);

    if (result) this.cache.clear(entity);
    return result;
  }

  async search(entity, query, where = {}, options = {}) {
    return this.isServer
      ? serverOps.searchServer(entity, query, where)
      : clientOps.searchClient(entity, query, where);
  }
}

export const createDataLayer = (isServer = false) => new DataAccessLayer(isServer);
export const serverDataLayer = new DataAccessLayer(true);
export const clientDataLayer = new DataAccessLayer(false);
