import { CACHE } from '@/config/auth-config';
import { ERROR_MESSAGES } from '@/config';

class PermissionService {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, createdAt: Date.now() };
    this.CACHE_TTL = CACHE.ttl;
  }

  getCacheKey(user, spec, action, field = null) {
    return `${user?.id}|${spec?.name}|${action}|${field || ''}`;
  }

  clearCache() {
    this.cache.clear();
    this.stats.createdAt = Date.now();
  }

  getCacheStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
      : '0%';
    return { ...this.stats, size: this.cache.size, hitRate };
  }

  checkAccess(user, spec, action, options = {}) {
    if (!user) return false;
    if (options.noCache) return this.checkPermission(user, spec, action);
    const key = this.getCacheKey(user, spec, action);
    if (Date.now() - this.stats.createdAt > this.CACHE_TTL) this.clearCache();
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      this.stats.hits++;
      return cached;
    }
    this.stats.misses++;
    const result = this.checkPermission(user, spec, action);
    this.cache.set(key, result);
    return result;
  }

  checkFieldAccess(user, spec, fieldName, action) {
    if (!user) return false;
    const perm = spec.fieldPermissions?.[fieldName];
    if (!perm) return true;
    const allowed = perm[action];
    if (allowed === 'all') return true;
    if (Array.isArray(allowed)) return allowed.includes(user.role);
    return false;
  }

  checkRowAccess(user, spec, record) {
    if (!user) return false;
    if (!spec.rowAccess) return true;
    const rowPerm = spec.rowAccess;
    if (rowPerm.scope === 'team' && record.team_id && user.team_id && record.team_id !== user.team_id) return false;
    if (rowPerm.scope === 'assigned' && record.assigned_to && record.assigned_to !== user.id && user.role !== 'partner') return false;
    if (rowPerm.scope === 'assigned_or_team' && user.role !== 'partner') {
      const assignedCheck = !record.assigned_to || record.assigned_to === user.id;
      const teamCheck = !record.team_id || (user.team_id && record.team_id === user.team_id);
      if (!assignedCheck && !teamCheck) return false;
    }
    if (rowPerm.scope === 'client' && record.client_id && user.client_ids && !user.client_ids.includes(record.client_id)) return false;
    return true;
  }

  checkPermission(user, spec, action) {
    if (!user) return false;
    return !spec.access?.[action] || spec.access[action].includes(user.role);
  }

  filterRecords(user, spec, records) {
    if (!user || !Array.isArray(records)) return records;
    return records.filter(r => this.checkRowAccess(user, spec, r));
  }

  filterFields(user, spec, record) {
    if (!user) return record;
    const filtered = {};
    for (const [key, value] of Object.entries(record)) {
      if (this.checkFieldAccess(user, spec, key, 'view')) filtered[key] = value;
    }
    return filtered;
  }

  enforceEditPermissions(user, spec, data) {
    if (!user) throw new Error(ERROR_MESSAGES.permissionDenied(`${spec.name}.edit`));
    if (!this.checkAccess(user, spec, 'edit')) throw new Error(ERROR_MESSAGES.permissionDenied(`${spec.name}.edit`));
    for (const field of Object.keys(data)) {
      if (!this.checkFieldAccess(user, spec, field, 'edit')) {
        throw new Error(ERROR_MESSAGES.permissionDenied(`${spec.name}.${field}`));
      }
    }
  }

  canTransition(user, spec, fromStatus, toStatus) {
    if (!user) return false;
    if (!this.checkAccess(user, spec, 'edit')) return false;
    const transitions = spec.transitions?.[fromStatus];
    return Array.isArray(transitions) && transitions.includes(toStatus);
  }

  getAvailableActions(user, spec, record) {
    if (!user) return [];
    const actions = ['view'];
    if (this.checkAccess(user, spec, 'edit') && this.checkRowAccess(user, spec, record)) actions.push('edit');
    if (this.checkAccess(user, spec, 'delete') && this.checkRowAccess(user, spec, record)) actions.push('delete');
    return actions;
  }
}

export const permissionService = new PermissionService();
