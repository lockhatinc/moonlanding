import { resolveRecipients, getEmailTemplate } from './email-config.js';

export const LIFECYCLE_ACTIONS = {
  notify: async (config, context) => {
    const message = config.message || `${context.entity} ${context.event}`;
    const title = config.title || 'Success';

    if (typeof window !== 'undefined') {
      const { showNotification } = await import('../lib/notification-helpers.js');
      showNotification.success(message, title);
    }
  },

  email: async (config, context) => {
    const recipients = await resolveLifecycleRecipients(config.recipients, context);
    if (!recipients || recipients.length === 0) return;

    try {
      const { sendEmail } = await import('../adapters/google-gmail.js');
      const emailData = getEmailTemplate(config.template, context);
      for (const recipient of recipients) {
        const to = typeof recipient === 'string' ? recipient : recipient.email;
        if (to) {
          await sendEmail({ to, ...emailData });
        }
      }
    } catch (err) {
      console.error('[LIFECYCLE] Email failed:', err.message);
    }
  },

  log: async (config, context) => {
    const level = config.level || 'info';
    const message = config.message || `${context.entity}.${context.event}`;
    console.log(`[LIFECYCLE:${level.toUpperCase()}] ${message}`, context.data);
  },

  webhook: async (config, context) => {
    if (!config.url) return;

    try {
      await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
    } catch (err) {
      console.error('[LIFECYCLE] Webhook failed:', err.message);
    }
  },
};

async function resolveLifecycleRecipients(recipientConfig, context) {
  const resolved = await resolveRecipients(recipientConfig, context);
  if (resolved && resolved.length > 0) {
    return resolved;
  }

  if (typeof recipientConfig === 'string') {
    if (recipientConfig.includes('@')) {
      return [recipientConfig];
    }

    if (context.record && context.record[recipientConfig]) {
      const fieldValue = context.record[recipientConfig];
      if (typeof fieldValue === 'string' && fieldValue.includes('@')) {
        return [fieldValue];
      }
    }
  }

  if (Array.isArray(recipientConfig)) {
    return recipientConfig.filter(r => typeof r === 'string' && r.includes('@'));
  }

  return [];
}

export async function executeLifecycleAction(action, context) {
  if (!action || !action.action) return;

  const handler = LIFECYCLE_ACTIONS[action.action];
  if (!handler) {
    console.error('[LIFECYCLE] Unknown action type:', action.action);
    return;
  }

  try {
    await handler(action, context);
  } catch (err) {
    console.error('[LIFECYCLE] Action execution failed:', err.message);
  }
}

export async function executeLifecycleEvent(spec, event, context) {
  if (!spec.lifecycle || !spec.lifecycle[event]) return;

  const actions = Array.isArray(spec.lifecycle[event])
    ? spec.lifecycle[event]
    : [spec.lifecycle[event]];

  for (const action of actions) {
    await executeLifecycleAction(action, { ...context, entity: spec.name, event });
  }
}
