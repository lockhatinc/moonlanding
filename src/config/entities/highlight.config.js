import { spec } from '../spec-builder.js';
import { withAuditFields, withComputedCreator, withComputedResolver } from '../spec-templates.js';
import { HIGHLIGHT_STATUS_OPTIONS, SEVERITY_OPTIONS } from '../enum-options.js';

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
  .options('highlight_status', HIGHLIGHT_STATUS_OPTIONS)
  .options('severity', SEVERITY_OPTIONS)
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
