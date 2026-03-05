import { API_ENDPOINTS } from '@/config';
import { list, get, create, update, remove, listWithPagination, searchWithPagination, getChildren } from '@/lib/query-engine';
import { validateEntity, validateUpdate, hasErrors, sanitizeData } from '@/lib/validate';
import { requirePermission } from '@/lib/auth-middleware';
import { broadcastUpdate } from '@/lib/realtime-server';
import { executeHook } from '@/lib/hook-engine';
import { AppError, NotFoundError as NotFoundErrorClass, ValidationError } from '@/lib/errors';
import { NotFoundError } from '@/lib/error-handler';
import { ok, created, paginated, noContent } from '@/lib/response-formatter';
import { HTTP } from '@/config/constants';
import { permissionService } from '@/services/permission.service';
import { parse as parseQuery } from '@/lib/query-string-adapter';
import { now } from '@/lib/database-core';
import { logAction } from '@/lib/audit-logger';
import { coerceFieldValue } from '@/lib/field-registry';
import { getConfigEngineSync } from '@/lib/config-generator-engine';
import { resolveActionUpdate, validateActionPrecondition } from '@/lib/crud-action-helpers';

export function buildHandlers(entityName, spec) {
  return {
    customAction: async (user, action, id, data = {}) => {
      if (!id) throw new AppError('ID required for custom action', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const record = get(entityName, id);
      if (!record) throw NotFoundError(entityName, id);
      permissionService.requireActionPermission(user, spec, action, record, { operation: data.operation, fromStatus: record.status, toStatus: data.status || data.toStatus, ...data.context });
      if (action === 'upload_files') {
        const files = Array.isArray(data.files) ? data.files : [data.files];
        await executeHook(`upload_files:${entityName}:after`, { entity: entityName, id, data: { id, uploaded_files: files }, user });
        broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'upload_files', { id, uploaded_files: files });
        return ok({ id, uploaded_files: files });
      }
      if (action === 'manage_flags' && data.operation === 'apply') {
        const roles = getConfigEngineSync().getRoles();
        const managerRole = Object.keys(roles).find(r => roles[r].label === 'Manager') || 'manager';
        if (user.role === managerRole) {
          const updateData = { ...data, applied_by: user.id, applied_at: now() };
          await executeHook(`apply_flag:${entityName}:before`, { entity: entityName, id, data: updateData, user, record });
          update(entityName, id, updateData, user);
          const result = get(entityName, id);
          await executeHook(`apply_flag:${entityName}:after`, { entity: entityName, id, data: result, user });
          broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), 'apply_flag', permissionService.filterFields(user, spec, result));
          return ok(permissionService.filterFields(user, spec, result));
        }
      }
      if (action.startsWith('manage_collaborators') || action.startsWith('manage_highlights')) {
        if (!permissionService.checkOwnership(user, spec, record, action)) throw new AppError('Access denied: not owner', 'FORBIDDEN', HTTP.FORBIDDEN);
        return await buildHandlers(entityName, spec).update(user, id, data);
      }
      validateActionPrecondition(action, record);
      const updateData = resolveActionUpdate(action, data, user, record);
      const hookPrefix = action === 'resolve_highlight' ? 'resolve' : action === 'reopen_highlight' ? 'reopen' : action;
      await executeHook(`${hookPrefix}:${entityName}:before`, { entity: entityName, id, data: updateData, user, record });
      update(entityName, id, updateData, user);
      const result = get(entityName, id);
      await executeHook(`${hookPrefix}:${entityName}:after`, { entity: entityName, id, data: result, user });
      broadcastUpdate(API_ENDPOINTS.entityId(entityName, id), action, permissionService.filterFields(user, spec, result));
      return ok(permissionService.filterFields(user, spec, result));
    },

    list: async (user, request) => {
      await requirePermission(user, spec, 'list');
      const { q, page, pageSize, filters } = await parseQuery(request);
      const config = await (await import('@/lib/config-generator-engine')).getConfigEngine();
      const paginationCfg = config.getConfig()?.system?.pagination || { default_page_size: 50, max_page_size: 500 };
      const finalPage = page || 1;
      if (!Number.isInteger(finalPage) || finalPage < 1) throw new AppError('page must be >= 1', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const requestedPageSize = pageSize || (paginationCfg.default_page_size || 50);
      if (!Number.isInteger(requestedPageSize) || requestedPageSize < 1) throw new AppError('pageSize must be >= 1', 'BAD_REQUEST', HTTP.BAD_REQUEST);
      const finalPageSize = Math.min(requestedPageSize, paginationCfg.max_page_size || 500);
      if (q) {
        const { items, pagination } = await searchWithPagination(entityName, q, {}, page, finalPageSize);
        return paginated(permissionService.filterRecords(user, spec, items).map(i => permissionService.filterFields(user, spec, i)), pagination);
      }
      const coercedFilters = {};
      if (filters) for (const [key, value] of Object.entries(filters)) { const fd = spec.fields?.[key]; coercedFilters[key] = fd ? coerceFieldValue(value, fd.type) : value; }
      const { items, pagination } = await listWithPagination(entityName, coercedFilters, page, finalPageSize);
      return paginated(permissionService.filterRecords(user, spec, items).map(i => permissionService.filterFields(user, spec, i)), pagination);
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
        const resolvedState = spec.workflowDef?.states?.find(s => s.name === 'resolved');
        if (resolvedState?.readonly === true) throw new AppError('Cannot edit resolved highlight. Use reopen_highlight action first.', 'FORBIDDEN', HTTP.FORBIDDEN);
      }
      permissionService.enforceEditPermissions(user, spec, data);
      if (spec.workflow && spec.entityDef?.stages && prev.stage) {
        const locks = spec.entityDef.stages[prev.stage]?.locks || [];
        if (prev.stage === 'close_out') throw new AppError('CloseOut stage is read-only. No edits allowed.', 'FORBIDDEN', HTTP.FORBIDDEN);
        if (locks.includes('all')) throw new AppError(`Stage ${prev.stage} is locked. No edits allowed.`, 'FORBIDDEN', HTTP.FORBIDDEN);
        const attemptedLocked = locks.filter(l => l !== 'all').filter(f => f in data);
        if (attemptedLocked.length > 0) throw new AppError(`Stage ${prev.stage} has locked fields: ${attemptedLocked.join(', ')}`, 'FORBIDDEN', HTTP.FORBIDDEN);
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
      if (entityDef.immutable === true && entityDef.immutable_strategy === 'move_to_archive') {
        const archiveData = { archived: true, archived_at: now(), archived_by: user.id };
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
      return noContent();
    }
  };
}
