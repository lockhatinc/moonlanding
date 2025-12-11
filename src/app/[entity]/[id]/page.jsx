import { getSpec, getNavItems } from '@/specs';
import { get, can } from '@/engine';
import { getEntityData } from '@/lib/route-helpers';
import { EntityDetail } from '@/components/entity-detail';
import { ReviewDetail } from '@/components/domain';
import { Shell } from '@/components/layout';
import { deleteAction } from '../actions';

export default async function DetailPage({ params }) {
  const { entity, id } = await params;
  const { user, spec, data, children } = await getEntityData(entity, id);
  const boundDeleteAction = deleteAction.bind(null, entity, id);

  const DetailComp = spec.detail?.component === 'review-detail' ? ReviewDetail : EntityDetail;

  return (
    <Shell user={user} nav={getNavItems()}>
      <DetailComp spec={spec} data={data} children={children} user={user} canEdit={can(user, spec, 'edit')} canDelete={can(user, spec, 'delete')} deleteAction={boundDeleteAction} />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity, id } = await params;
  try { const spec = getSpec(entity), data = get(entity, id); return { title: data?.name || data?.email || spec.label }; } catch { return { title: 'Not Found' }; }
}
