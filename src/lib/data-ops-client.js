export async function listClient(entity, where = {}, options = {}) {
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

export async function listWithPaginationClient(entity, where = {}, page = 1, pageSize = 20) {
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

export async function getClient(entity, id) {
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

export async function getByClient(entity, field, value) {
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

export async function createClient(entity, data) {
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

export async function updateClient(entity, id, data) {
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

export async function deleteClient(entity, id) {
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

export async function searchClient(entity, query, where = {}) {
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
