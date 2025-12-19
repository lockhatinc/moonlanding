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
    status: { type: 'enum', options: 'highlight_status', required: true, default: 'unresolved' },
    severity: { type: 'enum', options: 'severity', default: 'medium' },
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
  .components({
    detail: 'HighlightDetailView',
    list: 'HighlightListView',
  })
  .build();
