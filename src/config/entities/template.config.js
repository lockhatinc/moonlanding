import { spec } from '../spec-builder.js';
import { withAuditFields, withComputedCreator } from '../spec-templates.js';

export const templateSpec = withComputedCreator(
  withAuditFields(
    spec('template')
      .label('Review Template', 'Review Templates')
      .icon('Layout')
      .order(9)
  )
)
  .fields({
    name: { type: 'text', required: true, list: true, search: true, minLength: 3, maxLength: 100 },
    description: { type: 'textarea' },
    default_checklists: { type: 'json', default: '[]', hidden: true },
    sections: { type: 'json', default: '[]', hidden: true },
    status: { type: 'enum', options: 'template_status', required: true, list: true, default: 'active' },
    is_default: { type: 'bool', default: false, list: true },
  })
  .options('template_status', {
    active: { label: 'Active', color: 'green' },
    archived: { label: 'Archived', color: 'gray' },
  })
  .list({
    groupBy: 'status',
    defaultSort: { field: 'created_at', dir: 'desc' },
    searchFields: ['name', 'description'],
    displayRules: {
      name: { truncate: 50 },
      description: { truncate: 100 },
      status: { renderAs: 'badge', colorMapping: 'template_status' },
      is_default: { renderAs: 'badge', renderValue: 'Default' },
    },
  })
  .transitions({
    active: ['archived'],
    archived: ['active'],
  })
  .fieldPermissions({
    name: { view: 'all', edit: ['partner'] },
    default_checklists: { view: ['partner', 'manager'], edit: ['partner'] },
    sections: { view: ['partner', 'manager'], edit: ['partner'] },
    is_default: { view: 'all', edit: ['partner'] },
  })
  .rowAccess({
    scope: 'all_authenticated'
  })
  .validate({
    name: [
      { type: 'required', message: 'Template name is required' },
      { type: 'minLength', message: 'Name must be at least 3 characters' },
    ],
  })
  .onLifecycle({
    onCreate: { action: 'log', level: 'info', message: 'Review template created' },
  })
  .formSections({
    general: {
      label: 'General Information',
      fields: ['name', 'description', 'is_default'],
    },
    checklists: {
      label: 'Default Checklists',
      fields: ['default_checklists', 'sections'],
    },
    status: {
      label: 'Status',
      fields: ['status'],
    },
  })
  .build();
