// Authentication and spec helpers - consolidates repeated auth patterns
// Eliminates duplication of getSpec + getUser + can(user, spec, action) across routes and actions

import { getSpec } from '@/config';
import { getUser, requireUser, can, check } from '@/engine.server';

export class SpecError extends Error {
  constructor(entity) {
    super(`Unknown entity: ${entity}`);
    this.code = 'UNKNOWN_ENTITY';
  }
}

export async function withSpec(entity) {
  try {
    return getSpec(entity);
  } catch (e) {
    throw new SpecError(entity);
  }
}

export async function withUser() {
  return await getUser();
}

export async function withRequiredUser() {
  return await requireUser();
}

export async function withSpecAndUser(entity, action = null) {
  const spec = await withSpec(entity);
  const user = await withUser();

  if (action && user && !can(user, spec, action)) {
    throw new Error(`Permission denied: ${entity}.${action}`);
  }

  return { spec, user };
}

export async function withRequiredSpecAndUser(entity, action = null) {
  const spec = await withSpec(entity);
  const user = await withRequiredUser();

  if (action) {
    check(user, spec, action);
  }

  return { spec, user };
}

export async function requireEntityAccess(entity, action) {
  const { spec, user } = await withRequiredSpecAndUser(entity, action);
  return { spec, user };
}

export async function validateEntityAction(entity, action) {
  const { spec, user } = await withRequiredSpecAndUser(entity, action);
  return { spec, user };
}
