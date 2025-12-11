'use server';

import { create, update, remove } from '@/engine/crud';
import { getSpec } from '@/engine/spec';
import { requireUser, check } from '@/engine/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createAction(entityName, formData) {
  const user = await requireUser();
  const spec = getSpec(entityName);
  check(user, spec, 'create');

  const data = Object.fromEntries(formData);
  const result = create(entityName, data, user);

  revalidatePath(`/${entityName}`);
  redirect(`/${entityName}/${result.id}`);
}

export async function updateAction(entityName, id, formData) {
  const user = await requireUser();
  const spec = getSpec(entityName);
  check(user, spec, 'edit');

  const data = Object.fromEntries(formData);
  update(entityName, id, data, user);

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
