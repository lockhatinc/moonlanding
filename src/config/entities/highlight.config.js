import { spec } from '../spec-builder.js';

export const highlightSpec = spec('highlight')
  .label('Highlight', 'Highlights')
  .icon('Highlighter')
  .order(5)
  .parent('review')
  .embedded()
  .computedField('created_by_display', '(SELECT name FROM user WHERE user.id = highlight.created_by LIMIT 1)')
  .computedField('resolved_by_display', '(SELECT name FROM user WHERE user.id = highlight.resolved_by LIMIT 1)')
  .fields({
    review_id: { type: 'ref', ref: 'review', required: true },
    page_number: { type: 'int', required: true },
    text: { type: 'textarea', required: true },
    position_data: { type: 'json' },
    status: { type: 'enum', options: 'highlight_status', required: true, default: 'unresolved' },
    severity: { type: 'enum', options: 'severity', default: 'medium' },
    created_at: { type: 'int', auto: 'now', hidden: true },
    updated_at: { type: 'int', auto: 'update', hidden: true },
    created_by: { type: 'ref', ref: 'user', display: 'user.name', auto: 'user', hidden: true },
    resolved_by: { type: 'ref', ref: 'user', display: 'user.name', hidden: true },
    resolved_at: { type: 'int', hidden: true },
  })
  .options('highlight_status', {
    unresolved: { label: 'Unresolved', color: 'red' },
    partially_resolved: { label: 'Partially Resolved', color: 'yellow' },
    resolved: { label: 'Resolved', color: 'green' },
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
  .validate({
    text: [
      { type: 'required', message: 'Highlight text is required' },
      { type: 'minLength', value: 1, message: 'Highlight text cannot be empty' },
    ],
    review_id: [
      { type: 'required', message: 'Review is required' },
    ],
    page_number: [
      { type: 'required', message: 'Page number is required' },
      { type: 'range', min: 1, max: 9999, message: 'Page number must be positive' },
    ],
    status: [
      { type: 'required', message: 'Status is required' },
    ],
  })
  .components({
    detail: 'HighlightDetailView',
    list: 'HighlightListView',
  })
  .build();
