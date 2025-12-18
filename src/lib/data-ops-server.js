export async function listServer(entity, where = {}, options = {}) {
  try {
    const { list } = await import('@/lib/query-engine');
    return list(entity, where, options);
  } catch (e) {
    console.error(`[DataLayer] List error for ${entity}:`, e);
    throw e;
  }
}

export async function listWithPaginationServer(entity, where = {}, page = 1, pageSize = 20) {
  try {
    const { listWithPagination } = await import('@/lib/query-engine');
    return listWithPagination(entity, where, page, pageSize);
  } catch (e) {
    console.error(`[DataLayer] ListWithPagination error for ${entity}:`, e);
    throw e;
  }
}

export async function getServer(entity, id) {
  try {
    const { get } = await import('@/lib/query-engine');
    return get(entity, id);
  } catch (e) {
    console.error(`[DataLayer] Get error for ${entity}:${id}:`, e);
    throw e;
  }
}

export async function getByServer(entity, field, value) {
  try {
    const { getBy } = await import('@/lib/query-engine');
    return getBy(entity, field, value);
  } catch (e) {
    console.error(`[DataLayer] GetBy error for ${entity}.${field}=${value}:`, e);
    throw e;
  }
}

export async function createServer(entity, data) {
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

export async function updateServer(entity, id, data) {
  try {
    const { update, get } = await import('@/lib/query-engine');
    const { getUser } = await import('@/engine.server');
    const user = await getUser();
    await update(entity, id, data, user);
    return get(entity, id);
  } catch (e) {
    console.error(`[DataLayer] Update error for ${entity}:${id}:`, e);
    throw e;
  }
}

export async function deleteServer(entity, id) {
  try {
    const { remove } = await import('@/lib/query-engine');
    await remove(entity, id);
    return { success: true };
  } catch (e) {
    console.error(`[DataLayer] Delete error for ${entity}:${id}:`, e);
    throw e;
  }
}

export async function searchServer(entity, query, where = {}) {
  try {
    const { search } = await import('@/lib/query-engine');
    return search(entity, query, where);
  } catch (e) {
    console.error(`[DataLayer] Search error for ${entity}:`, e);
    throw e;
  }
}
