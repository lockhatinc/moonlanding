import { getSpec, getNavItems } from '@/engine/spec';
import { list } from '@/engine/crud';
import { getUser, can } from '@/engine/auth';
import { redirect, notFound } from 'next/navigation';
import { EntityForm } from '@/components/entity-form';
import { Shell } from '@/components/layout/shell';
import { createAction } from '../actions';

async function loadOptions(spec) {
  const options = {};

  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.ref) {
      try {
        const items = list(field.ref);
        options[key] = items.map(r => ({
          value: r.id,
          label: r.name || r.email || r.id,
        }));
      } catch {
        options[key] = [];
      }
    }
  }

  return options;
}

export default async function NewPage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { entity } = await params;

  let spec;
  try {
    spec = getSpec(entity);
  } catch {
    notFound();
  }

  if (spec.embedded) notFound();
  if (!can(user, spec, 'create')) redirect(`/${entity}`);

  const options = await loadOptions(spec);

  const actionWithEntity = createAction.bind(null, entity);

  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityForm
        spec={spec}
        options={options}
        action={actionWithEntity}
      />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity } = await params;
  try {
    const spec = getSpec(entity);
    return { title: `New ${spec.label}` };
  } catch {
    return { title: 'Not Found' };
  }
}
