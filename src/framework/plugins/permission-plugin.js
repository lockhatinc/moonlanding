import { BaseService } from '../base-plugin';

export class PermissionPlugin extends BaseService {
  constructor() {
    super('permission', '1.0.0');
    this.rules = new Map();
    this.roles = new Map();
    this.metadata = {
      description: 'Permission and authorization rule engine',
      dependencies: [],
      category: 'security',
    };
  }

  defineRole(role, permissions = []) {
    this.roles.set(role, new Set(permissions));
    return this;
  }

  addPermissionToRole(role, permission) {
    if (!this.roles.has(role)) {
      this.roles.set(role, new Set());
    }
    this.roles.get(role).add(permission);
    return this;
  }

  removePermissionFromRole(role, permission) {
    if (this.roles.has(role)) {
      this.roles.get(role).delete(permission);
    }
    return this;
  }

  registerRule(name, evaluator) {
    this.rules.set(name, evaluator);
    return this;
  }

  hasPermission(user, permission) {
    const userRole = user.role || 'guest';
    const rolePerms = this.roles.get(userRole);
    if (!rolePerms) return false;
    return rolePerms.has(permission);
  }

  canAccess(user, resource, action) {
    const permission = `${resource}:${action}`;
    return this.hasPermission(user, permission);
  }

  evaluate(user, rule, context = {}) {
    const evaluator = this.rules.get(rule);
    if (!evaluator) {
      console.warn(`[PermissionPlugin] Rule ${rule} not found`);
      return false;
    }
    try {
      return evaluator(user, context);
    } catch (error) {
      console.error(`[PermissionPlugin] Rule ${rule} error:`, error);
      this.stats.errors++;
      return false;
    }
  }

  getRolePermissions(role) {
    return Array.from(this.roles.get(role) || []);
  }

  getAllRoles() {
    return Array.from(this.roles.keys());
  }

  listRules() {
    return Array.from(this.rules.keys());
  }

  export() {
    const exported = {};
    for (const [role, perms] of this.roles) {
      exported[role] = Array.from(perms);
    }
    return exported;
  }
}
