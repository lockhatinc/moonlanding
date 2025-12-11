import { getSpec, getNavItems } from '@/specs';
import { getUser, can } from '@/engine';
import { redirect, notFound } from 'next/navigation';
import { EntityForm } from '@/components/entity-form';
import { Shell } from '@/components/layout';
import { createAction } from '../actions';
import { loadOptions } from '@/lib/form-utils';

export default async function NewPage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { entity } = await params;

  let spec;
  try { spec = getSpec(entity); } catch { notFound(); }

  if (spec.embedded) notFound();
  if (!can(user, spec, 'create')) redirect(`/${entity}`);

  const options = await loadOptions(spec);

  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityForm spec={spec} options={options} action={createAction.bind(null, entity)} />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity } = await params;
  try { return { title: `New ${getSpec(entity).label}` }; } catch { return { title: 'Not Found' }; }
}
