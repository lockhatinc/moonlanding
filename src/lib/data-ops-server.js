async function getDefaultPageSize() {
  try {
    const { getConfigEngine } = await import('@/lib/config-generator-engine');
    const engine = await getConfigEngine();
    return engine.getConfig().system.pagination.default_page_size;
  } catch (error) {
    console.warn('[data-ops-server] Failed to load pagination config, using default 50');
    return 50;
  }
}

const wrap = (fn, getName) => async (...args) => {
  try {
    return await fn(...args);
  } catch (e) {
    console.error(`[DataLayer] ${getName(...args)} error:`, e);
    throw e;
  }
};

const createOps = (qe) => {
  const defaultPageSize = 50;
  return {
  listServer: wrap((e, w = {}, o = {}) => qe.list(e, w, o), (e) => `List for ${e}`),
  listWithPaginationServer: wrap((e, w = {}, p = 1, ps = null) => qe.listWithPagination(e, w, p, ps || defaultPageSize), (e) => `ListWithPagination for ${e}`),
  getServer: wrap((e, id) => qe.get(e, id), (e, id) => `Get for ${e}:${id}`),
  getByServer: wrap((e, f, v) => qe.getBy(e, f, v), (e, f, v) => `GetBy for ${e}.${f}=${v}`),
  createServer: wrap(async (e, d) => { const { getUser } = await import('@/engine.server'); return qe.create(e, d, await getUser()); }, (e) => `Create for ${e}`),
  updateServer: wrap(async (e, id, d) => { const { getUser } = await import('@/engine.server'); await qe.update(e, id, d, await getUser()); return qe.get(e, id); }, (e, id) => `Update for ${e}:${id}`),
  deleteServer: wrap(async (e, id) => { await qe.remove(e, id); return { success: true }; }, (e, id) => `Delete for ${e}:${id}`),
  searchServer: wrap((e, q, w = {}) => qe.search(e, q, w), (e) => `Search for ${e}`)
  };
};

const ops = import('@/lib/query-engine').then(createOps);

export const listServer = async (...args) => (await ops).listServer(...args);
export const listWithPaginationServer = async (...args) => (await ops).listWithPaginationServer(...args);
export const getServer = async (...args) => (await ops).getServer(...args);
export const getByServer = async (...args) => (await ops).getByServer(...args);
export const createServer = async (...args) => (await ops).createServer(...args);
export const updateServer = async (...args) => (await ops).updateServer(...args);
export const deleteServer = async (...args) => (await ops).deleteServer(...args);
export const searchServer = async (...args) => (await ops).searchServer(...args);
