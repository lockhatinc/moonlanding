import { spec } from '../spec-builder.js';
import { withTimestamps } from '../spec-templates.js';

export const recreationLogSpec = withTimestamps(
  spec('recreation_log')
    .label('Recreation Log', 'Recreation Logs')
    .icon('Copy')
    .order(45)
)
  .fields({
    engagement_id: { type: 'ref', ref: 'engagement', required: true },
    new_engagement_id: { type: 'ref', ref: 'engagement' },
    client_id: { type: 'ref', ref: 'client', required: true },
    status: { type: 'enum', options: 'recreation_status', required: true, list: true, default: 'pending' },
    recreation_type: { type: 'enum', options: 'recreation_type', required: true, list: true },
    error: { type: 'textarea' },
    details: { type: 'json' },
  })
  .options('recreation_status', {
    pending: { label: 'Pending', color: 'yellow' },
    success: { label: 'Success', color: 'green' },
    failed: { label: 'Failed', color: 'red' },
  })
  .options('recreation_type', {
    yearly: { label: 'Yearly', color: 'blue' },
    monthly: { label: 'Monthly', color: 'green' },
    manual: { label: 'Manual', color: 'amber' },
  })
  .list({
    groupBy: 'status',
    defaultSort: { field: 'created_at', dir: 'desc' },
    searchFields: [],
    displayRules: {
      status: { renderAs: 'badge', colorMapping: 'recreation_status' },
      recreation_type: { renderAs: 'badge', colorMapping: 'recreation_type' },
    },
  })
  .fieldPermissions({
    engagement_id: { view: ['partner', 'manager'], edit: [] },
    new_engagement_id: { view: ['partner', 'manager'], edit: [] },
    status: { view: ['partner', 'manager'], edit: [] },
    error: { view: ['partner'], edit: [] },
  })
  .rowAccess({
    scope: 'engagement_scope'
  })
  .validate({
    engagement_id: [
      { type: 'required', message: 'Source engagement is required' },
    ],
    client_id: [
      { type: 'required', message: 'Client is required' },
    ],
  })
  .build();
