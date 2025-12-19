import { spec } from '../spec-builder.js';
import { withAuditFields, withComputedCreator, withComputedReviewer } from '../spec-templates.js';

export const reviewSpec = withComputedReviewer(
  withComputedCreator(
    withAuditFields(
      spec('review')
        .label('Review', 'Reviews')
        .icon('FileText')
        .order(4)
        .parent('engagement')
    )
  )
)
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    title: { type: 'text', required: true, list: true, search: true, minLength: 3 },
    document_url: { type: 'text' },
    status: { type: 'enum', options: 'review_status', required: true, list: true, default: 'active' },
    reviewer_id: { type: 'ref', ref: 'user', display: 'user.name' },
    assigned_to: { type: 'ref', ref: 'user', display: 'user.name' },
    template_id: { type: 'ref', ref: 'template' },
    deadline: { type: 'int' },
    is_tender: { type: 'bool', default: false, list: true },
    default_checklists: { type: 'json', default: '[]', hidden: true },
    sections: { type: 'json', default: '[]', hidden: true },
    tender_flags: { type: 'json', default: '[]', hidden: true },
  })
  .options('review_status', {
    active: { label: 'Active', color: 'blue' },
    open: { label: 'Open', color: 'yellow' },
    closed: { label: 'Closed', color: 'green' },
  })
  .children({
    highlights: {
      entity: 'highlight',
      label: 'Highlights',
      fk: 'review_id',
    },
    checklists: {
      entity: 'checklist',
      label: 'Checklists',
      fk: 'review_id',
    },
    collaborators: {
      entity: 'collaborator',
      label: 'Collaborators',
      fk: 'review_id',
    },
    flags: {
      entity: 'flag',
      label: 'Flags',
      fk: 'review_id',
    },
  })
  .fieldPermissions({
    template_id: { view: 'all', edit: ['partner', 'manager'] },
    deadline: { view: 'all', edit: ['partner'] },
    is_tender: { view: 'all', edit: ['partner', 'manager'] },
    default_checklists: { view: ['partner', 'manager'], edit: ['partner'] },
    sections: { view: ['partner', 'manager'], edit: ['partner', 'manager'] },
  })
  .form({
    sections: [
      { label: 'Basic Info', fields: ['title', 'document_url', 'template_id', 'reviewer_id'] },
      { label: 'Review Workflow', fields: ['status', 'deadline', 'is_tender'] },
      { label: 'Collaboration', fields: ['assigned_to'] },
    ],
  })
  .formSections({
    general: {
      label: 'General Information',
      fields: ['title', 'document_url', 'template_id'],
    },
    workflow: {
      label: 'Review Workflow',
      fields: ['status', 'reviewer_id', 'assigned_to'],
    },
    tender: {
      label: 'Tender Information',
      fields: ['is_tender', 'deadline'],
    },
  })
  .transitions({
    active: ['open', 'closed'],
    open: ['closed', 'archived'],
    closed: ['archived'],
    archived: [],
  })
  .onLifecycle({
    onCreate: { action: 'notify', template: 'review_created', recipients: 'reviewer_id' },
    onStatusChange: { action: 'notify', template: 'review_status_changed', recipients: 'reviewer_id' },
  })
  .build();
