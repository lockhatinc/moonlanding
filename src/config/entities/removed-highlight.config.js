import { spec } from '../spec-builder.js';
import { withAuditFields } from '../spec-templates.js';

export const removedHighlightSpec = withAuditFields(
  spec('removed_highlight')
    .label('Removed Highlight', 'Removed Highlights')
    .icon('Trash2')
    .order(50)
    .embedded()
)
  .fields({
    review_id: { type: 'ref', ref: 'review', required: true },
    original_highlight_id: { type: 'text', required: true },
    page_number: { type: 'int', required: true, min: 1, max: 9999 },
    text: { type: 'textarea', required: true },
    position_data: { type: 'json' },
    status: { type: 'enum', options: 'highlight_status' },
    severity: { type: 'enum', options: 'severity' },
    resolved_by_display: { type: 'text' },
    removed_by: { type: 'ref', ref: 'user', display: 'user.name', required: true },
    removed_at: { type: 'int', required: true },
    removal_reason: { type: 'textarea' },
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
  .rowAccess({
    scope: 'review_scope'
  })
  .validate({
    original_highlight_id: [
      { type: 'required', message: 'Original highlight ID is required' },
    ],
  })
  .onLifecycle({
    onCreate: { action: 'log', level: 'info', message: 'Highlight archived to removed_highlights' },
  })
  .build();
