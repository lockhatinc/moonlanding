import { getSpec } from '@/config/spec-helpers';
import { API_ENDPOINTS } from '@/config';
import { list, get, create, update, remove, listWithPagination, search, searchWithPagination, getChildren } from '@/lib/query-engine';
import { validateEntity, validateUpdate, hasErrors, sanitizeData } from '@/lib/validate';
import { requireAuth, requirePermission } from '@/lib/auth-middleware';
import { broadcastUpdate } from '@/lib/realtime-server';
import { executeHook } from '@/lib/hook-engine';
import { AppError, NotFoundError as NotFoundErrorClass, ValidationError } from '@/lib/errors';
import { NotFoundError } from '@/lib/error-handler';
import { ok, created, paginated } from '@/lib/response-formatter';
import { HTTP } from '@/config/api-constants';
import { permissionService } from '@/services';
import { parse as parseQuery } from '@/lib/query-string-adapter';
import { withErrorHandler } from '@/lib/with-error-handler';
import { getDomainLoader } from '@/lib/domain-loader';
import { now } from '@/lib/database-core';
import { logAction } from '@/lib/audit-logger';
import { coerceFieldValue } from '@/lib/field-registry';

export const createCrudHandlers = (entityName) => {
  console.log('[crud-factory] createCrudHandlers called with:', { entityName, type: typeof entityName });
  if (!entityName || typeof entityName !== 'string') {
    console.error('[crud-factory] FATAL: entityName is invalid!', {
      entityName,
      type: typeof entityName,
    });
    throw new Error(`[crud-factory] Invalid entityName: ${entityName} (type: ${typeof entityName})`);
  }
  console.log('[crud-factory] About to call getSpec with:', entityName);
  let spec = getSpec(entityName);
  console.log('[crud-factory] getSpec returned:', spec ? 'OK' : 'NULL');

  const handlers = {
    customAction: async (user, action, id, data = {}) => {
      if (!id) throw new AppError('ID required for custom action', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const record = get(entityName, id);
      if (!record) throw NotFoundError(entityName, id);

      const context = {
        operation: data.operation,
        fromStatus: record.status,
        toStatus: data.status || data.toStatus,
        ...data.context
      };

      permissionService.requireActionPermission(user, spec, action, record, context);

      if (action === 'respond' || action === 'upload_files') {
        return await handlers.handleRfiAction(user, id, action, data, record);
      }

      if (action === 'resolve_highlight') {
        return await handlers.handleHighlightResolve(user, id, data, record);
      }

      if (action === 'reopen_highlight') {
        return await handlers.handleHighlightReopen(user, id, data, record);
      }

      if (action === 'manage_flags') {
        return await handlers.handleFlagManagement(user, id, data, record, context);
      }

      if (action === 'change_status') {
        return await handlers.handleStatusChange(user, id, data, record, context);
      }

      if (action.startsWith('manage_collaborators')) {
        return await handlers.handleCollaboratorAction(user, id, action, data, record);
      }

      if (action.startsWith('manage_highlights')) {
        return await handlers.handleHighlightAction(user, id, action, data, record);
      }

      throw new AppError(`Unknown action: ${action}`, 'BAD_REQUEST', HTTP.BAD_REQUEST);
    },

    handleRfiAction: async (user, id, action, data, record) => {
      const ctx = await executeHook(`${action}:${entityName}:before`, {
        entity: entityName,
        id,
        data,
        user,
        record
      });

      let result;
      if (action === 'respond') {
        const updateData = {
          status: 'responded',
          response: data.response,
          responded_at: now(),
          responded_by: user.id
        };
        update(entityName, id, updateData, user);
        result = get(entityName, id);
      } else if (action === 'upload_files') {
        const files = Array.isArray(data.files) ? data.files : [data.files];
        result = { id, uploaded_files: files };
      }

      await executeHook(`${action}:${entityName}:after`, {
        entity: entityName,
        id,
        data: result,
        user
      });

      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), action, permissionService.filterFields(user, spec, result));
      return ok(permissionService.filterFields(user, spec, result));
    },

    handleHighlightResolve: async (user, id, data, record) => {
      if (record.status === 'resolved') {
        throw new AppError('Highlight already resolved', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      }

      const updateData = {
        status: 'resolved',
        resolved_at: now(),
        resolved_by: user.id,
        resolution_notes: data.notes || data.resolution_notes || '',
        color: 'green'
      };

      await executeHook(`resolve:${entityName}:before`, {
        entity: entityName,
        id,
        data: updateData,
        user,
        record
      });

      update(entityName, id, updateData, user);
      const result = get(entityName, id);

      await executeHook(`resolve:${entityName}:after`, {
        entity: entityName,
        id,
        data: result,
        user
      });

      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'resolve', permissionService.filterFields(user, spec, result));
      return ok(permissionService.filterFields(user, spec, result));
    },

    handleHighlightReopen: async (user, id, data, record) => {
      if (record.status !== 'resolved') {
        throw new AppError('Highlight not resolved', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      }

      const updateData = {
        status: 'unresolved',
        resolved_at: null,
        resolved_by: null,
        resolution_notes: null,
        color: 'grey'
      };

      await executeHook(`reopen:${entityName}:before`, {
        entity: entityName,
        id,
        data: updateData,
        user,
        record
      });

      update(entityName, id, updateData, user);
      const result = get(entityName, id);

      await executeHook(`reopen:${entityName}:after`, {
        entity: entityName,
        id,
        data: result,
        user
      });

      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'reopen', permissionService.filterFields(user, spec, result));
      return ok(permissionService.filterFields(user, spec, result));
    },

    handleFlagManagement: async (user, id, data, record, context) => {
      const operation = context.operation || 'create';

      if (operation === 'apply' && user.role === 'manager') {
        const updateData = {
          ...data,
          applied_by: user.id,
          applied_at: now()
        };

        await executeHook(`apply_flag:${entityName}:before`, {
          entity: entityName,
          id,
          data: updateData,
          user,
          record
        });

        update(entityName, id, updateData, user);
        const result = get(entityName, id);

        await executeHook(`apply_flag:${entityName}:after`, {
          entity: entityName,
          id,
          data: result,
          user
        });

        broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'apply_flag', permissionService.filterFields(user, spec, result));
        return ok(permissionService.filterFields(user, spec, result));
      }

      return await handlers.update(user, id, data);
    },

    handleStatusChange: async (user, id, data, record, context) => {
      const updateData = {
        status: data.status || data.toStatus,
        status_changed_at: now(),
        status_changed_by: user.id
      };

      await executeHook(`status_change:${entityName}:before`, {
        entity: entityName,
        id,
        data: updateData,
        user,
        record,
        fromStatus: context.fromStatus,
        toStatus: updateData.status
      });

      update(entityName, id, updateData, user);
      const result = get(entityName, id);

      await executeHook(`status_change:${entityName}:after`, {
        entity: entityName,
        id,
        data: result,
        user
      });

      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'status_change', permissionService.filterFields(user, spec, result));
      return ok(permissionService.filterFields(user, spec, result));
    },

    handleCollaboratorAction: async (user, id, action, data, record) => {
      if (!permissionService.checkOwnership(user, spec, record, action)) {
        throw new AppError('Access denied: not owner', 'FORBIDDEN', HTTP.FORBIDDEN);
      }

      return await handlers.update(user, id, data);
    },

    handleHighlightAction: async (user, id, action, data, record) => {
      if (!permissionService.checkOwnership(user, spec, record, action)) {
        throw new AppError('Access denied: not owner', 'FORBIDDEN', HTTP.FORBIDDEN);
      }

      return await handlers.update(user, id, data);
    },

    list: async (user, request) => {
      await requirePermission(user, spec, 'list');
      const { q, page, pageSize, filters } = await parseQuery(request);
      const config = await (await import('@/lib/config-generator-engine')).getConfigEngine();
      const paginationCfg = config.getConfig().system.pagination;
      const DEFAULT_PAGE_SIZE = paginationCfg.default_page_size;
      const MAX_PAGE_SIZE = paginationCfg.max_page_size;

      // Validate and set final page number
      const finalPage = page || 1;
      if (!Number.isInteger(finalPage) || finalPage < 1) {
        throw new AppError('page must be >= 1', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      }

      // Validate and set final page size
      const requestedPageSize = pageSize || DEFAULT_PAGE_SIZE;
      if (!Number.isInteger(requestedPageSize) || requestedPageSize < 1) {
        throw new AppError('pageSize must be >= 1', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      }

      // Cap pageSize to MAX_PAGE_SIZE (silently)
      const finalPageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

      if (q) {
        const { items, pagination } = await searchWithPagination(entityName, q, {}, finalPage, finalPageSize);
        const filtered = permissionService.filterRecords(user, spec, items);
        return paginated(filtered.map(item => permissionService.filterFields(user, spec, item)), pagination);
      }

      const coercedFilters = {};
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          const fieldDef = spec.fields?.[key];
          coercedFilters[key] = fieldDef ? coerceFieldValue(value, fieldDef.type) : value;
        }
      }

      const { items, pagination } = await listWithPagination(entityName, coercedFilters, finalPage, finalPageSize);
      const filtered = permissionService.filterRecords(user, spec, items);
      return paginated(filtered.map(item => permissionService.filterFields(user, spec, item)), pagination);
    },

    get: async (user, id) => {
      await requirePermission(user, spec, 'view');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const item = get(entityName, id);
      if (!item) throw NotFoundError(entityName, id);
      if (!permissionService.checkRowAccess(user, spec, item)) throw new AppError('Access denied', 'FORBIDDEN', HTTP.FORBIDDEN);
      return ok(permissionService.filterFields(user, spec, item));
    },

    getChildren: async (user, id, childKey) => {
      await requirePermission(user, spec, 'view');
      const childDef = spec.children?.[childKey];
      if (!childDef) throw new AppError('Unknown child', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      return ok(getChildren(entityName, id, childDef));
    },

    create: async (user, data) => {
      await requirePermission(user, spec, 'create');
      permissionService.enforceEditPermissions(user, spec, data);
      const errors = await validateEntity(entityName, data);
      if (hasErrors?.(errors) || Object.keys(errors).length) throw new ValidationError('Validation failed', errors);
      const sanitized = sanitizeData(data, spec);
      const ctx = await executeHook(`create:${entityName}:before`, sanitized, { context: { entity: entityName, user } });
      const result = create(entityName, ctx.data, user);
      logAction(entityName, result.id, 'create', user?.id, null, result);
      await executeHook(`create:${entityName}:after`, { entity: entityName, data: result, user });
      broadcastUpdate(API_ENDPOINTS.entity(entityName), 'create', permissionService.filterFields(user, spec, result));
      return created(permissionService.filterFields(user, spec, result));
    },

    update: async (user, id, data) => {
      await requirePermission(user, spec, 'edit');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const prev = get(entityName, id);
      if (!prev) throw NotFoundError(entityName, id);
      if (!permissionService.checkRowAccess(user, spec, prev)) throw new AppError('Access denied', 'FORBIDDEN', HTTP.FORBIDDEN);

      if (prev.status === 'resolved' && spec.workflow) {
        const workflowDef = spec.workflowDef;
        const resolvedState = workflowDef?.states?.find(s => s.name === 'resolved');
        if (resolvedState && resolvedState.readonly === true) {
          throw new AppError('Cannot edit resolved highlight. Use reopen_highlight action first.', 'FORBIDDEN', HTTP.FORBIDDEN);
        }
      }

      permissionService.enforceEditPermissions(user, spec, data);

      if (spec.workflow && spec.entityDef?.stages && prev.stage) {
        const stageConfig = spec.entityDef.stages[prev.stage];
        const locks = stageConfig?.locks || [];

        if (prev.stage === 'close_out') {
          throw new AppError('CloseOut stage is read-only. No edits allowed.', 'FORBIDDEN', HTTP.FORBIDDEN);
        }

        if (locks.includes('all')) {
          throw new AppError(`Stage ${prev.stage} is locked. No edits allowed.`, 'FORBIDDEN', HTTP.FORBIDDEN);
        }
        const lockedFields = locks.filter(l => l !== 'all');
        const attemptedLocked = lockedFields.filter(f => f in data);
        if (attemptedLocked.length > 0) {
          throw new AppError(`Stage ${prev.stage} has locked fields: ${attemptedLocked.join(', ')}`, 'FORBIDDEN', HTTP.FORBIDDEN);
        }
      }

      const errors = await validateUpdate(entityName, id, data);
      if (hasErrors?.(errors) || Object.keys(errors).length) throw new ValidationError('Validation failed', errors);
      const sanitized = sanitizeData(data, spec);
      const ctx = await executeHook(`update:${entityName}:before`, { entity: entityName, id, data: sanitized, user, prev });
      const updateData = ctx?.data?.data !== undefined ? ctx.data.data : sanitized;
      update(ctx.entity || entityName, ctx.id || id, updateData, user);
      const result = get(entityName, id);
      logAction(entityName, id, 'update', user?.id, prev, result);
      await executeHook(`update:${entityName}:after`, { entity: entityName, id, data: result, user });
      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'update', permissionService.filterFields(user, spec, result));
      broadcastUpdate(API_ENDPOINTS.entity(entityName), 'update', permissionService.filterFields(user, spec, result));
      return ok(permissionService.filterFields(user, spec, result));
    },

    delete: async (user, id) => {
      await requirePermission(user, spec, 'delete');
      if (!id) throw new AppError('ID required', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const record = get(entityName, id);
      if (!record) throw NotFoundError(entityName, id);
      if (!permissionService.checkRowAccess(user, spec, record)) throw new AppError('Access denied', 'FORBIDDEN', HTTP.FORBIDDEN);

      const ctx = await executeHook(`delete:${entityName}:before`, { entity: entityName, id, record, user });

      const entityDef = spec.entityDef || {};
      const isImmutable = entityDef.immutable === true;
      const immutableStrategy = entityDef.immutable_strategy;

      if (isImmutable && immutableStrategy === 'move_to_archive') {
        const archiveData = {
          archived: true,
          archived_at: now(),
          archived_by: user.id
        };
        update(entityName, ctx.id || id, archiveData, user);
        logAction(entityName, id, 'archive', user?.id, record, archiveData);
      } else if (spec.fields.status) {
        update(entityName, ctx.id || id, { status: 'deleted' }, user);
        logAction(entityName, id, 'delete', user?.id, record, { status: 'deleted' });
      } else {
        remove(entityName, ctx.id || id);
        logAction(entityName, id, 'delete', user?.id, record, null);
      }

      await executeHook(`delete:${entityName}:after`, { entity: entityName, id, record, user });
      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'delete', { id });
      broadcastUpdate(API_ENDPOINTS.entity(entityName), 'delete', { id });
      return ok({ success: true });
    }
  };

  return withErrorHandler(async (request, context) => {
    if (!spec) throw new NotFoundErrorClass(`Entity "${entityName}" not found`);

    const user = await requireAuth();
    const { id, childKey } = context.params || {};
    const { action } = await parseQuery(request);
    const method = request.method;

    const domainLoader = getDomainLoader();
    const domain = domainLoader.getCurrentDomain(request);

    if (!domainLoader.isEntityInDomain(entityName, domain)) {
      throw new AppError(
        `Entity ${entityName} not available in domain ${domain}`,
        'FORBIDDEN',
        HTTP.FORBIDDEN
      );
    }

    if (method === 'GET') {
      if (id && childKey) return await handlers.getChildren(user, id, childKey);
      if (id || action === 'view') return await handlers.get(user, id || context.params?.id);
      // For nested resources, list with parent filter
      if (context.params?.parentId && context.params?.parentEntity) {
        const parentFkField = `${context.params.parentEntity}_id`;
        // Add parent filter to request
        const url = new URL(request.url);
        url.searchParams.set(parentFkField, context.params.parentId);
        const filteredRequest = new Request(url, {
          method: request.method,
          headers: request.headers
        });
        return await handlers.list(user, filteredRequest);
      }
      return await handlers.list(user, request);
    }

    if (method === 'POST') {
      if (action && id) {
        const data = await request.json();
        return await handlers.customAction(user, action, id, data);
      }
      const data = await request.json();
      // Inject parent ID for nested resources
      if (context.params?.parentId && context.params?.parentEntity) {
        const parentFkField = `${context.params.parentEntity}_id`;
        console.log(`[CRUD] Injecting parent: ${parentFkField} = ${context.params.parentId}`);
        data[parentFkField] = context.params.parentId;
        console.log(`[CRUD] Data after injection:`, data);
      } else {
        console.log(`[CRUD] No parent injection: parentId=${context.params?.parentId}, parentEntity=${context.params?.parentEntity}`);
      }
      return await handlers.create(user, data);
    }

    if (method === 'PUT' || method === 'PATCH') {
      if (action && id) {
        const data = await request.json();
        return await handlers.customAction(user, action, id, data);
      }
      return await handlers.update(user, id, await request.json());
    }

    if (method === 'DELETE') return await handlers.delete(user, id);

    throw new AppError(`Unknown action`, 'BAD_REQUEST', HTTP.BAD_REQUEST);
  }, `CRUD:${entityName}`);
};
