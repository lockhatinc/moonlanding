import { getSpec, getNavItems } from '@/specs';
import { list, search, getUser, can } from '@/engine';
import { redirect, notFound } from 'next/navigation';
import { EntityList } from '@/components/entity-list';
import { Shell } from '@/components/layout';

export default async function ListPage({ params, searchParams }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { entity } = await params;
  const { q } = await searchParams;

  let spec;
  try { spec = getSpec(entity); } catch { notFound(); }

  if (spec.embedded || spec.parent) notFound();
  if (!can(user, spec, 'list')) redirect('/');

  const searchQuery = q || '';
  const data = searchQuery ? search(entity, searchQuery) : list(entity);

  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityList spec={spec} data={data} searchQuery={searchQuery} canCreate={can(user, spec, 'create')} />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity } = await params;
  try { return { title: getSpec(entity).labelPlural }; } catch { return { title: 'Not Found' }; }
}
