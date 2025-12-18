import { specs, getSpec } from '@/config';
import { list, search, get, getChildren, listWithPagination, create, update, remove } from '@/engine';
import { can } from '@/lib/permissions';
import { loadFormOptions } from '@/lib/utils';
import { withPageAuth } from '@/lib/auth-middleware';
import { createCrudHandlers } from '@/lib/crud-factory';
import { Entity } from '@/lib/entity-component';
import { EntityDetail } from '@/components/entity-detail';
import { Shell } from '@/components/layout';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { forwardRef } from 'react';
import { getNavItems } from '@/config';

const generatorCache = new Map();

const createMetadata = (type, entity, id = null) => {
  try {
    const spec = getSpec(entity), data = id ? get(entity, id) : null;
    const titles = { list: spec.labelPlural, detail: data?.name || data?.email || spec.label, new: `New ${spec.label}`, edit: `Edit ${data?.name || spec.label}` };
    return { title: titles[type] };
  } catch { return { title: 'Not Found' }; }
};

export class EntityGenerator {
  constructor(entityName, spec = null) {
    this.entityName = entityName;
    this.spec = spec || getSpec(entityName);
    const pages = this.generatePages();
    this.ListPage = pages.ListPage;
    this.DetailPage = pages.DetailPage;
    this.CreatePage = pages.CreatePage;
    this.EditPage = pages.EditPage;
    this.NewPage = pages.CreatePage;
  }

  generatePages() {
    const { entityName, spec } = this;
    const createPage = (accessType, renderer) => {
      const Page = async ({ params, searchParams }) => {
        const resolved = await params;
        const { user, spec: s } = await withPageAuth(resolved.entity || entityName, accessType);
        return renderer({ user, spec: s, params: resolved, searchParams: await searchParams });
      };
      return Page;
    };

    return {
      ListPage: Object.assign(createPage('list', async ({ user, spec, searchParams }) => {
        const { q, page: pageParam, pageSize: pageSizeParam } = searchParams;
        const page = Math.max(1, parseInt(pageParam || '1'));
        const pageSize = parseInt(pageSizeParam || String(spec.list?.pageSize || 20));
        const result = q ? { items: search(spec.name, q), pagination: null } : listWithPagination(spec.name, {}, page, pageSize);
        return <Shell user={user} nav={getNavItems()}><Entity spec={spec} data={result.items} mode="list" pagination={result.pagination} canCreate={can(user, spec, 'create')} /></Shell>;
      }), { generateMetadata: ({ params }) => createMetadata('list', params.entity) }),

      DetailPage: Object.assign(createPage('view', async ({ user, spec, params }) => {
        const data = get(spec.name, params.id);
        if (!data) notFound();
        const children = spec.children ? Object.fromEntries(await Promise.all(Object.entries(spec.children).map(async ([k, def]) => [k, getChildren(spec.name, params.id, def)]))) : {};
        const Comp = spec.detail?.component === 'review-detail' ? (await import('@/components/domain')).ReviewDetail : EntityDetail;
        return <Shell user={user} nav={getNavItems()}><Comp spec={spec} data={data} children={children} user={user} canEdit={can(user, spec, 'edit')} canDelete={can(user, spec, 'delete')} /></Shell>;
      }), { generateMetadata: ({ params }) => createMetadata('detail', params.entity, params.id) }),

      CreatePage: Object.assign(createPage('create', async ({ user, spec }) => {
        const options = await loadFormOptions(spec);
        return <Shell user={user} nav={getNavItems()}><Entity spec={spec} mode="create" options={options} /></Shell>;
      }), { generateMetadata: ({ params }) => createMetadata('new', params.entity) }),

      EditPage: Object.assign(createPage('edit', async ({ user, spec, params }) => {
        const data = get(spec.name, params.id);
        if (!data) notFound();
        const options = await loadFormOptions(spec);
        return <Shell user={user} nav={getNavItems()}><Entity spec={spec} data={data} mode="edit" options={options} /></Shell>;
      }), { generateMetadata: ({ params }) => createMetadata('edit', params.entity, params.id) }),
    };
  }

  generateComponents() {
    const { entityName, spec } = this;
    const createComp = (Builder, displayName, extraProps = {}) => {
      const Comp = forwardRef((props, ref) => <Builder entity={entityName} spec={spec} {...extraProps} {...props} />);
      Comp.displayName = displayName;
      return Comp;
    };

    const { ListBuilder } = require('@/components/builders/list-builder');
    const { FormBuilder } = require('@/components/builders/form-builder');
    const { EntityDetail: ED } = require('@/components/entity-detail');

    const createFormComp = (mode) => createComp(FormBuilder, `${mode.charAt(0).toUpperCase() + mode.slice(1)}${spec.label}`, { mode });

    return {
      List: createComp(ListBuilder, `List${spec.label}`),
      Detail: createComp(ED, `Detail${spec.label}`),
      Create: createFormComp('create'),
      Edit: createFormComp('edit'),
    };
  }

  generateRoutes() {
    const handler = createCrudHandlers(this.entityName);
    return { GET: handler, POST: handler, PUT: handler, DELETE: handler, PATCH: handler };
  }

  generateActions() {
    const { entityName, spec } = this;
    const createAction = (action, handler) => async (...args) => {
      const { getUser } = await import('@/engine.server');
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');
      if (!can(user, spec, action)) throw new Error('Permission denied');
      return handler(user, ...args);
    };

    return {
      create: createAction('create', async (user, formData) => {
        const result = create(entityName, Object.fromEntries(formData), user);
        revalidatePath(`/${entityName}`);
        redirect(`/${entityName}/${result.id}`);
      }),
      update: createAction('edit', async (user, id, formData) => {
        update(entityName, id, Object.fromEntries(formData), user);
        revalidatePath(`/${entityName}/${id}`);
        redirect(`/${entityName}/${id}`);
      }),
      delete: createAction('delete', async (user, id) => {
        remove(entityName, id);
        revalidatePath(`/${entityName}`);
        redirect(`/${entityName}`);
      }),
    };
  }

  generateAll() {
    return { pages: this.generatePages(), components: this.generateComponents(), routes: this.generateRoutes(), actions: this.generateActions() };
  }
}

export function getEntityGenerator(entityName) {
  if (!generatorCache.has(entityName)) generatorCache.set(entityName, new EntityGenerator(entityName));
  return generatorCache.get(entityName);
}

export function clearGeneratorCache() { generatorCache.clear(); }
