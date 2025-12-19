import { spec } from '../spec-builder.js';
import { withAuditFields, withComputedCreator, withComputedResolver } from '../spec-templates.js';

export const highlightSpec = withComputedResolver(
  withComputedCreator(
    withAuditFields(
      spec('highlight')
        .label('Highlight', 'Highlights')
        .icon('Highlighter')
        .order(5)
        .parent('review')
        .embedded()
    )
  )
)
  .fields({
    review_id: { type: 'ref', ref: 'review', required: true },
    page_number: { type: 'int', required: true, min: 1, max: 9999 },
    text: { type: 'textarea', required: true, minLength: 1 },
    position_data: { type: 'json' },
    file_id: { type: 'text', default: 'general' },
    color_code: { type: 'text', default: '#B0B0B0', hidden: true },
    status: { type: 'enum', options: 'highlight_status', required: true, list: true, default: 'unresolved' },
    severity: { type: 'enum', options: 'severity', default: 'medium' },
    is_partner_note: { type: 'bool', default: false, list: true },
    scrolled_to: { type: 'bool', default: false, hidden: true },
    resolved_by: { type: 'ref', ref: 'user', display: 'user.name', hidden: true },
    resolved_at: { type: 'int', hidden: true },
  })
  .options('highlight_status', {
    unresolved: { label: 'Unresolved', color: 'red', hexColor: '#B0B0B0' },
    partially_resolved: { label: 'Partially Resolved', color: 'yellow', hexColor: '#7F7EFF' },
    resolved: { label: 'Resolved', color: 'green', hexColor: '#44BBA4' },
  })
  .options('severity', {
    low: { label: 'Low', color: 'green' },
    medium: { label: 'Medium', color: 'yellow' },
    high: { label: 'High', color: 'red' },
  })
  .children({
    responses: {
      entity: 'response',
      label: 'Responses',
      fk: 'highlight_id',
    },
  })
  .list({
    defaultSort: { field: 'page_number', dir: 'asc' },
    searchFields: ['text'],
    displayRules: {
      text: { truncate: 100 },
      status: { renderAs: 'badge', colorMapping: 'highlight_status' },
      severity: { renderAs: 'badge', colorMapping: 'severity' },
      page_number: { format: 'number' },
      is_partner_note: { renderAs: 'badge', renderValue: 'Partner Note' },
    },
  })
  .fieldPermissions({
    status: { view: 'all', edit: ['partner', 'manager', 'clerk'] },
    severity: { view: 'all', edit: ['partner', 'manager'] },
    resolved_by: { view: 'all', edit: ['partner', 'manager'] },
    resolved_at: { view: 'all', edit: [] },
    is_partner_note: { view: 'all', edit: ['partner'] },
  })
  .validate({
    text: [
      { type: 'required', message: 'Highlight text is required' },
      { type: 'minLength', message: 'Text must be at least 1 character' },
    ],
    page_number: [
      { type: 'required', message: 'Page number is required' },
    ],
  })
  .components({
    detail: 'HighlightDetailView',
    list: 'HighlightListView',
  })
  .build();
