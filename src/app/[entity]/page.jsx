import { getNavItems } from '@/config';
import { list, search } from '@/engine';
import { can } from '@/lib/permissions';
import { requireEntityAccess, listMetadata } from '@/lib/route-helpers';
import { EntityList } from '@/components/entity-list';
import { Shell } from '@/components/layout';

export default async function ListPage({ params, searchParams }) {
  const { entity } = await params;
  const { q } = await searchParams;
  const { user, spec } = await requireEntityAccess(entity, 'list');

  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityList spec={spec} data={q ? search(entity, q) : list(entity)} searchQuery={q || ''} canCreate={can(user, spec, 'create')} />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  return listMetadata((await params).entity);
}
