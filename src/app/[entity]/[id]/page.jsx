import { getNavItems } from '@/specs';
import { can } from '@/engine';
import { getEntityData, detailMetadata } from '@/lib/route-helpers';
import { EntityDetail } from '@/components/entity-detail';
import { ReviewDetail } from '@/components/domain';
import { Shell } from '@/components/layout';
import { deleteAction } from '../actions';

export default async function DetailPage({ params }) {
  const { entity, id } = await params;
  const { user, spec, data, children } = await getEntityData(entity, id);
  const DetailComp = spec.detail?.component === 'review-detail' ? ReviewDetail : EntityDetail;

  return (
    <Shell user={user} nav={getNavItems()}>
      <DetailComp spec={spec} data={data} children={children} user={user} canEdit={can(user, spec, 'edit')} canDelete={can(user, spec, 'delete')} deleteAction={deleteAction.bind(null, entity, id)} />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity, id } = await params;
  return detailMetadata(entity, id);
}
