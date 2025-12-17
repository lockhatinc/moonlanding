const DEFAULT_TEMPLATES = {
  'entity.created': (spec, data) => ({
    subject: `New ${spec.label} created: ${data.title || data.name}`,
    body: `A new ${spec.label} has been created.\n\nTitle: ${data.title || data.name}\nCreated: ${new Date().toLocaleDateString()}`,
  }),

  'entity.updated': (spec, data, changes) => ({
    subject: `${spec.label} updated: ${data.title || data.name}`,
    body: `A ${spec.label} has been updated.\n\nTitle: ${data.title || data.name}\nChanged fields: ${Object.keys(changes).join(', ')}\nUpdated: ${new Date().toLocaleDateString()}`,
  }),

  'entity.deleted': (spec, data) => ({
    subject: `${spec.label} deleted: ${data.title || data.name}`,
    body: `A ${spec.label} has been deleted.\n\nTitle: ${data.title || data.name}\nDeleted: ${new Date().toLocaleDateString()}`,
  }),

  'workflow.transitioned': (spec, fromStage, toStage, data) => ({
    subject: `${spec.label} status changed: ${toStage}`,
    body: `A ${spec.label} status has changed.\n\nTitle: ${data.title || data.name}\nFrom: ${fromStage}\nTo: ${toStage}\nUpdated: ${new Date().toLocaleDateString()}`,
  }),

  'user.invited': (appName, inviteLink, email) => ({
    subject: `You're invited to ${appName}`,
    body: `You've been invited to join ${appName}.\n\nClick here to accept: ${inviteLink}\n\nThis invitation expires in 7 days.`,
  }),
};

export class TemplateEngine {
  constructor() {
    this.templates = new Map(Object.entries(DEFAULT_TEMPLATES));
    this.customTemplates = new Map();
  }

  register(templateName, fn) {
    this.templates.set(templateName, fn);
    return this;
  }

  registerCustom(templateName, template) {
    this.customTemplates.set(templateName, template);
    return this;
  }

  render(templateName, ...args) {
    const custom = this.customTemplates.get(templateName);
    if (custom) {
      return typeof custom === 'function' ? custom(...args) : custom;
    }

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return template(...args);
  }

  async renderEntity(spec, action, data, changes = {}) {
    const templateName = `entity.${action}`;
    return this.render(templateName, spec, data, changes);
  }

  async renderWorkflow(spec, fromStage, toStage, data) {
    const templateName = 'workflow.transitioned';
    return this.render(templateName, spec, fromStage, toStage, data);
  }
}

export const templateEngine = new TemplateEngine();
