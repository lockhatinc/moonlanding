import { getSpec, getNavItems } from '@/specs';
import { get, getChildren, getUser, can } from '@/engine';
import { redirect, notFound } from 'next/navigation';
import { EntityDetail } from '@/components/entity-detail';
import { ReviewDetail } from '@/components/domain';
import { Shell } from '@/components/layout';
import { deleteAction } from '../actions';

export default async function DetailPage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { entity, id } = await params;

  let spec;
  try { spec = getSpec(entity); } catch { notFound(); }

  if (spec.embedded) notFound();
  if (!can(user, spec, 'view')) redirect('/');

  const data = get(entity, id);
  if (!data) notFound();

  const children = {};
  if (spec.children) {
    for (const [key, childDef] of Object.entries(spec.children)) {
      children[key] = getChildren(entity, id, childDef);
    }
  }

  const boundDeleteAction = deleteAction.bind(null, entity, id);

  if (spec.detail?.component === 'review-detail') {
    return (
      <Shell user={user} nav={getNavItems()}>
        <ReviewDetail spec={spec} data={data} children={children} user={user} canEdit={can(user, spec, 'edit')} canDelete={can(user, spec, 'delete')} deleteAction={boundDeleteAction} />
      </Shell>
    );
  }

  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityDetail spec={spec} data={data} children={children} user={user} canEdit={can(user, spec, 'edit')} canDelete={can(user, spec, 'delete')} deleteAction={boundDeleteAction} />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity, id } = await params;
  try { const spec = getSpec(entity), data = get(entity, id); return { title: data?.name || data?.email || spec.label }; } catch { return { title: 'Not Found' }; }
}
