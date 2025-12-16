import { specs } from '@/config';
import { forwardRef } from 'react';

export function createListComponent(entityName, options = {}) {
  const spec = specs[entityName];
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const Component = forwardRef(({ ...props }, ref) => {
    const { ListBuilder } = require('@/components/builders/list-builder');
    return <ListBuilder entity={entityName} spec={spec} {...props} />;
  });
  Component.displayName = `List${spec.label}`;
  return Component;
}

export function createDetailComponent(entityName, options = {}) {
  const spec = specs[entityName];
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const customComponent = spec.detail?.component;
  if (customComponent) {
    return require(`@/components/${customComponent}`).default;
  }

  const Component = forwardRef(({ id, ...props }, ref) => {
    const { EntityDetail } = require('@/components/entity-detail/entity-detail');
    return <EntityDetail entity={entityName} spec={spec} id={id} {...props} />;
  });
  Component.displayName = `Detail${spec.label}`;
  return Component;
}

export function createFormComponent(entityName, mode = 'create', options = {}) {
  const spec = specs[entityName];
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const Component = forwardRef(({ data, onSubmit, ...props }, ref) => {
    const { FormBuilder } = require('@/components/builders/form-builder');
    return <FormBuilder entity={entityName} spec={spec} mode={mode} data={data} onSubmit={onSubmit} {...props} />;
  });
  Component.displayName = `${mode.charAt(0).toUpperCase() + mode.slice(1)}${spec.label}`;
  return Component;
}

export function createSearchComponent(entityName, options = {}) {
  const spec = specs[entityName];
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const Component = forwardRef(({ onSearch, ...props }, ref) => {
    const { SearchInput } = require('@/components/search-input');
    return <SearchInput entity={entityName} spec={spec} onSearch={onSearch} {...props} />;
  });
  Component.displayName = `Search${spec.label}`;
  return Component;
}

export function createFilterComponent(entityName, options = {}) {
  const spec = specs[entityName];
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const Component = forwardRef(({ onFilter, ...props }, ref) => {
    const { FilterPanel } = require('@/components/filter-panel');
    return <FilterPanel entity={entityName} spec={spec} onFilter={onFilter} {...props} />;
  });
  Component.displayName = `Filter${spec.label}`;
  return Component;
}

export function createDialogComponent(entityName, mode = 'create', options = {}) {
  const spec = specs[entityName];
  if (!spec) throw new Error(`Unknown entity: ${entityName}`);

  const Component = forwardRef(({ isOpen, onClose, data, onSubmit, ...props }, ref) => {
    const { Dialog } = require('@/components/dialogs/dialog');
    const Form = createFormComponent(entityName, mode, options);
    return (
      <Dialog isOpen={isOpen} onClose={onClose} title={`${mode === 'create' ? 'New' : 'Edit'} ${spec.label}`}>
        <Form data={data} onSubmit={onSubmit} {...props} />
      </Dialog>
    );
  });
  Component.displayName = `${mode.charAt(0).toUpperCase() + mode.slice(1)}${spec.label}Dialog`;
  return Component;
}

export function getComponentRegistry() {
  return Object.entries(specs).reduce((acc, [name, spec]) => {
    acc[name] = {
      List: createListComponent(name),
      Detail: createDetailComponent(name),
      Create: createFormComponent(name, 'create'),
      Edit: createFormComponent(name, 'edit'),
      CreateDialog: createDialogComponent(name, 'create'),
      EditDialog: createDialogComponent(name, 'edit'),
      Search: createSearchComponent(name),
      Filter: createFilterComponent(name),
    };
    return acc;
  }, {});
}
