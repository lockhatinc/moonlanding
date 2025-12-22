import { BaseService } from '../base-plugin';

export class NotificationPlugin extends BaseService {
  constructor() {
    super('notification', '1.0.0');
    this.templates = new Map();
    this.queue = [];
    this.maxQueueSize = 100;
    this.metadata = {
      description: 'Centralized notification handling with templates and queue',
      dependencies: [],
      category: 'notifications',
    };
  }

  registerTemplate(name, template) {
    this.templates.set(name, template);
    return this;
  }

  getTemplate(name) {
    return this.templates.get(name);
  }

  notify(type, message, options = {}) {
    const notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
      options,
    };
    this.queue.push(notification);
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }
    this.stats.calls++;
    return notification.id;
  }

  success(message, options = {}) {
    return this.notify('success', message, options);
  }

  error(message, options = {}) {
    return this.notify('error', message, options);
  }

  warning(message, options = {}) {
    return this.notify('warning', message, options);
  }

  info(message, options = {}) {
    return this.notify('info', message, options);
  }

  getQueue() {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
    return this;
  }

  removeNotification(id) {
    const idx = this.queue.findIndex(n => n.id === id);
    if (idx > -1) this.queue.splice(idx, 1);
    return this;
  }

  getNotificationCount() {
    return this.queue.length;
  }
}
