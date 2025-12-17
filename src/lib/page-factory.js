import { getNavItems } from '@/config';
import { list, search, get, getChildren, listWithPagination } from '@/engine';
import { can } from '@/lib/permissions';
import { loadOptions } from '@/lib/form-utils';
import { requireEntityAccess, listMetadata, detailMetadata, newMetadata, editMetadata } from '@/lib/route-helpers';
import { ListBuilder } from '@/components/builders/list-builder';
import { FormBuilder } from '@/components/builders/form-builder';
import { EntityDetail } from '@/components/entity-detail';
import { Shell } from '@/components/layout';
import { notFound, redirect } from 'next/navigation';
import { deleteAction } from '@/app/[entity]/actions';

export function createListPage() {
  const ListPage = async ({ params, searchParams }) => {
    const { entity } = await params;
    const { q, page: pageParam, pageSize: pageSizeParam } = await searchParams;
    const { user, spec } = await requireEntityAccess(entity, 'list');

    const page = Math.max(1, parseInt(pageParam || '1'));
    const pageSize = parseInt(pageSizeParam || String(spec.list?.pageSize || 20));

    let data, pagination;
    if (q) {
      data = search(entity, q);
      pagination = null;
    } else {
      const result = listWithPagination(entity, {}, page, pageSize);
      data = result.items;
      pagination = result.pagination;
    }

    return (
      <Shell user={user} nav={getNavItems()}>
        <ListBuilder
          spec={spec}
          data={data}
          searchQuery={q || ''}
          canCreate={can(user, spec, 'create')}
          pagination={pagination}
        />
      </Shell>
    );
  };

  ListPage.generateMetadata = ({ params }) => listMetadata(params.entity);
  return ListPage;
}

export function createDetailPage(DetailComponent = null) {
  const DetailPage = async ({ params }) => {
    const { entity, id } = await params;
    const { user, spec } = await requireEntityAccess(entity, 'view');

    const data = get(entity, id);
    if (!data) notFound();

    const children = {};
    if (spec.children) {
      for (const [key, childDef] of Object.entries(spec.children)) {
        children[key] = getChildren(entity, id, childDef);
      }
    }

    const Comp = DetailComponent || (spec.detail?.component === 'review-detail' ? (await import('@/components/domain')).ReviewDetail : EntityDetail);

    return (
      <Shell user={user} nav={getNavItems()}>
        <Comp
          spec={spec}
          data={data}
          children={children}
          user={user}
          canEdit={can(user, spec, 'edit')}
          canDelete={can(user, spec, 'delete')}
          deleteAction={deleteAction.bind(null, entity, id)}
        />
      </Shell>
    );
  };

  DetailPage.generateMetadata = ({ params }) => detailMetadata(params.entity, params.id);
  return DetailPage;
}

export function createCreatePage() {
  const CreatePage = async ({ params }) => {
    const { entity } = await params;
    const { user, spec } = await requireEntityAccess(entity, 'create');
    const options = await loadOptions(spec);

    return (
      <Shell user={user} nav={getNavItems()}>
        <FormBuilder spec={spec} options={options} />
      </Shell>
    );
  };

  CreatePage.generateMetadata = ({ params }) => newMetadata(params.entity);
  return CreatePage;
}

export function createEditPage() {
  const EditPage = async ({ params }) => {
    const { entity, id } = await params;
    const { user, spec } = await requireEntityAccess(entity, 'edit');

    const data = get(entity, id);
    if (!data) notFound();

    const options = await loadOptions(spec);

    return (
      <Shell user={user} nav={getNavItems()}>
        <FormBuilder spec={spec} data={data} options={options} />
      </Shell>
    );
  };

  EditPage.generateMetadata = ({ params }) => editMetadata(params.entity, params.id);
  return EditPage;
}
