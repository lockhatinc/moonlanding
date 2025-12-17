import { specs, getSpec } from '@/config';
import { list, search, get, getChildren, listWithPagination, create, update, remove } from '@/engine';
import { getUser } from '@/engine.server';
import { can } from '@/lib/permissions';
import { loadFormOptions } from '@/lib/utils';
import { requireEntityAccess, listMetadata, detailMetadata, newMetadata, editMetadata } from '@/lib/route-helpers';
import { Entity } from '@/lib/entity-component';
import { EntityDetail } from '@/components/entity-detail';
import { Shell } from '@/components/layout';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { forwardRef } from 'react';
import { getNavItems } from '@/config';
import { ok, created, badRequest, unauthorized, serverError, parseParams } from '@/lib/api-helpers';
import { broadcastUpdate } from '@/lib/realtime-server';
import { logger } from '@/lib/logger';
import { executeHook } from '@/lib/hook-registry';
import { validateEntity, validateUpdate } from '@/lib/validation-engine';

const generatorCache = new Map();

export class EntityGenerator {
  constructor(entityName, spec = null) {
    this.entityName = entityName;
    this.spec = spec || getSpec(entityName);
  }

  generatePages() {
    return {
      ListPage: this._createListPage(),
      DetailPage: this._createDetailPage(),
      CreatePage: this._createCreatePage(),
      EditPage: this._createEditPage(),
    };
  }

