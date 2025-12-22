export const ENTITY_LIFECYCLE_HOOKS = {
  engagement: {
    afterCreate: [
      {
        type: 'email',
        template: 'engagement_info_gathering',
        recipients: 'client_users',
        async: true,
      },
      {
        type: 'audit',
        action: 'create',
      },
    ],
    afterUpdate: [
      {
        type: 'email',
        field: 'stage',
        when: 'changed',
        template: 'stage_transition_notification',
        recipients: 'assigned_team',
        async: true,
      },
      {
        type: 'audit',
        action: 'update',
      },
    ],
    afterDelete: [
      {
        type: 'audit',
        action: 'delete',
      },
    ],
    beforeStatusChange: [
      {
        type: 'validate',
        rule: 'can_transition',
      },
    ],
  },

  review: {
    afterCreate: [
      {
        type: 'email',
        template: 'review_started_notification',
        recipients: 'engagement_assigned',
        async: true,
      },
      {
        type: 'audit',
        action: 'create',
      },
    ],
    afterUpdate: [
      {
        type: 'email',
        field: 'status',
        when: 'completed',
        template: 'review_completion_notice',
        recipients: 'engagement_assigned',
        async: true,
      },
    ],
    afterDelete: [
      {
        type: 'audit',
        action: 'delete',
      },
    ],
  },

  highlight: {
    afterCreate: [
      {
        type: 'email',
        template: 'highlight_added_notification',
        recipients: 'review_assigned',
        async: false,
      },
      {
        type: 'audit',
        action: 'create',
      },
    ],
    afterUpdate: [
      {
        type: 'email',
        field: 'status',
        when: 'resolved',
        template: 'highlight_resolved_notification',
        recipients: 'review_assigned',
        async: true,
      },
    ],
  },

  rfi: {
    afterCreate: [
      {
        type: 'email',
        template: 'rfi_request_notification',
        recipients: 'client_users',
        async: true,
      },
      {
        type: 'audit',
        action: 'create',
      },
    ],
    afterUpdate: [
      {
        type: 'email',
        field: 'status',
        when: 'resolved',
        template: 'rfi_resolved_notification',
        recipients: 'client_users',
        async: true,
      },
    ],
  },
};

export function getLifecycleHooks(entityType, hookType) {
  return ENTITY_LIFECYCLE_HOOKS[entityType]?.[hookType] || [];
}

export function getEmailHooks(entityType) {
  const hooks = [];
  const entityHooks = ENTITY_LIFECYCLE_HOOKS[entityType] || {};
  for (const [hookType, handlers] of Object.entries(entityHooks)) {
    handlers
      .filter(h => h.type === 'email')
      .forEach(h => {
        hooks.push({ hookType, ...h });
      });
  }
  return hooks;
}

export function getAuditHooks(entityType) {
  const hooks = [];
  const entityHooks = ENTITY_LIFECYCLE_HOOKS[entityType] || {};
  for (const [hookType, handlers] of Object.entries(entityHooks)) {
    handlers
      .filter(h => h.type === 'audit')
      .forEach(h => {
        hooks.push({ hookType, ...h });
      });
  }
  return hooks;
}

export function shouldTriggerHook(entityType, hookType, data = {}) {
  const hooks = getLifecycleHooks(entityType, hookType);
  return hooks.length > 0;
}
