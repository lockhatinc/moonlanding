import { create, update, remove, get } from '@/engine';
import { can } from '@/lib/permissions';
import { getUser } from '@/engine.server';

export function generateCRUDActions(spec) {
  return {
    create: async (data) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');
      if (!can(user, spec, 'create')) throw new Error('Permission denied');
      return create(spec.name, data, user);
    },

    update: async (id, data) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');
      if (!can(user, spec, 'edit')) throw new Error('Permission denied');

      const prev = get(spec.name, id);
      if (!prev) throw new Error('Not found');

      update(spec.name, id, data, user);
      return get(spec.name, id);
    },

    delete: async (id) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');
      if (!can(user, spec, 'delete')) throw new Error('Permission denied');

      const record = get(spec.name, id);
      if (!record) throw new Error('Not found');

      remove(spec.name, id);
      return { success: true };
    },
  };
}

export function generateWorkflowActions(spec, workflow) {
  const actions = {};

  for (const [stageName, transition] of Object.entries(workflow.transitions)) {
    const camelCase = stageName.charAt(0).toUpperCase() + stageName.slice(1);
    const actionName = `moveTo${camelCase}`;

    actions[actionName] = async (id, context = {}) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      if (transition.requires?.length && !transition.requires.includes(user.role)) {
        throw new Error(`Permission denied: requires ${transition.requires.join(' or ')}`);
      }

      const record = get(spec.name, id);
      if (!record) throw new Error('Not found');

      if (transition.validation?.length) {
        const errors = transition.validation.map(validator => {
          if (typeof validator === 'function') {
            return validator(record);
          }
          return null;
        }).filter(Boolean);

        if (errors.length) {
          throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
      }

      update(spec.name, id, { stage: stageName }, user);
      return get(spec.name, id);
    };
  }

  return actions;
}

export function generateAllActions(spec, workflow = null) {
  const crudActions = generateCRUDActions(spec);
  const workflowActions = workflow ? generateWorkflowActions(spec, workflow) : {};
  const customActions = spec.actions || {};

  return {
    ...crudActions,
    ...workflowActions,
    ...customActions,
  };
}