  _createListPage() {
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
          <Entity spec={spec} data={data} mode="list" pagination={pagination} canCreate={can(user, spec, 'create')} />
        </Shell>
      );
    };
    ListPage.generateMetadata = ({ params }) => listMetadata(params.entity);
    return ListPage;
  }

  _createDetailPage() {
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

      const Comp = spec.detail?.component === 'review-detail' ? (await import('@/components/domain')).ReviewDetail : EntityDetail;

      return (
        <Shell user={user} nav={getNavItems()}>
          <Comp spec={spec} data={data} children={children} user={user} canEdit={can(user, spec, 'edit')} canDelete={can(user, spec, 'delete')} />
        </Shell>
      );
    };
    DetailPage.generateMetadata = ({ params }) => detailMetadata(params.entity, params.id);
    return DetailPage;
  }

  _createCreatePage() {
    const CreatePage = async ({ params }) => {
      const { entity } = await params;
      const { user, spec } = await requireEntityAccess(entity, 'create');
      const options = await loadFormOptions(spec);

      return (
        <Shell user={user} nav={getNavItems()}>
          <Entity spec={spec} mode="create" options={options} />
        </Shell>
      );
    };
    CreatePage.generateMetadata = ({ params }) => newMetadata(params.entity);
    return CreatePage;
  }

  _createEditPage() {
    const EditPage = async ({ params }) => {
      const { entity, id } = await params;
      const { user, spec } = await requireEntityAccess(entity, 'edit');
      const data = get(entity, id);
      if (!data) notFound();
      const options = await loadFormOptions(spec);

      return (
        <Shell user={user} nav={getNavItems()}>
          <Entity spec={spec} data={data} mode="edit" options={options} />
        </Shell>
      );
    };
    EditPage.generateMetadata = ({ params }) => editMetadata(params.entity, params.id);
    return EditPage;
  }

  generateComponents() {
    return {
      List: this._createListComponent(),
      Detail: this._createDetailComponent(),
      Create: this._createFormComponent('create'),
      Edit: this._createFormComponent('edit'),
      Search: this._createSearchComponent(),
      Filter: this._createFilterComponent(),
      CreateDialog: this._createDialogComponent('create'),
      EditDialog: this._createDialogComponent('edit'),
    };
  }

  _createListComponent() {
    const { ListBuilder } = require('@/components/builders/list-builder');
    const Component = forwardRef(({ ...props }, ref) => (
      <ListBuilder entity={this.entityName} spec={this.spec} {...props} />
    ));
    Component.displayName = `List${this.spec.label}`;
    return Component;
  }

  _createDetailComponent() {
    const { EntityDetail } = require('@/components/entity-detail/entity-detail');
    const Component = forwardRef(({ id, ...props }, ref) => (
      <EntityDetail entity={this.entityName} spec={this.spec} id={id} {...props} />
    ));
    Component.displayName = `Detail${this.spec.label}`;
    return Component;
  }

  _createFormComponent(mode) {
    const { FormBuilder } = require('@/components/builders/form-builder');
    const Component = forwardRef(({ data, onSubmit, ...props }, ref) => (
      <FormBuilder entity={this.entityName} spec={this.spec} mode={mode} data={data} onSubmit={onSubmit} {...props} />
    ));
    Component.displayName = `${mode.charAt(0).toUpperCase() + mode.slice(1)}${this.spec.label}`;
    return Component;
  }

  _createSearchComponent() {
    const { SearchInput } = require('@/components/search-input');
    const Component = forwardRef(({ onSearch, ...props }, ref) => (
      <SearchInput entity={this.entityName} spec={this.spec} onSearch={onSearch} {...props} />
    ));
    Component.displayName = `Search${this.spec.label}`;
    return Component;
  }

  _createFilterComponent() {
    const { FilterPanel } = require('@/components/filter-panel');
    const Component = forwardRef(({ onFilter, ...props }, ref) => (
      <FilterPanel entity={this.entityName} spec={this.spec} onFilter={onFilter} {...props} />
    ));
    Component.displayName = `Filter${this.spec.label}`;
    return Component;
  }

  _createDialogComponent(mode) {
    const { Dialog } = require('@/components/dialogs/dialog');
    const Form = this._createFormComponent(mode);
    const Component = forwardRef(({ isOpen, onClose, data, onSubmit, ...props }, ref) => (
      <Dialog isOpen={isOpen} onClose={onClose} title={`${mode === 'create' ? 'New' : 'Edit'} ${this.spec.label}`}>
        <Form data={data} onSubmit={onSubmit} {...props} />
      </Dialog>
    ));
    Component.displayName = `${mode.charAt(0).toUpperCase() + mode.slice(1)}${this.spec.label}Dialog`;
    return Component;
  }

  generateRoutes() {
    return {
      GET: this._createGetRoute(),
      POST: this._createPostRoute(),
      PUT: this._createPutRoute(),
      DELETE: this._createDeleteRoute(),
      PATCH: this._createPatchRoute(),
    };
  }

  _createGetRoute() {
    return async (request, { params }) => {
      try {
        const { entity, id, childKey } = await parseParams(params);
        const spec = getSpec(entity);
        const user = await getUser();
        if (!user) return unauthorized('Not authenticated');
        if (!can(user, spec, 'list')) return unauthorized('Permission denied');

        const q = new URL(request.url).searchParams.get('q');
        if (id && !childKey) {
          const record = get(entity, id);
          return record ? ok(record) : serverError('Not found');
        }
        if (id && childKey) {
          const childDef = spec.children?.[childKey];
          if (!childDef) return serverError('Unknown child');
          return ok(getChildren(entity, id, childDef));
        }
        const results = q ? search(entity, q) : list(entity);
        return ok(results);
      } catch (e) {
        logger.apiError('GET', this.entityName, e);
        return serverError(e.message);
      }
    };
  }

  _createPostRoute() {
    return async (request, { params }) => {
      try {
        const { entity } = await parseParams(params);
        const spec = getSpec(entity);
        const user = await getUser();
        if (!user) return unauthorized('Not authenticated');
        if (!can(user, spec, 'create')) return unauthorized('Permission denied');

        const data = await request.json();
        const errors = await validateEntity(spec, data);
        if (Object.keys(errors).length) return badRequest(errors);

        const context = await executeHook(`create:${entity}:before`, { entity, data, user });
        const result = create(context.entity, context.data, user);
        await executeHook(`create:${entity}:after`, { entity, data: result, user });
        broadcastUpdate(`/api/${entity}`, 'create', result);
        return created(result);
      } catch (e) {
        logger.apiError('POST', this.entityName, e);
        return serverError(e.message);
      }
    };
  }

  _createPutRoute() {
    return async (request, { params }) => {
      try {
        const { entity, id } = await parseParams(params);
        if (!id) return badRequest('ID required');

        const spec = getSpec(entity);
        const user = await getUser();
        if (!user) return unauthorized('Not authenticated');
        if (!can(user, spec, 'edit')) return unauthorized('Permission denied');

        const prev = get(entity, id);
        if (!prev) return serverError('Not found');

        const data = await request.json();
        const errors = await validateUpdate(spec, id, data);
        if (Object.keys(errors).length) return badRequest(errors);

        const context = await executeHook(`update:${entity}:before`, { entity, id, data, user, prev });
        update(context.entity, context.id, context.data, user);
        const result = get(entity, id);
        await executeHook(`update:${entity}:after`, { entity, id, data: result, user });
        broadcastUpdate(`/api/${entity}/${id}`, 'update', result);
        broadcastUpdate(`/api/${entity}`, 'update', result);

        return ok(result);
      } catch (e) {
        logger.apiError('PUT', this.entityName, e);
        return serverError(e.message);
      }
    };
  }

  _createDeleteRoute() {
    return async (request, { params }) => {
      try {
        const { entity, id } = await parseParams(params);
        if (!id) return badRequest('ID required');

        const spec = getSpec(entity);
        const user = await getUser();
        if (!user) return unauthorized('Not authenticated');
        if (!can(user, spec, 'delete')) return unauthorized('Permission denied');

        const record = get(entity, id);
        if (!record) return serverError('Not found');

        const context = await executeHook(`delete:${entity}:before`, { entity, id, record, user });
        if (spec.fields.status) {
          update(context.entity, context.id, { status: 'deleted' }, user);
        } else {
          remove(context.entity, context.id);
        }
        await executeHook(`delete:${entity}:after`, { entity, id, record, user });
        broadcastUpdate(`/api/${entity}/${id}`, 'delete', { id });
        broadcastUpdate(`/api/${entity}`, 'delete', { id });

        return ok({ success: true });
      } catch (e) {
        logger.apiError('DELETE', this.entityName, e);
        return serverError(e.message);
      }
    };
  }

  _createPatchRoute() {
    return this._createPutRoute();
  }

  generateActions() {
    return {
      create: this._createCreateAction(),
      update: this._createUpdateAction(),
      delete: this._createDeleteAction(),
    };
  }

  _createCreateAction() {
    return async (formData) => {
      try {
        const user = await getUser();
        if (!user) throw new Error('Not authenticated');
        if (!can(user, this.spec, 'create')) throw new Error('Permission denied');

        const result = create(this.entityName, Object.fromEntries(formData), user);
        revalidatePath(`/${this.entityName}`);
        redirect(`/${this.entityName}/${result.id}`);
      } catch (e) {
        logger.apiError('create', this.entityName, e);
        throw e;
      }
    };
  }

  _createUpdateAction() {
    return async (id, formData) => {
      try {
        const user = await getUser();
        if (!user) throw new Error('Not authenticated');
        if (!can(user, this.spec, 'edit')) throw new Error('Permission denied');

        update(this.entityName, id, Object.fromEntries(formData), user);
        revalidatePath(`/${this.entityName}/${id}`);
        redirect(`/${this.entityName}/${id}`);
      } catch (e) {
        logger.apiError('update', this.entityName, e);
        throw e;
      }
    };
  }

  _createDeleteAction() {
    return async (id) => {
      try {
        const user = await getUser();
        if (!user) throw new Error('Not authenticated');
        if (!can(user, this.spec, 'delete')) throw new Error('Permission denied');

        remove(this.entityName, id);
        revalidatePath(`/${this.entityName}`);
        redirect(`/${this.entityName}`);
      } catch (e) {
        logger.apiError('delete', this.entityName, e);
        throw e;
      }
    };
  }

  generateAll() {
    return {
      pages: this.generatePages(),
      components: this.generateComponents(),
      routes: this.generateRoutes(),
      actions: this.generateActions(),
    };
  }
}

export function getEntityGenerator(entityName) {
  if (!generatorCache.has(entityName)) {
    generatorCache.set(entityName, new EntityGenerator(entityName));
  }
  return generatorCache.get(entityName);
}

export function clearGeneratorCache() {
  generatorCache.clear();
}
