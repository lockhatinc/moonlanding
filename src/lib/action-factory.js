import { create, update, remove } from '@/engine';
import { requireUser, check } from '@/engine.server';
import { getSpec } from '@/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

export function createCRUDActions(entityName) {
  return {
    async create(formData) {
      try {
        const user = await requireUser();
        const spec = getSpec(entityName);
        check(user, spec, 'create');
        const result = create(entityName, Object.fromEntries(formData), user);
        revalidatePath(`/${entityName}`);
        redirect(`/${entityName}/${result.id}`);
      } catch (e) {
        logger.apiError('create', entityName, e);
        throw e;
      }
    },

    async update(id, formData) {
      try {
        const user = await requireUser();
        const spec = getSpec(entityName);
        check(user, spec, 'edit');
        update(entityName, id, Object.fromEntries(formData), user);
        revalidatePath(`/${entityName}/${id}`);
        redirect(`/${entityName}/${id}`);
      } catch (e) {
        logger.apiError('update', entityName, e);
        throw e;
      }
    },

    async delete(id) {
      try {
        const user = await requireUser();
        const spec = getSpec(entityName);
        check(user, spec, 'delete');
        remove(entityName, id);
        revalidatePath(`/${entityName}`);
        redirect(`/${entityName}`);
      } catch (e) {
        logger.apiError('delete', entityName, e);
        throw e;
      }
    },
  };
}

export function createEntityAction(entityName, actionKey, permission, handler) {
  return async function (...args) {
    try {
      const user = await requireUser();
      const spec = getSpec(entityName);
      check(user, spec, permission);
      return await handler(user, spec, ...args);
    } catch (e) {
      logger.apiError(actionKey, entityName, e);
      throw e;
    }
  };
}
