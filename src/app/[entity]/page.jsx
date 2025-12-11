import { getSpec, getNavItems } from '@/specs';
import { list, search, can } from '@/engine';
import { requireEntityAccess, generateEntityMetadata } from '@/lib/route-helpers';
import { EntityList } from '@/components/entity-list';
import { Shell } from '@/components/layout';

export default async function ListPage({ params, searchParams }) {
  const { entity } = await params;
  const { q } = await searchParams;
  const { user, spec } = await requireEntityAccess(entity, 'list');
  const data = q ? search(entity, q) : list(entity);

  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityList spec={spec} data={data} searchQuery={q || ''} canCreate={can(user, spec, 'create')} />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity } = await params;
  try { return { title: getSpec(entity).labelPlural }; } catch { return { title: 'Not Found' }; }
}
