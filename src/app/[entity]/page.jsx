import { getSpec, getNavItems } from '@/engine/spec';
import { list, search } from '@/engine/crud';
import { getUser, can } from '@/engine/auth';
import { redirect, notFound } from 'next/navigation';
import { EntityList } from '@/components/entity-list';
import { Shell } from '@/components/layout/shell';

export default async function ListPage({ params, searchParams }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { entity } = await params;
  const { q } = await searchParams;

  let spec;
  try {
    spec = getSpec(entity);
  } catch {
    notFound();
  }

  if (spec.embedded || spec.parent) notFound();
  if (!can(user, spec, 'list')) redirect('/');

  const searchQuery = q || '';
  const data = searchQuery ? search(entity, searchQuery) : list(entity);

  return (
    <Shell user={user} nav={getNavItems()}>
      <EntityList
        spec={spec}
        data={data}
        searchQuery={searchQuery}
        canCreate={can(user, spec, 'create')}
      />
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { entity } = await params;
  try {
    const spec = getSpec(entity);
    return { title: spec.labelPlural };
  } catch {
    return { title: 'Not Found' };
  }
}
