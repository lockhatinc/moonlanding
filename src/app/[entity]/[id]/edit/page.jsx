import { getSpec, getNavItems } from '@/specs';
import { get } from '@/engine';
import { getFormContext } from '@/lib/route-helpers';
import { EntityForm } from '@/components/entity-form';
import { Shell } from '@/components/layout';
import { updateAction } from '../../actions';

export default async function EditPage({ params }) {
  const { entity, id } = await params;
  const { user, spec, data, options } = await getFormContext(entity, id, 'edit');

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
