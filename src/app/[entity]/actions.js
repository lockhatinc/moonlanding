'use server';

import { create, update, remove, requireUser, check } from '@/engine';
import { getSpec } from '@/specs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createAction(entityName, formData) {
  const user = await requireUser();
  const spec = getSpec(entityName);
  check(user, spec, 'create');
  const result = create(entityName, Object.fromEntries(formData), user);
  revalidatePath(`/${entityName}`);
  redirect(`/${entityName}/${result.id}`);
}

export async function updateAction(entityName, id, formData) {
  const user = await requireUser();
  const spec = getSpec(entityName);
  check(user, spec, 'edit');
  update(entityName, id, Object.fromEntries(formData), user);
  revalidatePath(`/${entityName}/${id}`);
  redirect(`/${entityName}/${id}`);
}

export async function deleteAction(entityName, id) {
  const user = await requireUser();
  const spec = getSpec(entityName);
  check(user, spec, 'delete');
  remove(entityName, id);
  revalidatePath(`/${entityName}`);
  redirect(`/${entityName}`);
}
