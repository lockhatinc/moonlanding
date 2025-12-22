import { EMAIL_TEMPLATES } from './email-templates.js';

export const EMAIL_DEFAULTS = {
  from: process.env.EMAIL_FROM || process.env.GMAIL_SENDER_EMAIL || 'noreply@example.com',
  replyTo: process.env.EMAIL_FROM || process.env.GMAIL_SENDER_EMAIL || 'noreply@example.com',
  retryCount: 3,
  retryDelay: 1000,
};

export const RECIPIENT_RESOLVERS = {
  assigned_to: (context) => {
    const recipient = context.record?.assigned_to;
    return recipient ? [recipient] : [];
  },
  created_by: (context) => {
    const recipient = context.record?.created_by;
    return recipient ? [recipient] : [];
  },
  team_members: async () => [],
  team_partners: async () => [],
  partners: async () => [],
  client_users: async () => [],
  client_admin: async () => [],
  collaborator: (context) => {
    const { collaborator } = context;
    return collaborator?.email ? [collaborator] : (collaborator?.user_id ? [] : []);
  },
  assigned_users: (context) => {
    const { rfi } = context;
    return rfi?.assigned_to ? [rfi.assigned_to] : [];
  },
  user: (context) => context.user ? [context.user] : [],
  new_client_user: (context) => context.user ? [context.user] : [],
  static: (context, emails = []) => emails,
};

export function resolveRecipients(resolver, context) {
  if (typeof resolver === 'string' && RECIPIENT_RESOLVERS[resolver]) {
    return RECIPIENT_RESOLVERS[resolver](context);
  }
  if (typeof resolver === 'function') {
    return resolver(context);
  }
  return Array.isArray(resolver) ? resolver : [];
}

export function getEmailTemplate(templateName, context) {
  const template = EMAIL_TEMPLATES[templateName];
  if (!template) throw new Error(`Unknown email template: ${templateName}`);
  return template(context);
}

export { EMAIL_TEMPLATES } from './email-templates.js';
