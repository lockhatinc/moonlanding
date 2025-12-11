import { getSpec, getNavItems } from '@/specs';
import { getFormContext } from '@/lib/route-helpers';
import { EntityForm } from '@/components/entity-form';
import { Shell } from '@/components/layout';
import { createAction } from '../actions';

export default async function NewPage({ params }) {
  const { entity } = await params;
  const { user, spec, options } = await getFormContext(entity, null, 'create');

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
