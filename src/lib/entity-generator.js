import dynamic from '@/lib/next-polyfills';
import { specs, getSpec } from '@/config/spec-helpers';
import { ERROR_MESSAGES } from '@/config';
import { list, search, searchWithPagination, get, getChildren, batchGetChildren, listWithPagination, create, update, remove } from '@/engine';
import { can } from '@/services/permission.service';
import { loadFormOptions } from '@/lib/utils';
import { withPageAuth } from '@/lib/auth-middleware';
import { UnauthorizedError, PermissionError } from '@/lib/error-handler';
import { createCrudHandlers } from '@/lib/crud-factory';
import { Shell } from '@/components/layout';
import { notFound } from '@/lib/next-polyfills';
import { revalidatePath } from '@/lib/next-polyfills';
import { redirect } from '@/lib/next-polyfills';
import { forwardRef } from 'react';
import { getNavItems } from '@/config/spec-helpers';
import { QueryAdapter } from '@/lib/query-string-adapter';
import { ListBuilder } from '@/components/builders/list-builder';
import { FormBuilder } from '@/components/builders/form-builder';
import { EntityDetail as ED } from '@/components/entity-detail';

const Entity = dynamic(() => import('@/lib/entity-component').then(m => ({ default: m.Entity })), { ssr: true });
const EntityDetail = dynamic(() => import('@/components/entity-detail').then(m => ({ default: m.EntityDetail })), { ssr: true });

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
        const { q, page, pageSize } = QueryAdapter.fromSearchParams(searchParams, spec);
        const result = q ? await searchWithPagination(spec.name, q, {}, page, pageSize) : await listWithPagination(spec.name, {}, page, pageSize);
        const ListComp = spec.list?.component === 'review-list' ? (await import('@/components/domain')).ReviewList : Entity;
        const listProps = spec.list?.component === 'review-list'
          ? { spec, data: result.items, pagination: result.pagination, user, canCreate: can(user, spec, 'create') }
          : { spec, data: result.items, mode: 'list', pagination: result.pagination, canCreate: can(user, spec, 'create') };
        return <Shell user={user} nav={getNavItems()}><ListComp {...listProps} /></Shell>;
      }), { generateMetadata: ({ params }) => createMetadata('list', params.entity) }),

      DetailPage: Object.assign(createPage('view', async ({ user, spec, params }) => {
        const data = get(spec.name, params.id);
        if (!data) notFound();
        const children = spec.children ? await batchGetChildren(spec.name, params.id, spec.children) : {};
        const Comp = spec.detail?.component === 'review-detail' ? (await import('@/components/domain')).ReviewDetail : EntityDetail;
        return <Shell user={user} nav={getNavItems()}><Comp spec={spec} data={data} children={children} user={user} canEdit={can(user, spec, 'edit')} canDelete={can(user, spec, 'delete')} /></Shell>;
      }), { generateMetadata: ({ params }) => createMetadata('detail', params.entity, params.id) }),

      CreatePage: Object.assign(createPage('create', async ({ user, spec }) => {
        const options = await loadFormOptions(spec);
        return <Shell user={user} nav={getNavItems()}><Entity spec={spec} mode="create" options={options} entityName={spec.name} /></Shell>;
      }), { generateMetadata: ({ params }) => createMetadata('new', params.entity) }),

      EditPage: Object.assign(createPage('edit', async ({ user, spec, params }) => {
        const data = get(spec.name, params.id);
        if (!data) notFound();
        const options = await loadFormOptions(spec);
        return <Shell user={user} nav={getNavItems()}><Entity spec={spec} data={data} mode="edit" options={options} entityName={spec.name} /></Shell>;
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
      if (!user) throw UnauthorizedError('Authentication required');
      if (!can(user, spec, action)) throw PermissionError(`Cannot ${action} ${spec.name}`);
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
