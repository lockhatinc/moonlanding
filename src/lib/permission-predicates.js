export class PermissionBuilder {
  constructor(user, spec) {
    this.user = user;
    this.spec = spec;
    this.predicates = [];
  }

  can(action) {
    this.predicates.push({ type: 'action', value: action });
    return this;
  }

  view(fieldOrScope = '*') {
    this.predicates.push({ type: 'action', value: 'view' });
    if (fieldOrScope !== '*') this.predicates.push({ type: 'scope', value: fieldOrScope });
    return this;
  }

  edit(fieldOrScope = '*') {
    this.predicates.push({ type: 'action', value: 'edit' });
    if (fieldOrScope !== '*') this.predicates.push({ type: 'scope', value: fieldOrScope });
    return this;
  }

  delete(fieldOrScope = '*') {
    this.predicates.push({ type: 'action', value: 'delete' });
    if (fieldOrScope !== '*') this.predicates.push({ type: 'scope', value: fieldOrScope });
    return this;
  }

  create() {
    this.predicates.push({ type: 'action', value: 'create' });
    return this;
  }

  inRole(...roles) {
    this.predicates.push({ type: 'role', values: roles });
    return this;
  }

  withAccess(accessLevel) {
    this.predicates.push({ type: 'access', value: accessLevel });
    return this;
  }

  evaluate() {
    for (const predicate of this.predicates) {
      if (predicate.type === 'action') {
        const hasAccess = this.spec.access?.[this.user.role]?.includes(predicate.value);
        if (!hasAccess) return false;
      }
      if (predicate.type === 'role') {
        if (!predicate.values.includes(this.user.role)) return false;
      }
      if (predicate.type === 'access') {
        const userAccess = this.spec.access?.[this.user.role];
        if (!userAccess || userAccess.length === 0) return false;
      }
      if (predicate.type === 'scope') {
        const scope = this.user.scope || [];
        if (!scope.includes(predicate.value)) return false;
      }
    }
    return true;
  }
}

export function permission(user, spec) {
  return new PermissionBuilder(user, spec);
}
