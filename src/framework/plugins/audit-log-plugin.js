import { BaseService } from '../base-plugin';

export class AuditLogPlugin extends BaseService {
  constructor() {
    super('audit-log', '1.0.0');
    this.logs = [];
    this.maxLogs = 10000;
    this.filters = new Map();
    this.metadata = {
      description: 'Audit trail tracking for entity operations and changes',
      dependencies: [],
      category: 'auditing',
    };
  }

  log(action, entity, details = {}) {
    const entry = {
      id: `audit-${Date.now()}-${Math.random()}`,
      action,
      entity,
      details,
      timestamp: Date.now(),
      userId: details.userId || 'system',
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    this.stats.calls++;
    return entry.id;
  }

  create(entity, data, userId) {
    return this.log('create', entity, { userId, data });
  }

  update(entity, id, changes, userId) {
    return this.log('update', entity, { userId, entityId: id, changes });
  }

  delete(entity, id, userId) {
    return this.log('delete', entity, { userId, entityId: id });
  }

  view(entity, id, userId) {
    return this.log('view', entity, { userId, entityId: id });
  }

  getLogs(filter = {}) {
    let results = [...this.logs];
    if (filter.entity) {
      results = results.filter(l => l.entity === filter.entity);
    }
    if (filter.action) {
      results = results.filter(l => l.action === filter.action);
    }
    if (filter.userId) {
      results = results.filter(l => l.userId === filter.userId);
    }
    if (filter.after) {
      results = results.filter(l => l.timestamp >= filter.after);
    }
    if (filter.limit) {
      results = results.slice(-filter.limit);
    }
    return results;
  }

  clearLogs() {
    this.logs = [];
    return this;
  }

  getLogCount() {
    return this.logs.length;
  }

  export(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }
    return this.logs;
  }
}
