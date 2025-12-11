import { getNavItems } from '@/specs';
import { getFormContext, editMetadata } from '@/lib/route-helpers';
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
  return editMetadata(entity, id);
}
