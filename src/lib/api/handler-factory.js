import { getSpec } from '@/config';
import { list, get, create, update, remove, search, count } from '@/lib/database/crud-list';
import { get as getRecord } from '@/lib/database/crud-get';
import { create as createRecord } from '@/lib/database/crud-create';
import { update as updateRecord } from '@/lib/database/crud-update';
import { remove as removeRecord } from '@/lib/database/crud-delete';
import { authRequired } from '@/lib/middleware/auth-middleware';
import { createEntityPermissionMiddleware } from '@/lib/middleware/permission-middleware';
import { validateInput, validateUpdate } from '@/lib/middleware/validation-middleware';
import { createErrorResponse, logError } from '@/lib/middleware/error-handler-middleware';
import { ok, created, badRequest, notFound, unauthorized, serverError } from './response-helpers';

async function parseEntityParams(searchParams, params) {
  const entity = params.entity;
  const pathSegments = params['...path'] || [];
  const id = pathSegments[0];
  const childKey = pathSegments[1];

  return { entity, id, childKey };
}

export async function createListHandler(options = {}) {
  const {
    requireAuth = true,
    requirePermission = true,
    pageSize = 20,
  } = options;

  return async (request, { params, searchParams }) => {
    try {
      const { entity } = await parseEntityParams(searchParams, params);
      const spec = getSpec(entity);
      if (!spec) return notFound('Entity not found');

      if (requireAuth) await authRequired();
      if (requirePermission) await createEntityPermissionMiddleware(entity, 'list')(await authRequired());

      const page = parseInt(searchParams.get('page') || '1');
      const ps = parseInt(searchParams.get('pageSize') || String(pageSize));
      const where = Object.fromEntries(searchParams.entries());
      delete where.page;
      delete where.pageSize;

      const result = list(entity, where, { limit: ps, offset: (page - 1) * ps });

      return ok({
        items: result,
        pagination: {
          page,
          pageSize: ps,
          hasMore: result.length === ps,
        },
      });
    } catch (error) {
      logError(error, { action: 'list' });
      return createErrorResponse(error);
    }
  };
}

export async function createGetHandler(options = {}) {
  const { requireAuth = true, requirePermission = true } = options;

  return async (request, { params, searchParams }) => {
    try {
      const { entity, id } = await parseEntityParams(searchParams, params);
      if (!id) return badRequest('ID required');

      const spec = getSpec(entity);
      if (!spec) return notFound('Entity not found');

      if (requireAuth) await authRequired();
      if (requirePermission) await createEntityPermissionMiddleware(entity, 'view')(await authRequired());

      const record = getRecord(entity, id);
      if (!record) return notFound('Record not found');

      return ok(record);
    } catch (error) {
      logError(error, { action: 'get' });
      return createErrorResponse(error);
    }
  };
}

export async function createCreateHandler(options = {}) {
  const { requireAuth = true, requirePermission = true, requireValidation = true } = options;

  return async (request, { params, searchParams }) => {
    try {
      const { entity } = await parseEntityParams(searchParams, params);
      const spec = getSpec(entity);
      if (!spec) return notFound('Entity not found');

      const user = requireAuth ? await authRequired() : null;
      if (requirePermission && user) {
        await createEntityPermissionMiddleware(entity, 'create')(user);
      }

      const data = await request.json();

      if (requireValidation) {
        await validateInput(spec, data, true);
      }

      const record = createRecord(entity, data, user);
      return created(record);
    } catch (error) {
      logError(error, { action: 'create' });
      return createErrorResponse(error);
    }
  };
}

export async function createUpdateHandler(options = {}) {
  const { requireAuth = true, requirePermission = true, requireValidation = true } = options;

  return async (request, { params, searchParams }) => {
    try {
      const { entity, id } = await parseEntityParams(searchParams, params);
      if (!id) return badRequest('ID required');

      const spec = getSpec(entity);
      if (!spec) return notFound('Entity not found');

      const user = requireAuth ? await authRequired() : null;
      if (requirePermission && user) {
        await createEntityPermissionMiddleware(entity, 'edit')(user);
      }

      const data = await request.json();

      if (requireValidation) {
        await validateUpdate(spec, id, data, true);
      }

      updateRecord(entity, id, data, user);
      const record = getRecord(entity, id);

      return ok(record);
    } catch (error) {
      logError(error, { action: 'update' });
      return createErrorResponse(error);
    }
  };
}

export async function createDeleteHandler(options = {}) {
  const { requireAuth = true, requirePermission = true } = options;

  return async (request, { params, searchParams }) => {
    try {
      const { entity, id } = await parseEntityParams(searchParams, params);
      if (!id) return badRequest('ID required');

      const spec = getSpec(entity);
      if (!spec) return notFound('Entity not found');

      const user = requireAuth ? await authRequired() : null;
      if (requirePermission && user) {
        await createEntityPermissionMiddleware(entity, 'delete')(user);
      }

      removeRecord(entity, id);
      return ok({ id, deleted: true });
    } catch (error) {
      logError(error, { action: 'delete' });
      return createErrorResponse(error);
    }
  };
}

export async function createSearchHandler(options = {}) {
  const { requireAuth = true, requirePermission = true } = options;

  return async (request, { params, searchParams }) => {
    try {
      const { entity } = await parseEntityParams(searchParams, params);
      const spec = getSpec(entity);
      if (!spec) return notFound('Entity not found');

      if (requireAuth) await authRequired();
      if (requirePermission) await createEntityPermissionMiddleware(entity, 'list')(await authRequired());

      const q = searchParams.get('q');
      if (!q) return badRequest('Search query required');

      const where = Object.fromEntries(searchParams.entries());
      delete where.q;

      const results = search(entity, q, where);
      return ok({ items: results });
    } catch (error) {
      logError(error, { action: 'search' });
      return createErrorResponse(error);
    }
  };
}

export async function createCountHandler(options = {}) {
  const { requireAuth = true, requirePermission = true } = options;

  return async (request, { params, searchParams }) => {
    try {
      const { entity } = await parseEntityParams(searchParams, params);
      const spec = getSpec(entity);
      if (!spec) return notFound('Entity not found');

      if (requireAuth) await authRequired();
      if (requirePermission) await createEntityPermissionMiddleware(entity, 'list')(await authRequired());

      const where = Object.fromEntries(searchParams.entries());
      const total = count(entity, where);

      return ok({ total });
    } catch (error) {
      logError(error, { action: 'count' });
      return createErrorResponse(error);
    }
  };
}
