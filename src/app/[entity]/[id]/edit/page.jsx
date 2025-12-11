import { getSpec, getNavItems } from '@/specs';
import { get, getUser, can } from '@/engine';
import { redirect, notFound } from 'next/navigation';
import { EntityForm } from '@/components/entity-form';
import { Shell } from '@/components/layout';
import { updateAction } from '../../actions';
import { loadOptions } from '@/lib/form-utils';

export default async function EditPage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { entity, id } = await params;

  let spec;
  try { spec = getSpec(entity); } catch { notFound(); }

  if (spec.embedded) notFound();
  if (!can(user, spec, 'edit')) redirect(`/${entity}/${id}`);

  const data = get(entity, id);
  if (!data) notFound();

  const options = await loadOptions(spec);

  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityForm spec={spec} data={data} options={options} action={updateAction.bind(null, entity, id)} />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity, id } = await params;
  try { const spec = getSpec(entity), data = get(entity, id); return { title: `Edit ${data?.name || spec.label}` }; } catch { return { title: 'Not Found' }; }
}
