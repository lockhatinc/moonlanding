import { QueryAdapter } from './query-string-adapter';

export class ExtendedQueryAdapter extends QueryAdapter {
  static buildDetailRoute(entity, id) {
    return `/${entity}/${id}`;
  }

  static buildEditRoute(entity, id) {
    return `/${entity}/${id}/edit`;
  }

  static buildCreateRoute(entity) {
    return `/${entity}/new`;
  }

  static buildListRoute(entity, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return qs ? `/${entity}?${qs}` : `/${entity}`;
  }

  static buildRoute(entity, action, params = {}) {
    switch (action) {
      case 'list':
        return this.buildListRoute(entity, params);
      case 'create':
        return this.buildCreateRoute(entity);
      case 'detail':
        return this.buildDetailRoute(entity, params.id);
      case 'edit':
        return this.buildEditRoute(entity, params.id);
      default:
        return this.buildListRoute(entity, params);
    }
  }

  static buildChildRoute(entity, id, child, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    const base = `/${entity}/${id}/${child}`;
    return qs ? `${base}?${qs}` : base;
  }

  static buildSearchRoute(entity, query, filters = {}) {
    return this.buildListRoute(entity, { q: query, ...filters });
  }

  static buildPaginatedRoute(entity, page, pageSize, filters = {}) {
    return this.buildListRoute(entity, {
      page: String(page),
      pageSize: String(pageSize),
      ...filters,
    });
  }

  static navigateTo(router, entity, action, params = {}) {
    const route = this.buildRoute(entity, action, params);
    if (router) {
      router.push(route);
    } else if (typeof window !== 'undefined') {
      window.location.href = route;
    }
  }
}

export default ExtendedQueryAdapter;
