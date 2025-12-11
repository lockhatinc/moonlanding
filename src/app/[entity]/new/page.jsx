import { getSpec, getNavItems } from '@/specs';
import { list, getUser, can } from '@/engine';
import { redirect, notFound } from 'next/navigation';
import { EntityForm } from '@/components/entity-form';
import { Shell } from '@/components/layout';
import { createAction } from '../actions';

async function loadOptions(spec) {
  const options = {};
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.ref) {
      try { options[key] = list(field.ref).map(r => ({ value: r.id, label: r.name || r.email || r.id })); }
      catch { options[key] = []; }
    }
  }
  return options;
}

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
