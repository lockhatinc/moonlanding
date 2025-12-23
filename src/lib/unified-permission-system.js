export class UnifiedPermissionSystem {
  constructor(config = {}) {
    this.permissionSystem = config.permissionSystem || {};
    this.roleActionMatrix = config.roleActionMatrix || {};
    this.permissionMiddleware = config.permissionMiddleware || {};
    this.cache = new Map();
    this.cacheConfig = this.permissionMiddleware.caching || { enabled: false, ttl: 300000, maxSize: 1000 };
  }

  async checkPermission(user, spec, action, options = {}) {
    const cacheKey = `${user?.id}|${spec?.name}|${action}|${options.field || ''}`;

    if (this.cacheConfig.enabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheConfig.ttl) {
        return cached.result;
      }
      this.cache.delete(cacheKey);
    }

    const context = { user, spec, action, options, allowed: false };

    for (const middleware of this.getMiddlewareStack(spec.name)) {
      const result = await this.executeMiddleware(middleware.name, context);
      if (!result && middleware.critical) {
        const result_cached = false;
        this.cachePermission(cacheKey, result_cached);
        return false;
      }
      context.allowed = context.allowed || result;
    }

    this.cachePermission(cacheKey, context.allowed);
    return context.allowed;
  }

  getActionsForRole(role, entity) {
    return this.roleActionMatrix[role]?.[entity] || [];
  }

  canAccessField(user, spec, field, action) {
    const canAccessEntity = this.roleActionMatrix[user.role]?.[spec.name]?.includes(action);
    if (!canAccessEntity) return false;

    const fieldPermissions = spec.fieldPermissions?.[field];
    if (!fieldPermissions) return true;

    if (typeof fieldPermissions[action] === 'string') {
      return fieldPermissions[action] === 'all' || fieldPermissions[action].includes(user.role);
    }

    return Array.isArray(fieldPermissions[action])
      ? fieldPermissions[action].includes(user.role)
      : fieldPermissions[action];
  }

  canAccessRow(user, spec, record) {
    const rowAccessConfig = spec.rowAccess;
    if (!rowAccessConfig) return true;

    switch (rowAccessConfig.scope) {
      case 'team':
        return user.team_id === record.team_id;
      case 'assigned':
        return user.id === record.assigned_to;
      case 'assigned_or_team':
        return user.id === record.assigned_to || user.team_id === record.team_id;
      case 'client':
        return user.client_id === record.client_id;
      case 'all':
        return true;
      default:
        return false;
    }
  }

  cachePermission(key, result) {
    if (this.cacheConfig.enabled && this.cache.size < this.cacheConfig.maxSize) {
      this.cache.set(key, { result, timestamp: Date.now() });
    }
  }

  getMiddlewareStack(entityName) {
    return this.permissionMiddleware.customStacks[entityName]
      || this.permissionMiddleware.standardStack;
  }

  async executeMiddleware(name, context) {
    const handlers = {
      authentication: () => !!context.user?.id,
      roleValidation: () => !!this.permissionSystem.roles[context.user?.role],
      actionAuthorization: () => {
        const actions = this.roleActionMatrix[context.user.role]?.[context.spec.name] || [];
        return actions.includes(context.action);
      },
      rowLevelAccess: () => this.canAccessRow(context.user, context.spec, context.record || {}),
      fieldLevelAccess: () => context.field ? this.canAccessField(context.user, context.spec, context.field, context.action) : true,
      businessRuleValidation: () => true
    };

    return (handlers[name] || (() => true))();
  }

  clearCache() {
    this.cache.clear();
  }
}

export default UnifiedPermissionSystem;
